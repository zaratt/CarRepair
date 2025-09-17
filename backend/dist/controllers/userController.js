"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByDocument = exports.validateUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const security_1 = require("../config/security");
const errorHandler_1 = require("../middleware/errorHandler");
const documentValidation_1 = require("../utils/documentValidation");
const typeValidation_1 = require("../utils/typeValidation");
// Criar novo usuário
exports.createUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userData = req.body;
    // ✅ VALIDAÇÃO DE TIPOS
    if (!typeValidation_1.TypeGuards.isUserCreateData(userData)) {
        throw new errorHandler_1.ValidationError('Invalid user data structure');
    }
    // ✅ SENHA PADRÃO SEGURA (de variável de ambiente)
    const defaultPassword = security_1.SecurityConfig.DEFAULT_PASSWORD;
    // Verificar se email já existe
    const existingEmailUser = await prisma_1.prisma.user.findUnique({
        where: { email: userData.email }
    });
    if (existingEmailUser) {
        throw new errorHandler_1.ConflictError('User with this email already exists');
    }
    // Verificar se documento já existe
    const existingDocumentUser = await prisma_1.prisma.user.findUnique({
        where: { cpfCnpj: userData.document }
    });
    if (existingDocumentUser) {
        throw new errorHandler_1.ConflictError('User with this document already exists');
    }
    // ✅ HASH SEGURO (salt de variável de ambiente)
    const hashedPassword = await bcryptjs_1.default.hash(defaultPassword, security_1.SecurityConfig.BCRYPT_SALT_ROUNDS);
    // Determinar tipo e perfil baseado no documento
    const documentType = (0, documentValidation_1.getUserTypeFromDocument)(userData.document);
    const userType = 'user';
    const profile = documentType === 'individual' ? 'car_owner' : 'wshop_owner';
    // ✅ CRIAR USUÁRIO COM VALIDAÇÃO SEGURA DE TIPOS
    const user = await prisma_1.prisma.user.create({
        data: {
            name: typeValidation_1.TypeValidators.safeTrim(userData.name),
            email: typeValidation_1.TypeValidators.safeToLowerCase(userData.email),
            password: hashedPassword,
            phone: userData.phone || null,
            cpfCnpj: userData.document,
            type: userType,
            profile: profile,
            city: userData.city || null,
            state: userData.state ? typeValidation_1.TypeValidators.safeToUpperCase(userData.state) : null,
        }
    });
    // ✅ BUSCAR CONTADORES SEPARADAMENTE
    const vehiclesCount = await prisma_1.prisma.vehicle.count({
        where: { ownerId: user.id }
    });
    const workshopsCount = await prisma_1.prisma.workshop.count({
        where: { userId: user.id }
    });
    // Validar e formatar documento para resposta
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    // ✅ RESPOSTA SEM CAMPOS INEXISTENTES
    const response = {
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
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null,
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
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ VALIDAÇÃO SEGURA DE QUERY PARAMS
    const page = typeValidation_1.TypeValidators.safeNumber(req.query.page, 1);
    const limit = typeValidation_1.TypeValidators.safeNumber(req.query.limit, 10);
    const userType = typeValidation_1.TypeValidators.safeString(req.query.userType);
    const profile = typeValidation_1.TypeValidators.safeString(req.query.profile);
    const state = typeValidation_1.TypeValidators.safeString(req.query.state);
    const search = typeValidation_1.TypeValidators.safeString(req.query.search);
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    if (userType)
        where.type = userType;
    if (profile)
        where.profile = profile;
    if (state)
        where.state = typeValidation_1.TypeValidators.safeToUpperCase(state);
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpfCnpj: { contains: search.replace(/\D/g, '') } }
        ];
    }
    // ✅ BUSCAR USUÁRIOS SIMPLES (SEM _count)
    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
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
        prisma_1.prisma.user.count({ where })
    ]);
    // ✅ BUSCAR CONTADORES EM BATCH
    const userIds = users.map((u) => u.id);
    const vehicleCounts = await prisma_1.prisma.vehicle.groupBy({
        by: ['ownerId'],
        where: { ownerId: { in: userIds } },
        _count: { id: true }
    });
    const workshopCounts = await prisma_1.prisma.workshop.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { id: true }
    });
    // Formatar usuários
    const formattedUsers = users.map((user) => {
        const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
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
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: vehiclesCount,
                workshopsCount: workshopsCount
            }
        };
    });
    const response = {
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
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // ✅ BUSCAR USUÁRIO SIMPLES
    const user = await prisma_1.prisma.user.findUnique({
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
        throw new errorHandler_1.NotFoundError('User');
    }
    // ✅ BUSCAR RELACIONAMENTOS SEPARADAMENTE
    const [vehicles, workshops, vehiclesCount, workshopsCount] = await Promise.all([
        prisma_1.prisma.vehicle.findMany({
            where: { ownerId: user.id },
            select: {
                id: true,
                licensePlate: true, // ✅ NOME CORRETO
                active: true,
                yearManufacture: true
            }
        }),
        prisma_1.prisma.workshop.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true
            }
        }),
        prisma_1.prisma.vehicle.count({ where: { ownerId: user.id } }),
        prisma_1.prisma.workshop.count({ where: { userId: user.id } })
    ]);
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
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
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: vehiclesCount,
                workshopsCount: workshopsCount,
                activeVehicles: vehicles.filter((v) => v.active).length
            }
        }
    };
    res.json(response);
});
// ✅ CORRIGIR updateUser
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // ✅ VALIDAÇÃO DE TIPOS
    if (!typeValidation_1.TypeGuards.isUserUpdateData(updateData)) {
        throw new errorHandler_1.ValidationError('Invalid update data structure');
    }
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true }
    });
    if (!existingUser) {
        throw new errorHandler_1.NotFoundError('User');
    }
    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma_1.prisma.user.findUnique({
            where: { email: updateData.email }
        });
        if (emailExists) {
            throw new errorHandler_1.ConflictError('User with this email already exists');
        }
    }
    const dataToUpdate = {};
    // ✅ VALIDAÇÃO SEGURA DE TIPOS EM CADA CAMPO
    if (updateData.name)
        dataToUpdate.name = typeValidation_1.TypeValidators.safeTrim(updateData.name);
    if (updateData.email)
        dataToUpdate.email = typeValidation_1.TypeValidators.safeToLowerCase(updateData.email);
    if (updateData.phone !== undefined)
        dataToUpdate.phone = updateData.phone;
    if (updateData.city !== undefined)
        dataToUpdate.city = updateData.city;
    if (updateData.state !== undefined)
        dataToUpdate.state = updateData.state ? typeValidation_1.TypeValidators.safeToUpperCase(updateData.state) : null;
    // ✅ ATUALIZAR USUÁRIO SIMPLES
    const user = await prisma_1.prisma.user.update({
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
        prisma_1.prisma.vehicle.count({ where: { ownerId: user.id } }),
        prisma_1.prisma.workshop.count({ where: { userId: user.id } })
    ]);
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
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
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null
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
exports.validateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { validated } = req.body;
    // ✅ VALIDAÇÃO SEGURA DE TIPO
    const validatedValue = typeValidation_1.TypeValidators.safeBoolean(validated, false);
    const user = await prisma_1.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true }
    });
    if (!user) {
        throw new errorHandler_1.NotFoundError('User');
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id },
        data: { isValidated: validatedValue },
        select: {
            id: true,
            name: true,
            email: true,
            isValidated: true
            // ✅ REMOVIDO: updatedAt
        }
    });
    const response = {
        success: true,
        message: `User ${validatedValue ? 'validated' : 'unvalidated'} successfully`,
        data: updatedUser
    };
    res.json(response);
});
exports.getUserByDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { document } = req.params;
    if (!document) {
        throw new errorHandler_1.ValidationError('Document parameter is required');
    }
    const cleanDocument = document.replace(/\D/g, '');
    const user = await prisma_1.prisma.user.findUnique({
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
        throw new errorHandler_1.NotFoundError('User with this document');
    }
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
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
//# sourceMappingURL=userController.js.map