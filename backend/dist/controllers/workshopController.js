"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkshopStats = exports.searchWorkshops = exports.updateWorkshop = exports.getWorkshopById = exports.getWorkshops = exports.createWorkshop = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const documentValidation_1 = require("../utils/documentValidation");
const prisma = new client_1.PrismaClient();
// Criar nova oficina
exports.createWorkshop = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const workshopData = req.body;
    // Verificar se o usuário existe e é do tipo business
    const user = await prisma.user.findUnique({
        where: { id: workshopData.userId },
        select: {
            id: true,
            name: true,
            cpfCnpj: true,
            type: true,
            profile: true
        }
    });
    if (!user) {
        throw new errorHandler_1.NotFoundError('User');
    }
    // Validar se o usuário tem CNPJ (business)
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    if (documentValidation.type !== 'cnpj') {
        throw new errorHandler_1.ValidationError('Workshop owner must have CNPJ (business document)');
    }
    // Verificar se já existe oficina para este usuário
    const existingWorkshop = await prisma.workshop.findFirst({
        where: { userId: workshopData.userId }
    });
    if (existingWorkshop) {
        throw new errorHandler_1.ConflictError('User already has a workshop registered');
    }
    // Verificar se subdomain já existe (se fornecido)
    if (workshopData.subdomain) {
        const existingSubdomain = await prisma.workshop.findUnique({
            where: { subdomain: workshopData.subdomain }
        });
        if (existingSubdomain) {
            throw new errorHandler_1.ConflictError('Subdomain already exists');
        }
    }
    // Criar oficina
    const workshop = await prisma.workshop.create({
        data: {
            name: workshopData.name.trim(),
            userId: workshopData.userId,
            address: workshopData.address.trim(),
            phone: workshopData.phone,
            subdomain: workshopData.subdomain || null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpfCnpj: true,
                    phone: true,
                    city: true,
                    state: true
                }
            },
            _count: {
                select: {
                    maintenances: true,
                    ratings: true
                }
            }
        }
    });
    const response = {
        success: true,
        message: 'Workshop created successfully',
        data: {
            ...workshop,
            formatted: {
                phone: (0, documentValidation_1.formatPhone)(workshop.phone),
                userDocument: (0, documentValidation_1.validateDocument)(workshop.user.cpfCnpj).formatted,
                userPhone: workshop.user.phone ? (0, documentValidation_1.formatPhone)(workshop.user.phone) : null,
                createdAt: workshop.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                maintenancesCount: workshop._count.maintenances,
                ratingsCount: workshop._count.ratings,
                avgRating: workshop.rating || 0
            }
        }
    };
    res.status(201).json(response);
});
// Listar oficinas com filtros
exports.getWorkshops = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const city = req.query.city;
    const state = req.query.state;
    const search = req.query.search;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : undefined;
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    // Filtros geográficos
    if (city || state) {
        where.user = {};
        if (city)
            where.user.city = { contains: city, mode: 'insensitive' };
        if (state)
            where.user.state = state.toUpperCase();
    }
    // Filtro de busca (nome da oficina)
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }
    // Filtro de avaliação mínima
    if (minRating) {
        where.rating = { gte: minRating };
    }
    // Buscar oficinas e total
    const [workshops, total] = await Promise.all([
        prisma.workshop.findMany({
            where,
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        phone: true
                    }
                },
                _count: {
                    select: {
                        maintenances: true,
                        ratings: true
                    }
                }
            },
            orderBy: [
                { rating: 'desc' },
                { createdAt: 'desc' }
            ]
        }),
        prisma.workshop.count({ where })
    ]);
    // Formatar oficinas
    const formattedWorkshops = workshops.map(workshop => ({
        ...workshop,
        formatted: {
            phone: (0, documentValidation_1.formatPhone)(workshop.phone),
            createdAt: workshop.createdAt.toLocaleDateString('pt-BR'),
            location: workshop.user.city && workshop.user.state
                ? `${workshop.user.city}, ${workshop.user.state}`
                : null
        },
        stats: {
            maintenancesCount: workshop._count.maintenances,
            ratingsCount: workshop._count.ratings,
            avgRating: workshop.rating || 0
        }
    }));
    const response = {
        data: formattedWorkshops,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
    res.json(response);
});
// Buscar oficina por ID
exports.getWorkshopById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const workshop = await prisma.workshop.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpfCnpj: true,
                    phone: true,
                    city: true,
                    state: true,
                    createdAt: true
                }
            },
            maintenances: {
                take: 10,
                orderBy: { date: 'desc' },
                include: {
                    vehicle: {
                        select: {
                            licensePlate: true,
                            yearManufacture: true,
                            modelYear: true
                        }
                    }
                }
            },
            ratings: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            },
            _count: {
                select: {
                    maintenances: true,
                    ratings: true,
                    favorites: true
                }
            }
        }
    });
    if (!workshop) {
        throw new errorHandler_1.NotFoundError('Workshop');
    }
    const response = {
        success: true,
        message: 'Workshop found',
        data: {
            ...workshop,
            formatted: {
                phone: (0, documentValidation_1.formatPhone)(workshop.phone),
                userDocument: (0, documentValidation_1.validateDocument)(workshop.user.cpfCnpj).formatted,
                userPhone: workshop.user.phone ? (0, documentValidation_1.formatPhone)(workshop.user.phone) : null,
                location: workshop.user.city && workshop.user.state
                    ? `${workshop.user.city}, ${workshop.user.state}`
                    : null,
                createdAt: workshop.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                maintenancesCount: workshop._count.maintenances,
                ratingsCount: workshop._count.ratings,
                favoritesCount: workshop._count.favorites,
                avgRating: workshop.rating || 0
            },
            recentMaintenances: workshop.maintenances.map(m => ({
                ...m,
                formatted: {
                    date: m.date.toLocaleDateString('pt-BR'),
                    vehicleInfo: `${m.vehicle.licensePlate} (${m.vehicle.yearManufacture}/${m.vehicle.modelYear})`
                }
            }))
        }
    };
    res.json(response);
});
// Atualizar oficina
exports.updateWorkshop = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Verificar se a oficina existe
    const existingWorkshop = await prisma.workshop.findUnique({
        where: { id }
    });
    if (!existingWorkshop) {
        throw new errorHandler_1.NotFoundError('Workshop');
    }
    // Verificar subdomain se está sendo alterado
    if (updateData.subdomain && updateData.subdomain !== existingWorkshop.subdomain) {
        const existingSubdomain = await prisma.workshop.findUnique({
            where: { subdomain: updateData.subdomain }
        });
        if (existingSubdomain) {
            throw new errorHandler_1.ConflictError('Subdomain already exists');
        }
    }
    // Preparar dados para atualização
    const dataToUpdate = {};
    if (updateData.name)
        dataToUpdate.name = updateData.name.trim();
    if (updateData.address)
        dataToUpdate.address = updateData.address.trim();
    if (updateData.phone)
        dataToUpdate.phone = updateData.phone;
    if (updateData.subdomain !== undefined)
        dataToUpdate.subdomain = updateData.subdomain;
    // Atualizar oficina
    const workshop = await prisma.workshop.update({
        where: { id },
        data: dataToUpdate,
        include: {
            user: {
                select: {
                    name: true,
                    city: true,
                    state: true
                }
            },
            _count: {
                select: {
                    maintenances: true,
                    ratings: true
                }
            }
        }
    });
    const response = {
        success: true,
        message: 'Workshop updated successfully',
        data: {
            ...workshop,
            formatted: {
                phone: (0, documentValidation_1.formatPhone)(workshop.phone),
                location: workshop.user.city && workshop.user.state
                    ? `${workshop.user.city}, ${workshop.user.state}`
                    : null
            },
            stats: {
                maintenancesCount: workshop._count.maintenances,
                ratingsCount: workshop._count.ratings,
                avgRating: workshop.rating || 0
            }
        }
    };
    res.json(response);
});
// Buscar oficinas por proximidade/região
exports.searchWorkshops = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { term } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const workshops = await prisma.workshop.findMany({
        where: {
            OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { address: { contains: term, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { city: { contains: term, mode: 'insensitive' } },
                            { state: { contains: term, mode: 'insensitive' } }
                        ]
                    }
                }
            ]
        },
        take: limit,
        include: {
            user: {
                select: {
                    city: true,
                    state: true
                }
            },
            _count: {
                select: {
                    maintenances: true,
                    ratings: true
                }
            }
        },
        orderBy: [
            { rating: 'desc' },
            { createdAt: 'desc' }
        ]
    });
    const formattedWorkshops = workshops.map(workshop => ({
        ...workshop,
        formatted: {
            phone: (0, documentValidation_1.formatPhone)(workshop.phone),
            location: workshop.user?.city && workshop.user?.state
                ? `${workshop.user.city}, ${workshop.user.state}`
                : null
        },
        stats: {
            maintenancesCount: workshop._count?.maintenances || 0,
            ratingsCount: workshop._count?.ratings || 0,
            avgRating: workshop.rating || 0
        }
    }));
    const response = {
        success: true,
        message: `Found ${workshops.length} workshops matching "${term}"`,
        data: {
            searchTerm: term,
            count: workshops.length,
            workshops: formattedWorkshops
        }
    };
    res.json(response);
});
// Estatísticas detalhadas da oficina
exports.getWorkshopStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const workshop = await prisma.workshop.findUnique({
        where: { id },
        select: { name: true }
    });
    if (!workshop) {
        throw new errorHandler_1.NotFoundError('Workshop');
    }
    // Buscar estatísticas detalhadas
    const [maintenancesStats, ratingsStats, monthlyStats] = await Promise.all([
        // Estatísticas de manutenções
        prisma.maintenance.aggregate({
            where: { workshopId: id },
            _count: { id: true },
            _avg: { value: true },
            _sum: { value: true }
        }),
        // Estatísticas de avaliações
        prisma.rating.aggregate({
            where: { workshopId: id },
            _count: { id: true },
            _avg: { value: true }
        }),
        // Manutenções por mês (últimos 6 meses)
        prisma.maintenance.groupBy({
            by: ['date'],
            where: {
                workshopId: id,
                date: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                }
            },
            _count: { id: true }
        })
    ]);
    const response = {
        success: true,
        message: 'Workshop statistics',
        data: {
            workshopName: workshop.name,
            maintenances: {
                total: maintenancesStats._count.id,
                totalRevenue: maintenancesStats._sum.value || 0,
                avgValue: maintenancesStats._avg.value || 0,
                formatted: {
                    totalRevenue: `R$ ${(maintenancesStats._sum.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    avgValue: `R$ ${(maintenancesStats._avg.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
            },
            ratings: {
                total: ratingsStats._count.id,
                average: ratingsStats._avg.value || 0,
                formatted: {
                    average: (ratingsStats._avg.value || 0).toFixed(1) + '/5.0'
                }
            },
            monthlyActivity: monthlyStats.length,
            generatedAt: new Date().toISOString()
        }
    };
    res.json(response);
});
//# sourceMappingURL=workshopController.js.map