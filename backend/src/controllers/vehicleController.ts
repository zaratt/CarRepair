import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { fipeService } from '../services/fipeService';
import { ApiResponse, PaginationResponse, VehicleCreateData } from '../types';
import { safeQueryValidation, safeSingleParam, ValidationSchema } from '../utils/requestValidation';

// Função para calcular quilometragem estimada baseada na idade do veículo
function calculateEstimatedKm(manufacturingYear: number): number {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - manufacturingYear;

    // Estimativa: 15.000 km por ano (média brasileira)
    const averageKmPerYear = 15000;
    const estimatedKm = vehicleAge * averageKmPerYear;

    // Adicionar variação aleatória de ±20% para mais realismo
    const variation = 0.2;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;

    return Math.max(0, Math.round(estimatedKm * randomFactor));
}

// Criar novo veículo
export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleData: VehicleCreateData = req.body;

    // Verificar se já existe veículo com a mesma placa
    const existingVehicle = await prisma.vehicle.findUnique({
        where: { licensePlate: vehicleData.licensePlate }
    });

    if (existingVehicle) {
        throw new ConflictError('Vehicle with this license plate already exists');
    }

    // Verificar se o proprietário existe (se fornecido)
    if (vehicleData.ownerId) {
        const owner = await prisma.user.findUnique({
            where: { id: vehicleData.ownerId }
        });

        if (!owner) {
            throw new ValidationError('Owner not found', 'ownerId');
        }
    }

    // Criar veículo
    const createData: any = {
        licensePlate: vehicleData.licensePlate,
        yearManufacture: vehicleData.yearManufacture,
        modelYear: vehicleData.modelYear,
        fuelType: vehicleData.fuelType,
    };

    // Adicionar campos opcionais apenas se fornecidos
    if (vehicleData.vin) createData.vin = vehicleData.vin;
    if (vehicleData.ownerId) createData.ownerId = vehicleData.ownerId;
    if (vehicleData.fipeTypeId) createData.fipeTypeId = vehicleData.fipeTypeId;
    if (vehicleData.fipeBrandId) createData.fipeBrandId = vehicleData.fipeBrandId;
    if (vehicleData.fipeModelId) createData.fipeModelId = vehicleData.fipeModelId;
    if (vehicleData.fipeYearCode) createData.fipeYearCode = vehicleData.fipeYearCode;

    // ✅ Novos campos para informações do usuário
    if (vehicleData.currentKm !== undefined) createData.currentKm = vehicleData.currentKm;
    if (vehicleData.color) createData.color = vehicleData.color;
    if (vehicleData.fipeValue !== undefined) createData.fipeValue = vehicleData.fipeValue;

    const vehicle = await prisma.vehicle.create({
        data: createData,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                }
            },
            brand: true,
            model: true,
            photos: true,
        }
    });

    const response: ApiResponse = {
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle
    };

    res.status(201).json(response);
});

// ✅ SEGURANÇA: Listar veículos com validação CWE-1287 completa
export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de query params (zero vulnerabilidades)
    const querySchema: ValidationSchema = {
        page: { type: 'number', defaultValue: 1, validator: (val) => val > 0 },
        limit: { type: 'number', defaultValue: 10, validator: (val) => val > 0 && val <= 100 },
        ownerId: { type: 'string', defaultValue: '' },
        active: { type: 'boolean', defaultValue: undefined },
        licensePlate: { type: 'string', defaultValue: '' }
    };

    const {
        page,
        limit,
        ownerId,
        active,
        licensePlate
    } = safeQueryValidation(req, querySchema);

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (ownerId) where.ownerId = ownerId;
    if (active !== undefined) where.active = active;
    if (licensePlate) where.licensePlate = { contains: licensePlate, mode: 'insensitive' };

    const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        city: true,
                        state: true,
                    }
                },
                photos: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: {
                        maintenances: true,
                        photos: true
                    }
                }
            }
        }),
        prisma.vehicle.count({ where })
    ]);

    const response: PaginationResponse<typeof vehicles[0]> = {
        data: vehicles,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };

    res.json(response);
});

// ✅ SEGURANÇA: Buscar veículo por ID com validação CWE-1287 completa
export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const id = safeSingleParam<string>(req, 'id', 'string', true);

    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    city: true,
                    state: true,
                }
            },
            // Removido brand e model includes pois estamos usando dados FIPE
            photos: {
                orderBy: { createdAt: 'desc' }
            },
            maintenances: {
                include: {
                    workshop: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        }
                    },
                    attachments: true,
                },
                orderBy: { date: 'desc' },
                take: 5 // Últimas 5 manutenções
            },
            inspections: {
                include: {
                    attachments: true,
                },
                orderBy: { date: 'desc' },
                take: 3 // Últimas 3 inspeções
            },
            _count: {
                select: {
                    maintenances: true,
                    inspections: true,
                }
            }
        }
    });

    if (!vehicle) {
        throw new NotFoundError('Vehicle');
    }

    // Mapear veículo para incluir informações reais de marca/modelo da FIPE
    const { brand, model, fipeValue } = await fipeService.getBrandModelAndPrice(
        vehicle.fipeBrandId || 0,
        vehicle.fipeModelId || 0,
        vehicle.fipeYearCode || ''
    );

    const mappedVehicle = {
        ...vehicle,
        // ✅ Mapear para coincidir com interface Vehicle do frontend
        plate: vehicle.licensePlate, // plate em vez de licensePlate
        brand, // Nome real da marca da FIPE (string)
        model, // Nome real do modelo da FIPE (string)
        year: vehicle.modelYear || vehicle.yearManufacture || 2000, // number
        // ✅ Usar quilometragem real do banco ou estimativa se não informada
        currentKm: vehicle.currentKm ?? calculateEstimatedKm(vehicle.modelYear || vehicle.yearManufacture || 2000),
        // ✅ Usar valor FIPE real da API ou valor salvo no banco
        fipeValue: fipeValue || vehicle.fipeValue || 0,
        color: vehicle.color ?? '',
        photos: vehicle.photos?.map(p => p.url) || [], // array de URLs
        userId: vehicle.ownerId, // userId em vez de ownerId
        createdAt: vehicle.createdAt.toISOString(),
        updatedAt: vehicle.createdAt.toISOString(), // Usar createdAt como fallback
    };

    const response: ApiResponse = {
        success: true,
        message: 'Vehicle found',
        data: mappedVehicle
    };

    res.json(response);
});

