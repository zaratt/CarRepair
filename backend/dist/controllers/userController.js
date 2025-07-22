"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByDocument = exports.validateUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const documentValidation_1 = require("../utils/documentValidation");
const prisma = new client_1.PrismaClient();
// Criar novo usuário
exports.createUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userData = req.body;
    // Verificar se email já existe
    const existingEmailUser = await prisma.user.findUnique({
        where: { email: userData.email }
    });
    if (existingEmailUser) {
        throw new errorHandler_1.ConflictError('User with this email already exists');
    }
    // Verificar se documento já existe
    const existingDocumentUser = await prisma.user.findUnique({
        where: { cpfCnpj: userData.document }
    });
    if (existingDocumentUser) {
        throw new errorHandler_1.ConflictError('User with this document already exists');
    }
    // Determinar tipo e perfil baseado no documento
    const documentType = (0, documentValidation_1.getUserTypeFromDocument)(userData.document);
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
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
        success: true,
        message: 'User created successfully',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null,
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
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userType = req.query.userType;
    const profile = req.query.profile;
    const state = req.query.state;
    const search = req.query.search;
    const skip = (page - 1) * limit;
    // Construir filtros
    const where = {};
    if (userType)
        where.type = userType;
    if (profile)
        where.profile = profile;
    if (state)
        where.state = state.toUpperCase();
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
        const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
        return {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: user._count.vehicles,
                workshopsCount: user._count.workshops
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
// Buscar usuário por ID
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.NotFoundError('User');
    }
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
        success: true,
        message: 'User found',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null,
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
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
        where: { id }
    });
    if (!existingUser) {
        throw new errorHandler_1.NotFoundError('User');
    }
    // Verificar se email está sendo alterado e se já existe
    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
            where: { email: updateData.email }
        });
        if (emailExists) {
            throw new errorHandler_1.ConflictError('User with this email already exists');
        }
    }
    // Preparar dados para atualização (apenas campos que existem no schema)
    const dataToUpdate = {};
    if (updateData.name)
        dataToUpdate.name = updateData.name.trim();
    if (updateData.email)
        dataToUpdate.email = updateData.email.toLowerCase();
    if (updateData.phone !== undefined)
        dataToUpdate.phone = updateData.phone;
    if (updateData.city !== undefined)
        dataToUpdate.city = updateData.city;
    if (updateData.state !== undefined)
        dataToUpdate.state = updateData.state?.toUpperCase();
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
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
        success: true,
        message: 'User updated successfully',
        data: {
            ...user,
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                phone: user.phone ? (0, documentValidation_1.formatPhone)(user.phone) : null
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
exports.validateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { validated } = req.body;
    const user = await prisma.user.findUnique({
        where: { id }
    });
    if (!user) {
        throw new errorHandler_1.NotFoundError('User');
    }
    const updatedUser = await prisma.user.update({
        where: { id },
        data: { isValidated: validated === true }
    });
    const response = {
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
exports.getUserByDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { document } = req.params;
    if (!document) {
        throw new errorHandler_1.ValidationError('Document parameter is required');
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
        throw new errorHandler_1.NotFoundError('User with this document');
    }
    const documentValidation = (0, documentValidation_1.validateDocument)(user.cpfCnpj);
    const response = {
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
//# sourceMappingURL=userController.js.map