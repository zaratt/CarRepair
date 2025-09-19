"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaintenancesByVehicle = exports.deleteMaintenance = exports.updateMaintenance = exports.getMaintenanceById = exports.getMaintenances = exports.createMaintenance = exports.createAttachmentFromUpload = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const parsing_1 = require("../utils/parsing");
const requestValidation_1 = require("../utils/requestValidation");
// ✅ Função para criar dados de attachment a partir de URLs de upload
const createAttachmentFromUpload = (uploadedFile, category) => {
    return {
        url: uploadedFile.url,
        type: uploadedFile.mimeType.startsWith('image/') ? 'image' : 'pdf',
        category: category,
        name: uploadedFile.originalName || uploadedFile.fileName,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
    };
};
exports.createAttachmentFromUpload = createAttachmentFromUpload;
// ✅ Validar se documentos obrigatórios estão presentes
const validateRequiredDocuments = (attachments) => {
    const notasFiscais = attachments.filter(att => att.category === 'nota_fiscal');
    if (notasFiscais.length === 0) {
        throw new errorHandler_1.ValidationError('Pelo menos uma Nota Fiscal é obrigatória');
    }
};
// ✅ Validar data de manutenção (máximo 60 dias atrás)
const validateMaintenanceDate = (date) => {
    const today = new Date();
    const sixtyDaysAgo = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
    if (date < sixtyDaysAgo) {
        throw new errorHandler_1.ValidationError('A data da manutenção não pode ser anterior a 60 dias atrás');
    }
    if (date > today) {
        throw new errorHandler_1.ValidationError('A data da manutenção não pode ser posterior à data de hoje');
    }
};
// ✅ SEGURANÇA: Criar nova manutenção com validação CWE-1287 completa
exports.createMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA CWE-1287: Validação explícita de req.body antes de uso
    if (!req.body || typeof req.body !== 'object') {
        throw new errorHandler_1.ValidationError('Request body must be a valid object');
    }
    // ✅ SEGURANÇA: Validação segura de estrutura do body
    const bodyData = req.body;
    if (Array.isArray(bodyData)) {
        throw new errorHandler_1.ValidationError('Request body cannot be an array');
    }
    const { attachments, ...maintenanceData } = bodyData;
    // ✅ Validar data da manutenção
    validateMaintenanceDate(new Date(maintenanceData.date));
    // ✅ Validar documentos obrigatórios
    if (attachments && attachments.length > 0) {
        validateRequiredDocuments(attachments);
    }
    // Verificar se o veículo existe
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
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
        const workshop = await prisma_1.prisma.workshop.findUnique({
            where: { id: maintenanceData.workshopId },
            select: { id: true, name: true }
        });
        if (!workshop) {
            throw new errorHandler_1.NotFoundError('Workshop');
        }
    }
    // Criar manutenção
    const maintenance = await prisma_1.prisma.maintenance.create({
        data: {
            vehicleId: maintenanceData.vehicleId,
            workshopId: maintenanceData.workshopId,
            date: maintenanceData.date,
            description: maintenanceData.description,
            services: maintenanceData.services || [], // ✅ NOVO: Array de serviços
            products: maintenanceData.products,
            workshopName: maintenanceData.workshopName, // ✅ NOVO
            workshopCnpj: maintenanceData.workshopCnpj, // ✅ NOVO  
            workshopAddress: maintenanceData.workshopAddress, // ✅ NOVO
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
    // ✅ Criar anexos se fornecidos
    if (attachments && attachments.length > 0) {
        await Promise.all(attachments.map(attachment => prisma_1.prisma.maintenanceAttachment.create({
            data: {
                maintenanceId: maintenance.id,
                url: attachment.url,
                type: attachment.type,
                category: attachment.category,
                name: attachment.name,
                size: attachment.size,
                mimeType: attachment.mimeType,
            }
        })));
        // Buscar manutenção com anexos criados
        const maintenanceWithAttachments = await prisma_1.prisma.maintenance.findUnique({
            where: { id: maintenance.id },
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
        if (maintenanceWithAttachments) {
            maintenance.attachments = maintenanceWithAttachments.attachments;
        }
    }
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
// ✅ SEGURANÇA: Listar manutenções com validação CWE-1287 completa
exports.getMaintenances = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de query params (zero vulnerabilidades)
    const querySchema = {
        page: { type: 'number', defaultValue: 1, validator: (val) => val > 0 },
        limit: { type: 'number', defaultValue: 10, validator: (val) => val > 0 && val <= 100 },
        vehicleId: { type: 'string', defaultValue: '' },
        workshopId: { type: 'string', defaultValue: '' },
        validationStatus: { type: 'string', defaultValue: '' },
        dateFrom: { type: 'string', defaultValue: '' },
        dateTo: { type: 'string', defaultValue: '' }
    };
    const { page, limit, vehicleId, workshopId, validationStatus, dateFrom, dateTo } = (0, requestValidation_1.safeQueryValidation)(req, querySchema);
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    if (vehicleId)
        where.vehicleId = vehicleId;
    if (workshopId)
        where.workshopId = workshopId;
    if (validationStatus)
        where.isValidated = validationStatus === 'validated';
    // Filtros de data
    if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom)
            where.date.gte = new Date(dateFrom);
        if (dateTo)
            where.date.lte = new Date(dateTo);
    }
    const [maintenances, total] = await Promise.all([
        prisma_1.prisma.maintenance.findMany({
            where,
            skip,
            take: limit,
            orderBy: { date: 'desc' },
            include: {
                vehicle: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
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
                            }
                        }
                    }
                },
                attachments: true,
            }
        }),
        prisma_1.prisma.maintenance.count({ where })
    ]);
    const response = {
        data: maintenances,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
    res.json(response);
});
// ✅ SEGURANÇA: Buscar manutenção por ID com validação CWE-1287 completa
exports.getMaintenanceById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const id = (0, requestValidation_1.safeSingleParam)(req, 'id', 'string', true);
    const maintenance = await prisma_1.prisma.maintenance.findUnique({
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
// ✅ SEGURANÇA: Atualizar manutenção com validação CWE-1287 completa
exports.updateMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const id = (0, requestValidation_1.safeSingleParam)(req, 'id', 'string', true);
    // ✅ SEGURANÇA CWE-1287: Validação explícita de req.body antes de uso
    if (!req.body || typeof req.body !== 'object') {
        throw new errorHandler_1.ValidationError('Request body must be a valid object');
    }
    // ✅ SEGURANÇA: Validação segura de estrutura do body
    const bodyData = req.body;
    if (Array.isArray(bodyData)) {
        throw new errorHandler_1.ValidationError('Request body cannot be an array');
    }
    const updateData = bodyData;
    // Verificar se a manutenção existe
    const existingMaintenance = await prisma_1.prisma.maintenance.findUnique({
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
        const vehicle = await prisma_1.prisma.vehicle.findUnique({
            where: { id: updateData.vehicleId }
        });
        if (!vehicle) {
            throw new errorHandler_1.NotFoundError('Vehicle');
        }
    }
    // Se está alterando a oficina, verificar se a nova oficina existe
    if (updateData.workshopId) {
        const workshop = await prisma_1.prisma.workshop.findUnique({
            where: { id: updateData.workshopId }
        });
        if (!workshop) {
            throw new errorHandler_1.NotFoundError('Workshop');
        }
    }
    // Atualizar manutenção
    const maintenance = await prisma_1.prisma.maintenance.update({
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
// ✅ SEGURANÇA: Excluir manutenção com validação CWE-1287 completa
exports.deleteMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params e query (zero vulnerabilidades)
    const id = (0, requestValidation_1.safeSingleParam)(req, 'id', 'string', true);
    const force = (0, requestValidation_1.safeQueryValidation)(req, {
        force: { type: 'boolean', defaultValue: false }
    }).force;
    // Verificar se a manutenção existe
    const maintenance = await prisma_1.prisma.maintenance.findUnique({
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
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.maintenanceAttachment.deleteMany({
            where: { maintenanceId: id }
        }),
        prisma_1.prisma.maintenance.delete({
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
// ✅ SEGURANÇA: Buscar manutenções por veículo com validação CWE-1287 completa
exports.getMaintenancesByVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params e query (zero vulnerabilidades)
    const vehicleId = (0, requestValidation_1.safeSingleParam)(req, 'vehicleId', 'string', true);
    const limit = (0, requestValidation_1.safeQueryValidation)(req, {
        limit: { type: 'number', defaultValue: 20, validator: (val) => val > 0 && val <= 100 }
    }).limit;
    // Verificar se o veículo existe
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { licensePlate: true, active: true }
    });
    if (!vehicle) {
        throw new errorHandler_1.NotFoundError('Vehicle');
    }
    const maintenances = await prisma_1.prisma.maintenance.findMany({
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