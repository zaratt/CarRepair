import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ApiResponse, PaginationResponse, UserCreateData, UserUpdateData } from '../types';
import { formatPhone, getUserTypeFromDocument, validateDocument } from '../utils/documentValidation';

const prisma = new PrismaClient();

// Criar novo usuário
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData: UserCreateData = req.body;

    // Verificar se email já existe
    const existingEmailUser = await prisma.user.findUnique({
        where: { email: userData.email }
    });

    if (existingEmailUser) {
        throw new ConflictError('User with this email already exists');
    }

    // Verificar se documento já existe
    const existingDocumentUser = await prisma.user.findUnique({
        where: { cpfCnpj: userData.document }
    });

    if (existingDocumentUser) {
        throw new ConflictError('User with this document already exists');
    }

    // Determinar tipo e perfil baseado no documento
    const documentType = getUserTypeFromDocument(userData.document);
    const userType = 'user'; // Sempre 'user' por enquanto (diferente de 'workshop')
    const profile = documentType === 'individual' ? 'car_owner' : 'wshop_owner';

    // Criar usuário
    const user = await prisma.user.create({
        data: {
            name: userData.name.trim(),
            email: userData.email.toLowerCase(),
            phone: userData.phone || null,
            cpfCnpj: userData.document,
            type: userType,
            profile: profile,
            city: userData.city || null,
            state: userData.state?.toUpperCase() || null,
        },
        include: {
            _count: {
                select: {
                    vehicles: true,
                    workshops: true
                }
            }
        }
    });

    // Validar e formatar documento para resposta
    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: user._count.vehicles,
                workshopsCount: user._count.workshops
            }
        }
    };

    res.status(201).json(response);
});

// Listar usuários com paginação e filtros
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userType = req.query.userType as string;
    const profile = req.query.profile as string;
    const state = req.query.state as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (userType) where.type = userType;
    if (profile) where.profile = profile;
    if (state) where.state = state.toUpperCase();

    // Filtro de busca (nome, email ou documento)
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpfCnpj: { contains: search.replace(/\D/g, '') } }
        ];
    }

    // Buscar usuários e total
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        vehicles: true,
                        workshops: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
    ]);

    // Formatar usuários
    const formattedUsers = users.map(user => {
        const documentValidation = validateDocument(user.cpfCnpj);
        return {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: user._count.vehicles,
                workshopsCount: user._count.workshops
            }
        };
    });

    const response: PaginationResponse<typeof formattedUsers[0]> = {
        data: formattedUsers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };

    res.json(response);
});

// Buscar usuário por ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            vehicles: {
                select: {
                    id: true,
                    licensePlate: true,
                    active: true,
                    yearManufacture: true,
                    modelYear: true
                }
            },
            workshops: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    address: true
                }
            },
            _count: {
                select: {
                    vehicles: true,
                    workshops: true
                }
            }
        }
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User found',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: user._count.vehicles,
                workshopsCount: user._count.workshops,
                activeVehicles: user.vehicles.filter(v => v.active).length
            }
        }
    };

    res.json(response);
});

// Atualizar usuário
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UserUpdateData = req.body;

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
        where: { id }
    });

    if (!existingUser) {
        throw new NotFoundError('User');
    }

    // Verificar se email está sendo alterado e se já existe
    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
            where: { email: updateData.email }
        });

        if (emailExists) {
            throw new ConflictError('User with this email already exists');
        }
    }

    // Preparar dados para atualização (apenas campos que existem no schema)
    const dataToUpdate: any = {};

    if (updateData.name) dataToUpdate.name = updateData.name.trim();
    if (updateData.email) dataToUpdate.email = updateData.email.toLowerCase();
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
    if (updateData.city !== undefined) dataToUpdate.city = updateData.city;
    if (updateData.state !== undefined) dataToUpdate.state = updateData.state?.toUpperCase();

    // Atualizar usuário
    const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: {
            _count: {
                select: {
                    vehicles: true,
                    workshops: true
                }
            }
        }
    });

    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null
            },
            stats: {
                vehiclesCount: user._count.vehicles,
                workshopsCount: user._count.workshops
            }
        }
    };

    res.json(response);
});

// Validar usuário (alternar isValidated)
export const validateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { validated } = req.body;

    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { isValidated: validated === true }
    });

    const response: ApiResponse = {
        success: true,
        message: `User ${validated ? 'validated' : 'unvalidated'} successfully`,
        data: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            isValidated: updatedUser.isValidated,
            updatedAt: new Date()
        }
    };

    res.json(response);
});

// Buscar usuários por documento (para verificação de duplicatas)
export const getUserByDocument = asyncHandler(async (req: Request, res: Response) => {
    const { document } = req.params;

    if (!document) {
        throw new ValidationError('Document parameter is required');
    }

    // Limpar documento para busca
    const cleanDocument = document.replace(/\D/g, '');

    const user = await prisma.user.findUnique({
        where: { cpfCnpj: cleanDocument },
        select: {
            id: true,
            name: true,
            email: true,
            cpfCnpj: true,
            type: true,
            profile: true,
            isValidated: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new NotFoundError('User with this document');
    }

    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User found by document',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            }
        }
    };

    res.json(response);
});
