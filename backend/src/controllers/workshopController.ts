import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ApiResponse, PaginationResponse } from '../types';
import { formatPhone, validateDocument } from '../utils/documentValidation';


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
    const workshopData: WorkshopCreateData = req.body;

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
        throw new NotFoundError('User');
    }

    // Validar se o usuário tem CNPJ (business)
    const documentValidation = validateDocument(user.cpfCnpj);
    if (documentValidation.type !== 'cnpj') {
        throw new ValidationError('Workshop owner must have CNPJ (business document)');
    }

    // Verificar se já existe oficina para este usuário
    const existingWorkshop = await prisma.workshop.findFirst({
        where: { userId: workshopData.userId }
    });

    if (existingWorkshop) {
        throw new ConflictError('User already has a workshop registered');
    }

    // Verificar se subdomain já existe (se fornecido)
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

    const response: ApiResponse = {
        success: true,
        message: 'Workshop created successfully',
        data: {
            ...workshop,
            formatted: {
                phone: formatPhone(workshop.phone),
                userDocument: validateDocument(workshop.user.cpfCnpj).formatted,
                userPhone: workshop.user.phone ? formatPhone(workshop.user.phone) : null,
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
export const getWorkshops = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const city = req.query.city as string;
    const state = req.query.state as string;
    const search = req.query.search as string;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    // Filtros geográficos
    if (city || state) {
        where.user = {};
        if (city) where.user.city = { contains: city, mode: 'insensitive' };
        if (state) where.user.state = state.toUpperCase();
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
    const { id } = req.params;
    const updateData: WorkshopUpdateData = req.body;

    // Verificar se a oficina existe
    const existingWorkshop = await prisma.workshop.findUnique({
        where: { id }
    });

    if (!existingWorkshop) {
        throw new NotFoundError('Workshop');
    }

    // Verificar subdomain se está sendo alterado
    if (updateData.subdomain && updateData.subdomain !== existingWorkshop.subdomain) {
        const existingSubdomain = await prisma.workshop.findUnique({
            where: { subdomain: updateData.subdomain }
        });

        if (existingSubdomain) {
            throw new ConflictError('Subdomain already exists');
        }
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {};

    if (updateData.name) dataToUpdate.name = updateData.name.trim();
    if (updateData.address) dataToUpdate.address = updateData.address.trim();
    if (updateData.phone) dataToUpdate.phone = updateData.phone;
    if (updateData.subdomain !== undefined) dataToUpdate.subdomain = updateData.subdomain;

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

    const response: ApiResponse = {
        success: true,
        message: 'Workshop updated successfully',
        data: {
            ...workshop,
            formatted: {
                phone: formatPhone(workshop.phone),
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
export const searchWorkshops = asyncHandler(async (req: Request, res: Response) => {
    const { term } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

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
    const { id } = req.params;

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