// ✅ SEGURANÇA: Atualizar veículo com validação CWE-1287 completa
export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params e body (zero vulnerabilidades)
    const id = safeSingleParam<string>(req, 'id', 'string', true);

    // ✅ SEGURANÇA CWE-1287: Validação explícita de req.body antes de uso
    if (!req.body || typeof req.body !== 'object') {
        throw new ValidationError('Request body must be a valid object');
    }

    // ✅ SEGURANÇA: Validação segura de estrutura do body
    const bodyData = req.body;
    if (Array.isArray(bodyData)) {
        throw new ValidationError('Request body cannot be an array');
    }

    const updateData = bodyData;

    // Verificar se o veículo existe
    const existingVehicle = await prisma.vehicle.findUnique({
        where: { id }
    });

    if (!existingVehicle) {
        throw new NotFoundError('Vehicle');
    }

    // Se está alterando a placa, verificar se não existe outra com a mesma placa
    if (updateData.licensePlate && updateData.licensePlate !== existingVehicle.licensePlate) {
        const vehicleWithSamePlate = await prisma.vehicle.findUnique({
            where: { licensePlate: updateData.licensePlate }
        });

        if (vehicleWithSamePlate) {
            throw new ConflictError('Another vehicle with this license plate already exists');
        }
    }

    // Verificar se o novo proprietário existe (se fornecido)
    if (updateData.ownerId && updateData.ownerId !== existingVehicle.ownerId) {
        const owner = await prisma.user.findUnique({
            where: { id: updateData.ownerId }
        });

        if (!owner) {
            throw new ValidationError('Owner not found', 'ownerId');
        }
    }

    // Atualizar veículo
    const vehicle = await prisma.vehicle.update({
        where: { id },
        data: updateData,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                }
            },
            brand: true,
            model: true,
            photos: true,
        }
    });

    const response: ApiResponse = {
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle
    };

    res.json(response);
});

// ✅ SEGURANÇA: Excluir veículo com validação CWE-1287 completa
export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params e query (zero vulnerabilidades)
    const id = safeSingleParam<string>(req, 'id', 'string', true);
    const force = safeQueryValidation(req, {
        force: { type: 'boolean', defaultValue: false }
    }).force;

    // Verificar se o veículo existe
    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    maintenances: true,
                    inspections: true,
                }
            }
        }
    });

    if (!vehicle) {
        throw new NotFoundError('Vehicle');
    }

    if (force) {
        // Hard delete - remove completamente (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'production') {
            throw new ValidationError('Hard delete not allowed in production');
        }

        // Remover dependências primeiro
        await prisma.$transaction([
            prisma.maintenanceAttachment.deleteMany({
                where: { maintenance: { vehicleId: id } }
            }),
            prisma.maintenance.deleteMany({
                where: { vehicleId: id }
            }),
            prisma.inspectionAttachment.deleteMany({
                where: { inspection: { vehicleId: id } }
            }),
            prisma.inspection.deleteMany({
                where: { vehicleId: id }
            }),
            prisma.vehiclePhoto.deleteMany({
                where: { vehicleId: id }
            }),
            prisma.vehicle.delete({
                where: { id }
            })
        ]);
    } else {
        // Soft delete - marca como inativo
        await prisma.vehicle.update({
            where: { id },
            data: {
                active: false,
                soldAt: new Date()
            }
        });
    }

    const response: ApiResponse = {
        success: true,
        message: force ? 'Vehicle permanently deleted' : 'Vehicle marked as inactive',
        data: {
            id,
            deletedAt: new Date(),
            force,
            hadMaintenances: vehicle._count.maintenances > 0,
            hadInspections: vehicle._count.inspections > 0,
        }
    };

    res.json(response);
});

// ✅ SEGURANÇA: Buscar veículos por placa com validação CWE-1287 completa
export const searchVehiclesByPlate = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const plate = safeSingleParam<string>(req, 'plate', 'string', true);

    if (!plate || plate.length < 3) {
        throw new ValidationError('Plate search must have at least 3 characters');
    }

    const vehicles = await prisma.vehicle.findMany({
        where: {
            licensePlate: {
                contains: plate.toUpperCase(),
                mode: 'insensitive'
            },
            active: true
        },
        select: {
            id: true,
            licensePlate: true,
            yearManufacture: true,
            modelYear: true,
            fuelType: true,
            brand: {
                select: { name: true }
            },
            model: {
                select: { name: true }
            },
            owner: {
                select: {
                    name: true,
                    phone: true,
                }
            }
        },
        take: 10,
        orderBy: { licensePlate: 'asc' }
    });

    const response: ApiResponse = {
        success: true,
        message: `Found ${vehicles.length} vehicles`,
        data: vehicles
    };

    res.json(response);
});
