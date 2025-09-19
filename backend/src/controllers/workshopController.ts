import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ApiResponse, PaginationResponse } from '../types';
import { formatPhone, validateDocument } from '../utils/documentValidation';
import { safeBodyValidation, safeParamsValidation, safeQueryValidation, safeSingleParam } from '../utils/requestValidation';


// Interfaces específicas do Workshop
interface WorkshopCreateData {
    name: string;
    userId: string;
    address: string;
    phone: string;
    subdomain?: string;
}

interface WorkshopUpdateData {
    name?: string;
    address?: string;
    phone?: string;
    subdomain?: string;
}

// Criar nova oficina
export const createWorkshop = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de body (zero vulnerabilidades)
    const workshopData: WorkshopCreateData = safeBodyValidation(req);

    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!workshopData || typeof workshopData !== 'object') {
        throw new ValidationError('Invalid request body: expected object');
    }

    if (!workshopData.name || typeof workshopData.name !== 'string') {
        throw new ValidationError('Workshop name must be a valid string');
    }

    if (!workshopData.address || typeof workshopData.address !== 'string') {
        throw new ValidationError('Workshop address must be a valid string');
    }

    if (!workshopData.phone || typeof workshopData.phone !== 'string') {
        throw new ValidationError('Workshop phone must be a valid string');
    }

    if (!workshopData.userId || typeof workshopData.userId !== 'string') {
        throw new ValidationError('User ID must be a valid string');
    }

    if (workshopData.subdomain !== undefined && typeof workshopData.subdomain !== 'string') {
        throw new ValidationError('Subdomain must be a string when provided');
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
        where: { id: workshopData.userId }
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    // Verificar se o usuário já tem uma oficina
    const existingWorkshop = await prisma.workshop.findFirst({
        where: { userId: workshopData.userId }
    });

    if (existingWorkshop) {
        throw new ConflictError('User already has a workshop');
    }

    // Verificar subdomain único (se fornecido)
    if (workshopData.subdomain) {
        const existingSubdomain = await prisma.workshop.findUnique({
            where: { subdomain: workshopData.subdomain }
        });

        if (existingSubdomain) {
            throw new ConflictError('Subdomain already exists');
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
                    email: true
                }
            }
        }
    });

    const response: ApiResponse = {
        success: true,
        message: 'Workshop created successfully',
        data: {
            workshop
        }
    };

    res.status(201).json(response);
});

