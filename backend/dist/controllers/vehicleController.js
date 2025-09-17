"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVehiclesByPlate = exports.deleteVehicle = exports.updateVehicle = exports.getVehicleById = exports.getVehicles = exports.createVehicle = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const fipeService_1 = require("../services/fipeService");
// Função para calcular quilometragem estimada baseada na idade do veículo
function calculateEstimatedKm(manufacturingYear) {
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
exports.createVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const vehicleData = req.body;
    // Verificar se já existe veículo com a mesma placa
    const existingVehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { licensePlate: vehicleData.licensePlate }
    });
    if (existingVehicle) {
        throw new errorHandler_1.ConflictError('Vehicle with this license plate already exists');
    }
    // Verificar se o proprietário existe (se fornecido)
    if (vehicleData.ownerId) {
        const owner = await prisma_1.prisma.user.findUnique({
            where: { id: vehicleData.ownerId }
        });
        if (!owner) {
            throw new errorHandler_1.ValidationError('Owner not found', 'ownerId');
        }
    }
    // Criar veículo
    const createData = {
        licensePlate: vehicleData.licensePlate,
        yearManufacture: vehicleData.yearManufacture,
        modelYear: vehicleData.modelYear,
        fuelType: vehicleData.fuelType,
    };
    // Adicionar campos opcionais apenas se fornecidos
    if (vehicleData.vin)
        createData.vin = vehicleData.vin;
    if (vehicleData.ownerId)
        createData.ownerId = vehicleData.ownerId;
    if (vehicleData.fipeTypeId)
        createData.fipeTypeId = vehicleData.fipeTypeId;
    if (vehicleData.fipeBrandId)
        createData.fipeBrandId = vehicleData.fipeBrandId;
    if (vehicleData.fipeModelId)
        createData.fipeModelId = vehicleData.fipeModelId;
    if (vehicleData.fipeYearCode)
        createData.fipeYearCode = vehicleData.fipeYearCode;
    // ✅ Novos campos para informações do usuário
    if (vehicleData.currentKm !== undefined)
        createData.currentKm = vehicleData.currentKm;
    if (vehicleData.color)
        createData.color = vehicleData.color;
    if (vehicleData.fipeValue !== undefined)
        createData.fipeValue = vehicleData.fipeValue;
    const vehicle = await prisma_1.prisma.vehicle.create({
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
    const response = {
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle
    };
    res.status(201).json(response);
});
// Listar veículos com paginação
exports.getVehicles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA: Validar tipos dos parâmetros de query (CWE-1287 Prevention)
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const ownerId = req.query.ownerId;
    const activeParam = req.query.active;
    const licensePlate = req.query.licensePlate;
    // Validar tipos e converter valores
    let page = 1;
    let limit = 10;
    let active = undefined;
    if (pageParam !== undefined) {
        if (typeof pageParam !== 'string') {
            throw new errorHandler_1.ValidationError('Page parameter must be a string');
        }
        const parsedPage = parseInt(pageParam);
        if (isNaN(parsedPage) || parsedPage < 1) {
            throw new errorHandler_1.ValidationError('Page must be a positive number');
        }
        page = parsedPage;
    }
    if (limitParam !== undefined) {
        if (typeof limitParam !== 'string') {
            throw new errorHandler_1.ValidationError('Limit parameter must be a string');
        }
        const parsedLimit = parseInt(limitParam);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            throw new errorHandler_1.ValidationError('Limit must be a number between 1 and 100');
        }
        limit = parsedLimit;
    }
    if (ownerId !== undefined && typeof ownerId !== 'string') {
        throw new errorHandler_1.ValidationError('Owner ID must be a string');
    }
    if (activeParam !== undefined) {
        if (typeof activeParam !== 'string') {
            throw new errorHandler_1.ValidationError('Active parameter must be a string');
        }
        active = activeParam === 'true';
    }
    if (licensePlate !== undefined && typeof licensePlate !== 'string') {
        throw new errorHandler_1.ValidationError('License plate must be a string');
    }
    console.log('🔍 [BACKEND] getVehicles - Query params:', {
        page, limit, ownerId, active, licensePlate
    });
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    if (ownerId)
        where.ownerId = ownerId;
    if (active !== undefined)
        where.active = active;
    if (licensePlate) {
        // ✅ SEGURANÇA: Validação adicional antes do toUpperCase() (CWE-1287 Prevention)
        if (typeof licensePlate === 'string') {
            where.licensePlate = {
                contains: licensePlate.toUpperCase(),
                mode: 'insensitive'
            };
        }
    }
    console.log('🔍 [BACKEND] Filtros construídos:', where);
    // Verificar se há veículos no banco para esse ownerId
    const totalVehiclesForOwner = await prisma_1.prisma.vehicle.count({
        where: { ownerId }
    });
    console.log('🔍 [BACKEND] Total de veículos no banco para esse owner:', totalVehiclesForOwner);
    // Buscar veículos e total
    const [vehicles, total] = await Promise.all([
        prisma_1.prisma.vehicle.findMany({
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
                // Removido brand e model includes pois estamos usando dados FIPE
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
        prisma_1.prisma.vehicle.count({ where })
    ]);
    // Mapear veículos para incluir informações reais de marca/modelo da FIPE
    const mappedVehicles = await Promise.all(vehicles.map(async (vehicle) => {
        // Buscar dados reais da FIPE
        const { brand, model } = await fipeService_1.fipeService.getBrandAndModel(vehicle.fipeBrandId || 0, vehicle.fipeModelId || 0);
        return {
            ...vehicle,
            // ✅ Mapear para coincidir com interface Vehicle do frontend
            plate: vehicle.licensePlate, // plate em vez de licensePlate
            brand, // Nome real da marca da FIPE
            model, // Nome real do modelo da FIPE
            year: vehicle.modelYear || vehicle.yearManufacture || 2000, // number
            // ✅ Usar quilometragem real do banco ou estimativa se não informada
            currentKm: vehicle.currentKm ?? calculateEstimatedKm(vehicle.modelYear || vehicle.yearManufacture || 2000),
            // ✅ Usar valores reais do banco
            fipeValue: vehicle.fipeValue ?? 0,
            color: vehicle.color ?? '',
            photos: vehicle.photos?.map(p => p.url) || [], // array de URLs
            userId: vehicle.ownerId, // userId em vez de ownerId
            createdAt: vehicle.createdAt.toISOString(),
            updatedAt: vehicle.createdAt.toISOString(), // Usar createdAt como fallback
        };
    }));
    console.log('🔍 [BACKEND] Veículos encontrados:', vehicles.length);
    console.log('🔍 [BACKEND] Total count:', total);
    console.log('🔍 [BACKEND] Primeiro veículo (se existir):', vehicles[0]?.id || 'Nenhum');
    const response = {
        data: mappedVehicles,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
    console.log('🔍 [BACKEND] Resposta final:', {
        dataLength: response.data.length,
        total: response.pagination.total
    });
    res.json(response);
});
// Buscar veículo por ID
exports.getVehicleById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
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
        throw new errorHandler_1.NotFoundError('Vehicle');
    }
    // Mapear veículo para incluir informações reais de marca/modelo da FIPE
    const { brand, model, fipeValue } = await fipeService_1.fipeService.getBrandModelAndPrice(vehicle.fipeBrandId || 0, vehicle.fipeModelId || 0, vehicle.fipeYearCode || '');
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
    const response = {
        success: true,
        message: 'Vehicle found',
        data: mappedVehicle
    };
    res.json(response);
});
// Atualizar veículo
exports.updateVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Verificar se o veículo existe
    const existingVehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { id }
    });
    if (!existingVehicle) {
        throw new errorHandler_1.NotFoundError('Vehicle');
    }
    // Se está alterando a placa, verificar se não existe outra com a mesma placa
    if (updateData.licensePlate && updateData.licensePlate !== existingVehicle.licensePlate) {
        const vehicleWithSamePlate = await prisma_1.prisma.vehicle.findUnique({
            where: { licensePlate: updateData.licensePlate }
        });
        if (vehicleWithSamePlate) {
            throw new errorHandler_1.ConflictError('Another vehicle with this license plate already exists');
        }
    }
    // Verificar se o novo proprietário existe (se fornecido)
    if (updateData.ownerId && updateData.ownerId !== existingVehicle.ownerId) {
        const owner = await prisma_1.prisma.user.findUnique({
            where: { id: updateData.ownerId }
        });
        if (!owner) {
            throw new errorHandler_1.ValidationError('Owner not found', 'ownerId');
        }
    }
    // Atualizar veículo
    const vehicle = await prisma_1.prisma.vehicle.update({
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
    const response = {
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle
    };
    res.json(response);
});
// Excluir veículo (soft delete)
exports.deleteVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const forceParam = req.query.force;
    // ✅ SEGURANÇA: Validar tipo do parâmetro force (CWE-1287 Prevention)
    let force = false;
    if (forceParam !== undefined) {
        if (typeof forceParam !== 'string') {
            throw new errorHandler_1.ValidationError('Force parameter must be a string');
        }
        force = forceParam === 'true';
    }
    // Verificar se o veículo existe
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
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
        throw new errorHandler_1.NotFoundError('Vehicle');
    }
    if (force) {
        // Hard delete - remove completamente (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'production') {
            throw new errorHandler_1.ValidationError('Hard delete not allowed in production');
        }
        // Remover dependências primeiro
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.maintenanceAttachment.deleteMany({
                where: { maintenance: { vehicleId: id } }
            }),
            prisma_1.prisma.maintenance.deleteMany({
                where: { vehicleId: id }
            }),
            prisma_1.prisma.inspectionAttachment.deleteMany({
                where: { inspection: { vehicleId: id } }
            }),
            prisma_1.prisma.inspection.deleteMany({
                where: { vehicleId: id }
            }),
            prisma_1.prisma.vehiclePhoto.deleteMany({
                where: { vehicleId: id }
            }),
            prisma_1.prisma.vehicle.delete({
                where: { id }
            })
        ]);
    }
    else {
        // Soft delete - marca como inativo
        await prisma_1.prisma.vehicle.update({
            where: { id },
            data: {
                active: false,
                soldAt: new Date()
            }
        });
    }
    const response = {
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
exports.searchVehiclesByPlate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA: Validar tipo do parâmetro plate (CWE-1287 Prevention)
    const { plate } = req.params;
    if (typeof plate !== 'string') {
        throw new errorHandler_1.ValidationError('Plate parameter must be a string');
    }
    if (!plate || plate.length < 3) {
        throw new errorHandler_1.ValidationError('Plate search must have at least 3 characters');
    }
    const vehicles = await prisma_1.prisma.vehicle.findMany({
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
    const response = {
        success: true,
        message: `Found ${vehicles.length} vehicles`,
        data: vehicles
    };
    res.json(response);
});
//# sourceMappingURL=vehicleController.js.map