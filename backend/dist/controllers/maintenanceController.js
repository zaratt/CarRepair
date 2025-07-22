"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaintenancesByVehicle = exports.deleteMaintenance = exports.updateMaintenance = exports.getMaintenanceById = exports.getMaintenances = exports.createMaintenance = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const parsing_1 = require("../utils/parsing");
const prisma = new client_1.PrismaClient();
// Criar nova manutenção
exports.createMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const maintenanceData = req.body;
    // Verificar se o veículo existe
    const vehicle = await prisma.vehicle.findUnique({
        where: { id: maintenanceData.vehicleId },
        select: { id: true, licensePlate: true, active: true, owner: { select: { name: true } } }
    });
    if (!vehicle) {
        throw new errorHandler_1.NotFoundError('Vehicle');
    }
    if (!vehicle.active) {
        throw new errorHandler_1.ValidationError('Cannot add maintenance to inactive vehicle');
    }
    // Verificar se a oficina existe (se fornecida)
    if (maintenanceData.workshopId) {
        const workshop = await prisma.workshop.findUnique({
            where: { id: maintenanceData.workshopId },
            select: { id: true, name: true }
        });
        if (!workshop) {
            throw new errorHandler_1.NotFoundError('Workshop');
        }
    }
    // Criar manutenção
    const maintenance = await prisma.maintenance.create({
        data: {
            vehicleId: maintenanceData.vehicleId,
            workshopId: maintenanceData.workshopId,
            date: maintenanceData.date,
            description: maintenanceData.description,
            products: maintenanceData.products,
            mileage: maintenanceData.mileage,
            value: maintenanceData.value,
        },
        include: {
            vehicle: {
                select: {
                    id: true,
                    licensePlate: true,
                    yearManufacture: true,
                    modelYear: true,
                    owner: {
                        select: { name: true, phone: true }
                    }
                }
            },
            workshop: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                }
            },
            attachments: true,
        }
    });
    const response = {
        success: true,
        message: 'Maintenance created successfully',
        data: {
            ...maintenance,
            // Adicionar valores formatados para exibição
            formatted: {
                value: maintenance.value ? (0, parsing_1.formatCurrency)(maintenance.value) : null,
                mileage: (0, parsing_1.formatKilometers)(maintenance.mileage),
                date: maintenance.date.toLocaleDateString('pt-BR')
            }
        }
    };
    res.status(201).json(response);
});
// Listar manutenções com paginação
exports.getMaintenances = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const vehicleId = req.query.vehicleId;
    const workshopId = req.query.workshopId;
    const validationStatus = req.query.validationStatus;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    if (vehicleId)
        where.vehicleId = vehicleId;
    if (workshopId)
        where.workshopId = workshopId;
    if (validationStatus)
        where.validationStatus = validationStatus;
    // Filtros de data
    if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom)
            where.date.gte = new Date(dateFrom);
        if (dateTo)
            where.date.lte = new Date(dateTo);
    }
    // Buscar manutenções e total
    const [maintenances, total] = await Promise.all([
        prisma.maintenance.findMany({
            where,
            skip,
            take: limit,
            include: {
                vehicle: {
                    select: {
                        id: true,
                        licensePlate: true,
                        yearManufacture: true,
                        modelYear: true,
                        brand: { select: { name: true } },
                        model: { select: { name: true } },
                        owner: {
                            select: { name: true, phone: true }
                        }
                    }
                },
                workshop: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    }
                },
                attachments: {
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        name: true,
                    }
                },
            },
            orderBy: { date: 'desc' }
        }),
        prisma.maintenance.count({ where })
    ]);
    // Adicionar valores formatados
    const formattedMaintenances = maintenances.map(maintenance => ({
        ...maintenance,
        formatted: {
            value: maintenance.value ? (0, parsing_1.formatCurrency)(maintenance.value) : null,
            mileage: (0, parsing_1.formatKilometers)(maintenance.mileage),
            date: maintenance.date.toLocaleDateString('pt-BR')
        }
    }));
    const response = {
        data: formattedMaintenances,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
    res.json(response);
});
// Buscar manutenção por ID
exports.getMaintenanceById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const maintenance = await prisma.maintenance.findUnique({
        where: { id },
        include: {
            vehicle: {
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
                }
            },
            workshop: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            },
            attachments: true,
        }
    });
    if (!maintenance) {
        throw new errorHandler_1.NotFoundError('Maintenance');
    }
    const response = {
        success: true,
        message: 'Maintenance found',
        data: {
            ...maintenance,
            formatted: {
                value: maintenance.value ? (0, parsing_1.formatCurrency)(maintenance.value) : null,
                mileage: (0, parsing_1.formatKilometers)(maintenance.mileage),
                date: maintenance.date.toLocaleDateString('pt-BR'),
                createdAt: maintenance.createdAt.toLocaleDateString('pt-BR')
            }
        }
    };
    res.json(response);
});
// Atualizar manutenção
exports.updateMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Verificar se a manutenção existe
    const existingMaintenance = await prisma.maintenance.findUnique({
        where: { id },
        select: { id: true, vehicleId: true, validationStatus: true }
    });
    if (!existingMaintenance) {
        throw new errorHandler_1.NotFoundError('Maintenance');
    }
    // Verificar se pode ser editada (apenas se não estiver validada)
    if (existingMaintenance.validationStatus === 'validado' && updateData.validationStatus !== 'validado') {
        throw new errorHandler_1.ValidationError('Cannot modify validated maintenance');
    }
    // Se está alterando o veículo, verificar se o novo veículo existe
    if (updateData.vehicleId && updateData.vehicleId !== existingMaintenance.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: updateData.vehicleId }
        });
        if (!vehicle) {
            throw new errorHandler_1.NotFoundError('Vehicle');
        }
    }
    // Se está alterando a oficina, verificar se a nova oficina existe
    if (updateData.workshopId) {
        const workshop = await prisma.workshop.findUnique({
            where: { id: updateData.workshopId }
        });
        if (!workshop) {
            throw new errorHandler_1.NotFoundError('Workshop');
        }
    }
    // Atualizar manutenção
    const maintenance = await prisma.maintenance.update({
        where: { id },
        data: updateData,
        include: {
            vehicle: {
                select: {
                    id: true,
                    licensePlate: true,
                    owner: { select: { name: true } }
                }
            },
            workshop: {
                select: {
                    id: true,
                    name: true,
                }
            },
            attachments: true,
        }
    });
    const response = {
        success: true,
        message: 'Maintenance updated successfully',
        data: {
            ...maintenance,
            formatted: {
                value: maintenance.value ? (0, parsing_1.formatCurrency)(maintenance.value) : null,
                mileage: (0, parsing_1.formatKilometers)(maintenance.mileage),
                date: maintenance.date.toLocaleDateString('pt-BR')
            }
        }
    };
    res.json(response);
});
// Excluir manutenção
exports.deleteMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const force = req.query.force === 'true';
    // Verificar se a manutenção existe
    const maintenance = await prisma.maintenance.findUnique({
        where: { id },
        include: {
            attachments: true,
            vehicle: {
                select: { licensePlate: true }
            }
        }
    });
    if (!maintenance) {
        throw new errorHandler_1.NotFoundError('Maintenance');
    }
    // Verificar se pode ser excluída
    if (maintenance.validationStatus === 'validado' && !force) {
        throw new errorHandler_1.ValidationError('Cannot delete validated maintenance without force flag');
    }
    // Excluir anexos primeiro, depois a manutenção
    await prisma.$transaction([
        prisma.maintenanceAttachment.deleteMany({
            where: { maintenanceId: id }
        }),
        prisma.maintenance.delete({
            where: { id }
        })
    ]);
    const response = {
        success: true,
        message: 'Maintenance deleted successfully',
        data: {
            id,
            deletedAt: new Date(),
            hadAttachments: maintenance.attachments.length > 0,
            vehiclePlate: maintenance.vehicle.licensePlate,
            wasValidated: maintenance.validationStatus === 'validado'
        }
    };
    res.json(response);
});
// Buscar manutenções por veículo
exports.getMaintenancesByVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { vehicleId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    // Verificar se o veículo existe
    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { licensePlate: true, active: true }
    });
    if (!vehicle) {
        throw new errorHandler_1.NotFoundError('Vehicle');
    }
    const maintenances = await prisma.maintenance.findMany({
        where: { vehicleId },
        take: limit,
        include: {
            workshop: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                }
            },
            attachments: {
                select: {
                    id: true,
                    url: true,
                    type: true,
                    name: true,
                }
            },
        },
        orderBy: { date: 'desc' }
    });
    // Calcular estatísticas
    const stats = {
        total: maintenances.length,
        totalValue: maintenances.reduce((sum, m) => sum + (m.value || 0), 0),
        avgMileage: maintenances.length > 0
            ? Math.round(maintenances.reduce((sum, m) => sum + m.mileage, 0) / maintenances.length)
            : 0,
        lastMaintenance: maintenances[0]?.date || null,
        validatedCount: maintenances.filter(m => m.validationStatus === 'validado').length,
    };
    const formattedMaintenances = maintenances.map(maintenance => ({
        ...maintenance,
        formatted: {
            value: maintenance.value ? (0, parsing_1.formatCurrency)(maintenance.value) : null,
            mileage: (0, parsing_1.formatKilometers)(maintenance.mileage),
            date: maintenance.date.toLocaleDateString('pt-BR')
        }
    }));
    const response = {
        success: true,
        message: `Found ${maintenances.length} maintenances for vehicle ${vehicle.licensePlate}`,
        data: {
            vehicle: {
                licensePlate: vehicle.licensePlate,
                active: vehicle.active
            },
            maintenances: formattedMaintenances,
            stats: {
                ...stats,
                formatted: {
                    totalValue: (0, parsing_1.formatCurrency)(stats.totalValue),
                    avgMileage: (0, parsing_1.formatKilometers)(stats.avgMileage),
                    lastMaintenance: stats.lastMaintenance?.toLocaleDateString('pt-BR') || null
                }
            }
        }
    };
    res.json(response);
});
//# sourceMappingURL=maintenanceController.js.map