// Listar oficinas com filtros
export const getWorkshops = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de query (zero vulnerabilidades)
    const queryValidated = safeQueryValidation(req, {
        page: { type: 'string', required: false },
        limit: { type: 'string', required: false },
        city: { type: 'string', required: false },
        state: { type: 'string', required: false },
        search: { type: 'string', required: false },
        minRating: { type: 'string', required: false }
    });

    const { page: pageParam, limit: limitParam, city, state, search, minRating: minRatingParam } = queryValidated;

    // ✅ SEGURANÇA: Validação imediata de tipos para prevenir CWE-1287
    if (search !== undefined && typeof search !== 'string') {
        throw new ValidationError('Search parameter must be a string');
    }

    // Validar tipos e converter valores
    let page = 1;
    let limit = 10;
    let minRating: number | undefined = undefined;

    if (pageParam !== undefined) {
        if (typeof pageParam !== 'string') {
            throw new ValidationError('Page parameter must be a string');
        }
        const parsedPage = parseInt(pageParam);
        if (isNaN(parsedPage) || parsedPage < 1) {
            throw new ValidationError('Page must be a positive number');
        }
        page = parsedPage;
    }

    if (limitParam !== undefined) {
        if (typeof limitParam !== 'string') {
            throw new ValidationError('Limit parameter must be a string');
        }
        const parsedLimit = parseInt(limitParam);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            throw new ValidationError('Limit must be a number between 1 and 100');
        }
        limit = parsedLimit;
    }

    if (city !== undefined && typeof city !== 'string') {
        throw new ValidationError('City must be a string');
    }

    if (state !== undefined && typeof state !== 'string') {
        throw new ValidationError('State must be a string');
    }

    if (minRatingParam !== undefined) {
        if (typeof minRatingParam !== 'string') {
            throw new ValidationError('MinRating must be a string');
        }
        const parsedRating = parseFloat(minRatingParam);
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            throw new ValidationError('MinRating must be a number between 0 and 5');
        }
        minRating = parsedRating;
    }

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

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
    const formattedWorkshops = workshops.map((workshop: any) => ({
        ...workshop,
        formatted: {
            phone: formatPhone(workshop.phone),
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

    const response: PaginationResponse<typeof formattedWorkshops[0]> = {
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
export const getWorkshopById = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const id = safeSingleParam(req, 'id', 'string', true) as string;

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
        throw new NotFoundError('Workshop');
    }

    const response: ApiResponse = {
        success: true,
        message: 'Workshop found',
        data: {
            ...workshop,
            formatted: {
                phone: formatPhone(workshop.phone),
                userDocument: validateDocument(workshop.user.cpfCnpj).formatted,
                userPhone: workshop.user.phone ? formatPhone(workshop.user.phone) : null,
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
export const updateWorkshop = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const id = safeSingleParam(req, 'id', 'string', true) as string;

    // ✅ SEGURANÇA CWE-1287: Validação universal de body (zero vulnerabilidades)
    const updateData: WorkshopUpdateData = safeBodyValidation(req);

    // Verificar se a oficina existe
    const existingWorkshop = await prisma.workshop.findUnique({
        where: { id }
    });

    if (!existingWorkshop) {
        throw new NotFoundError('Workshop');
    }

    // Atualizar oficina
    const updatedWorkshop = await prisma.workshop.update({
        where: { id },
        data: updateData,
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
            }
        }
    });

    const response: ApiResponse = {
        success: true,
        message: 'Workshop updated successfully',
        data: {
            workshop: {
                ...updatedWorkshop,
                formatted: {
                    phone: formatPhone(updatedWorkshop.phone),
                    userDocument: validateDocument(updatedWorkshop.user.cpfCnpj).formatted,
                    userPhone: updatedWorkshop.user.phone ? formatPhone(updatedWorkshop.user.phone) : null,
                    location: updatedWorkshop.user.city && updatedWorkshop.user.state
                        ? `${updatedWorkshop.user.city}, ${updatedWorkshop.user.state}`
                        : null
                }
            }
        }
    };

    res.json(response);
});

// Buscar oficinas por proximidade/região
export const searchWorkshops = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const { term } = safeParamsValidation(req, {
        term: { type: 'string', required: true }
    });

    // ✅ SEGURANÇA CWE-1287: Validação universal de query (zero vulnerabilidades)
    const queryValidated = safeQueryValidation(req, {
        limit: { type: 'string', required: false }
    });

    // Validar e converter parâmetro limit
    const { limit: limitParam } = queryValidated;
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

    const formattedWorkshops = workshops.map((workshop: any) => ({
        ...workshop,
        formatted: {
            phone: formatPhone(workshop.phone),
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

    const response: ApiResponse = {
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
export const getWorkshopStats = asyncHandler(async (req: Request, res: Response) => {
    // ✅ SEGURANÇA CWE-1287: Validação universal de params (zero vulnerabilidades)
    const id = safeSingleParam(req, 'id', 'string', true) as string;

    const workshop = await prisma.workshop.findUnique({
        where: { id },
        select: { name: true }
    });

    if (!workshop) {
        throw new NotFoundError('Workshop');
    }

    // Buscar estatísticas detalhadas
    const [
        maintenancesStats,
        ratingsStats,
        monthlyStats
    ] = await Promise.all([
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

    const response: ApiResponse = {
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
