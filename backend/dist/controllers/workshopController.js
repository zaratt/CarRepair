"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkshopStats = exports.searchWorkshops = exports.updateWorkshop = exports.getWorkshopById = exports.getWorkshops = exports.createWorkshop = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const documentValidation_1 = require("../utils/documentValidation");
// Criar nova oficina
exports.createWorkshop = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const workshopData = req.body;
    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!workshopData || typeof workshopData !== 'object') {
        throw new errorHandler_1.ValidationError('Invalid request body: expected object');
    }
    if (!workshopData.name || typeof workshopData.name !== 'string') {
        throw new errorHandler_1.ValidationError('Workshop name must be a valid string');
    }
    if (!workshopData.address || typeof workshopData.address !== 'string') {
        throw new errorHandler_1.ValidationError('Workshop address must be a valid string');
    }
    if (!workshopData.phone || typeof workshopData.phone !== 'string') {
        throw new errorHandler_1.ValidationError('Workshop phone must be a valid string');
    }
    if (!workshopData.userId || typeof workshopData.userId !== 'string') {
        throw new errorHandler_1.ValidationError('User ID must be a valid string');
    }
    if (workshopData.subdomain !== undefined && typeof workshopData.subdomain !== 'string') {
        throw new errorHandler_1.ValidationError('Subdomain must be a string when provided');
    }
    // Verificar se usuário existe
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: workshopData.userId }
    });
    if (!user) {
        throw new errorHandler_1.NotFoundError('User');
    }
    // Verificar se o usuário já tem uma oficina
    const existingWorkshop = await prisma_1.prisma.workshop.findFirst({
        where: { userId: workshopData.userId }
    });
    if (existingWorkshop) {
        throw new errorHandler_1.ConflictError('User already has a workshop');
    }
    // Verificar subdomain único (se fornecido)
    if (workshopData.subdomain) {
        const existingSubdomain = await prisma_1.prisma.workshop.findUnique({
            where: { subdomain: workshopData.subdomain }
        });
        if (existingSubdomain) {
            throw new errorHandler_1.ConflictError('Subdomain already exists');
        }
    }
    // Criar oficina
    const workshop = await prisma_1.prisma.workshop.create({
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
                    email: true
                }
            }
        }
    });
    const response = {
        success: true,
        message: 'Workshop created successfully',
        data: {
            workshop
        }
    };
    res.status(201).json(response);
});
// Listar oficinas com filtros
exports.getWorkshops = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ SEGURANÇA: Validar tipos dos parâmetros de query (CWE-1287 Prevention)
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const city = req.query.city;
    const state = req.query.state;
    const search = req.query.search;
    const minRatingParam = req.query.minRating;
    // ✅ SEGURANÇA: Validação imediata de tipos para prevenir CWE-1287
    if (search !== undefined && typeof search !== 'string') {
        throw new errorHandler_1.ValidationError('Search parameter must be a string');
    }
    // Validar tipos e converter valores
    let page = 1;
    let limit = 10;
    let minRating = undefined;
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
    if (city !== undefined && typeof city !== 'string') {
        throw new errorHandler_1.ValidationError('City must be a string');
    }
    if (state !== undefined && typeof state !== 'string') {
        throw new errorHandler_1.ValidationError('State must be a string');
    }
    if (minRatingParam !== undefined) {
        if (typeof minRatingParam !== 'string') {
            throw new errorHandler_1.ValidationError('MinRating must be a string');
        }
        const parsedRating = parseFloat(minRatingParam);
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            throw new errorHandler_1.ValidationError('MinRating must be a number between 0 and 5');
        }
        minRating = parsedRating;
    }
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    // Filtros geográficos
    if (city || state) {
        where.user = {};
        if (city && typeof city === 'string') {
            where.user.city = { contains: city, mode: 'insensitive' };
        }
        if (state && typeof state === 'string') {
            where.user.state = state.toUpperCase();
        }
    }
    // Filtro de busca (nome da oficina)
    if (search && typeof search === 'string') {
        where.name = { contains: search, mode: 'insensitive' };
    }
    // Filtro de avaliação mínima
    if (minRating) {
        where.rating = { gte: minRating };
    }
    // Buscar oficinas e total
    const [workshops, total] = await Promise.all([
        prisma_1.prisma.workshop.findMany({
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
        prisma_1.prisma.workshop.count({ where })
    ]);
    // Formatar oficinas
    const formattedWorkshops = workshops.map((workshop) => ({
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
    const workshop = await prisma_1.prisma.workshop.findUnique({
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
    // Validar tipo do parâmetro id
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim()) {
        res.status(400).json({
            success: false,
            message: 'Workshop ID is required and must be a string'
        });
        return;
    }
    // Validar tipo do corpo da requisição
    if (typeof req.body !== 'object' || req.body === null) {
        res.status(400).json({
            success: false,
            message: 'Request body must be an object'
        });
        return;
    }
    const updateData = req.body;
    // Validar tipos dos campos de atualização
    if (updateData.name !== undefined && typeof updateData.name !== 'string') {
        res.status(400).json({
            success: false,
            message: 'Name must be a string'
        });
        return;
    }
    if (updateData.address !== undefined && typeof updateData.address !== 'string') {
        res.status(400).json({
            success: false,
            message: 'Address must be a string'
        });
        return;
    }
    if (updateData.phone !== undefined && typeof updateData.phone !== 'string') {
        res.status(400).json({
            success: false,
            message: 'Phone must be a string'
        });
        return;
    }
    if (updateData.subdomain !== undefined && typeof updateData.subdomain !== 'string') {
        res.status(400).json({
            success: false,
            message: 'Subdomain must be a string'
        });
        return;
    }
    // Verificar se a oficina existe
    const existingWorkshop = await prisma_1.prisma.workshop.findUnique({
        where: { id }
    });
    if (!existingWorkshop) {
        throw new errorHandler_1.NotFoundError('Workshop');
    }
    // Verificar subdomain se está sendo alterado
    if (typeof updateData.subdomain === 'string' && updateData.subdomain !== existingWorkshop.subdomain) {
        const existingSubdomain = await prisma_1.prisma.workshop.findUnique({
            where: { subdomain: updateData.subdomain }
        });
        if (existingSubdomain) {
            throw new errorHandler_1.ConflictError('Subdomain already exists');
        }
    }
    // Preparar dados para atualização
    const dataToUpdate = {};
    if (typeof updateData.name === 'string' && updateData.name.trim()) {
        dataToUpdate.name = updateData.name.trim();
    }
    if (typeof updateData.address === 'string' && updateData.address.trim()) {
        dataToUpdate.address = updateData.address.trim();
    }
    if (typeof updateData.phone === 'string' && updateData.phone.trim()) {
        dataToUpdate.phone = updateData.phone.trim();
    }
    if (updateData.subdomain !== undefined && typeof updateData.subdomain === 'string') {
        dataToUpdate.subdomain = updateData.subdomain.trim();
    }
    // Atualizar oficina
    const workshop = await prisma_1.prisma.workshop.update({
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
    // Validar tipo do parâmetro term
    const { term } = req.params;
    if (typeof term !== 'string' || !term.trim()) {
        res.status(400).json({
            success: false,
            message: 'Search term is required and must be a string'
        });
        return;
    }
    // Validar e converter parâmetro limit
    const limitParam = req.query.limit;
    let limit = 20; // valor padrão
    if (limitParam !== undefined) {
        if (typeof limitParam !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Limit must be a string number'
            });
            return;
        }
        const parsedLimit = parseInt(limitParam, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            res.status(400).json({
                success: false,
                message: 'Limit must be a number between 1 and 100'
            });
            return;
        }
        limit = parsedLimit;
    }
    const workshops = await prisma_1.prisma.workshop.findMany({
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
    const formattedWorkshops = workshops.map((workshop) => ({
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
    // Validar tipo do parâmetro id
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim()) {
        res.status(400).json({
            success: false,
            message: 'Workshop ID is required and must be a string'
        });
        return;
    }
    const workshop = await prisma_1.prisma.workshop.findUnique({
        where: { id },
        select: { name: true }
    });
    if (!workshop) {
        throw new errorHandler_1.NotFoundError('Workshop');
    }
    // Buscar estatísticas detalhadas
    const [maintenancesStats, ratingsStats, monthlyStats] = await Promise.all([
        // Estatísticas de manutenções
        prisma_1.prisma.maintenance.aggregate({
            where: { workshopId: id },
            _count: { id: true },
            _avg: { value: true },
            _sum: { value: true }
        }),
        // Estatísticas de avaliações
        prisma_1.prisma.rating.aggregate({
            where: { workshopId: id },
            _count: { id: true },
            _avg: { value: true }
        }),
        // Manutenções por mês (últimos 6 meses)
        prisma_1.prisma.maintenance.groupBy({
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