import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ApiResponse, PaginationResponse, UserCreateData, UserUpdateData } from '../types';
import { formatPhone, getUserTypeFromDocument, validateDocument } from '../utils/documentValidation';

// Criar novo usuário
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData: UserCreateData = req.body;

    // ✅ SENHA PADRÃO (REMOVER userData.password)
    const defaultPassword = 'temp123456'; // Senha temporária sempre

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

    // Hash da senha
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Determinar tipo e perfil baseado no documento
    const documentType = getUserTypeFromDocument(userData.document);
    const userType = 'user';
    const profile = documentType === 'individual' ? 'car_owner' : 'wshop_owner';

    // ✅ CRIAR USUÁRIO (SIMPLES - SEM _count)
    const user = await prisma.user.create({
        data: {
            name: userData.name.trim(),
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            phone: userData.phone || null,
            cpfCnpj: userData.document,
            type: userType,
            profile: profile,
            city: userData.city || null,
            state: userData.state?.toUpperCase() || null,
        }
    });

    // ✅ BUSCAR CONTADORES SEPARADAMENTE
    const vehiclesCount = await prisma.vehicle.count({
        where: { ownerId: user.id }
    });

    const workshopsCount = await prisma.workshop.count({
        where: { userId: user.id }
    });

    // Validar e formatar documento para resposta
    const documentValidation = validateDocument(user.cpfCnpj);

    // ✅ RESPOSTA SEM CAMPOS INEXISTENTES
    const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            type: user.type,
            profile: user.profile,
            phone: user.phone,
            city: user.city,
            state: user.state,
            isValidated: user.isValidated,
            createdAt: user.createdAt,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: vehiclesCount,
                workshopsCount: workshopsCount
            }
        }
    };

    res.status(201).json(response);
});

// ✅ CORRIGIR getUsers
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

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpfCnpj: { contains: search.replace(/\D/g, '') } }
        ];
    }

    // ✅ BUSCAR USUÁRIOS SIMPLES (SEM _count)
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                cpfCnpj: true,
                type: true,
                profile: true,
                phone: true,
                city: true,
                state: true,
                isValidated: true,
                createdAt: true
                // ✅ REMOVIDO: updatedAt, _count
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
    ]);

    // ✅ BUSCAR CONTADORES EM BATCH
    const userIds = users.map((u: any) => u.id);

    const vehicleCounts = await prisma.vehicle.groupBy({
        by: ['ownerId'],
        where: { ownerId: { in: userIds } },
        _count: { id: true }
    }) as Array<{ ownerId: string; _count: { id: number } }>;

    const workshopCounts = await prisma.workshop.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { id: true }
    }) as Array<{ userId: string; _count: { id: number } }>;

    // Formatar usuários
    const formattedUsers = users.map((user: any) => {
        const documentValidation = validateDocument(user.cpfCnpj);
        const vehiclesCount = vehicleCounts.find(vc => vc.ownerId === user.id)?._count.id || 0;
        const workshopsCount = workshopCounts.find(wc => wc.userId === user.id)?._count.id || 0;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            type: user.type,
            profile: user.profile,
            phone: user.phone,
            city: user.city,
            state: user.state,
            isValidated: user.isValidated,
            createdAt: user.createdAt,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: vehiclesCount,
                workshopsCount: workshopsCount
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

// ✅ CORRIGIR getUserById  
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // ✅ BUSCAR USUÁRIO SIMPLES
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            cpfCnpj: true,
            type: true,
            profile: true,
            phone: true,
            city: true,
            state: true,
            isValidated: true,
            createdAt: true
            // ✅ REMOVIDO: updatedAt, vehicles, workshops, _count
        }
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    // ✅ BUSCAR RELACIONAMENTOS SEPARADAMENTE
    const [vehicles, workshops, vehiclesCount, workshopsCount] = await Promise.all([
        prisma.vehicle.findMany({
            where: { ownerId: user.id },
            select: {
                id: true,
                licensePlate: true, // ✅ NOME CORRETO
                active: true,
                yearManufacture: true
            }
        }),
        prisma.workshop.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true
            }
        }),
        prisma.vehicle.count({ where: { ownerId: user.id } }),
        prisma.workshop.count({ where: { userId: user.id } })
    ]);

    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User found',
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            type: user.type,
            profile: user.profile,
            phone: user.phone,
            city: user.city,
            state: user.state,
            isValidated: user.isValidated,
            createdAt: user.createdAt,
            vehicles: vehicles, // ✅ AGORA EXISTE
            workshops: workshops, // ✅ AGORA EXISTE
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: vehiclesCount,
                workshopsCount: workshopsCount,
                activeVehicles: vehicles.filter((v: any) => v.active).length
            }
        }
    };

    res.json(response);
});

// ✅ CORRIGIR updateUser
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UserUpdateData = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true }
    });

    if (!existingUser) {
        throw new NotFoundError('User');
    }

    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
            where: { email: updateData.email }
        });

        if (emailExists) {
            throw new ConflictError('User with this email already exists');
        }
    }

    const dataToUpdate: any = {};

    if (updateData.name) dataToUpdate.name = updateData.name.trim();
    if (updateData.email) dataToUpdate.email = updateData.email.toLowerCase();
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
    if (updateData.city !== undefined) dataToUpdate.city = updateData.city;
    if (updateData.state !== undefined) dataToUpdate.state = updateData.state?.toUpperCase();

    // ✅ ATUALIZAR USUÁRIO SIMPLES
    const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
            id: true,
            name: true,
            email: true,
            cpfCnpj: true,
            type: true,
            profile: true,
            phone: true,
            city: true,
            state: true,
            isValidated: true,
            createdAt: true
            // ✅ REMOVIDO: updatedAt, _count
        }
    });

    // ✅ BUSCAR CONTADORES SEPARADAMENTE  
    const [vehiclesCount, workshopsCount] = await Promise.all([
        prisma.vehicle.count({ where: { ownerId: user.id } }),
        prisma.workshop.count({ where: { userId: user.id } })
    ]);

    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            type: user.type,
            profile: user.profile,
            phone: user.phone,
            city: user.city,
            state: user.state,
            isValidated: user.isValidated,
            createdAt: user.createdAt,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? formatPhone(user.phone) : null
            },
            stats: {
                vehiclesCount: vehiclesCount,
                workshopsCount: workshopsCount
            }
        }
    };

    res.json(response);
});

// ✅ validateUser e getUserByDocument CORRETOS (não usam _count)
export const validateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { validated } = req.body;

    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true }
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { isValidated: validated === true },
        select: {
            id: true,
            name: true,
            email: true,
            isValidated: true
            // ✅ REMOVIDO: updatedAt
        }
    });

    const response: ApiResponse = {
        success: true,
        message: `User ${validated ? 'validated' : 'unvalidated'} successfully`,
        data: updatedUser
    };

    res.json(response);
});

export const getUserByDocument = asyncHandler(async (req: Request, res: Response) => {
    const { document } = req.params;

    if (!document) {
        throw new ValidationError('Document parameter is required');
    }

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
            id: user.id,
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            type: user.type,
            profile: user.profile,
            isValidated: user.isValidated,
            createdAt: user.createdAt,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            }
        }
    };

    res.json(response);
});
