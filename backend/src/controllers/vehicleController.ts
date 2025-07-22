import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ApiResponse, PaginationResponse, VehicleCreateData } from '../types';

const prisma = new PrismaClient();

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

// Listar veículos com paginação
export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const ownerId = req.query.ownerId as string;
    const active = req.query.active === 'true';
    const licensePlate = req.query.licensePlate as string;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (ownerId) where.ownerId = ownerId;
    if (active !== undefined) where.active = active;
    if (licensePlate) {
        where.licensePlate = {
            contains: licensePlate.toUpperCase(),
            mode: 'insensitive'
        };
    }

    // Buscar veículos e total
    const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
            where,
            skip,
            take: limit,
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
                photos: {
                    take: 1, // Apenas a primeira foto para listagem
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        maintenances: true,
                        inspections: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
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

// Buscar veículo por ID
export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

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
            brand: true,
            model: true,
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

    const response: ApiResponse = {
        success: true,
        message: 'Vehicle found',
        data: vehicle
    };

    res.json(response);
});

// Atualizar veículo
export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

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

// Excluir veículo (soft delete)
export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const force = req.query.force === 'true';

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

// Buscar veículos por placa (busca parcial)
export const searchVehiclesByPlate = asyncHandler(async (req: Request, res: Response) => {
    const { plate } = req.params;

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
