"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.changePassword = exports.updateProfile = exports.getProfile = exports.logout = exports.refreshTokenEndpoint = exports.login = exports.register = void 0;
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_2 = require("../utils/auth");
const documentValidation_1 = require("../utils/documentValidation");
// Registrar novo usuário com senha
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userData = req.body;
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
    // Hash da senha
    const hashedPassword = await (0, auth_2.hashPassword)(userData.password);
    // Determinar tipo e perfil baseado no documento
    const documentType = (0, documentValidation_1.getUserTypeFromDocument)(userData.document);
    const userType = 'user';
    const profile = documentType === 'individual' ? 'car_owner' : 'wshop_owner';
    // Criar usuário
    const user = await prisma_1.prisma.user.create({
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
            isValidated: true
        }
    });
    // Gerar tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        type: user.type,
        profile: user.profile
    };
    const token = (0, auth_2.generateToken)(tokenPayload);
    const refreshToken = (0, auth_2.generateRefreshToken)(tokenPayload);
    // Resetar tentativas de login
    (0, auth_1.resetLoginAttempts)(req);
    const response = {
        success: true,
        message: 'User registered successfully',
        data: {
            user: (0, auth_2.sanitizeUserData)(user),
            token,
            refreshToken,
            expiresIn: '24h'
        }
    };
    res.status(201).json(response);
});
// Login com email e senha
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    try {
        // Buscar usuário por email
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (!user) {
            (0, auth_1.incrementLoginAttempts)(req);
            throw new errorHandler_1.ValidationError('Invalid email or password');
        }
        // Verificar senha
        const isPasswordValid = await (0, auth_2.verifyPassword)(password, user.password);
        if (!isPasswordValid) {
            (0, auth_1.incrementLoginAttempts)(req);
            throw new errorHandler_1.ValidationError('Invalid email or password');
        }
        // Gerar tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            type: user.type,
            profile: user.profile
        };
        const token = (0, auth_2.generateToken)(tokenPayload);
        const refreshTokenValue = (0, auth_2.generateRefreshToken)(tokenPayload);
        // Resetar tentativas de login em caso de sucesso
        (0, auth_1.resetLoginAttempts)(req);
        const response = {
            success: true,
            message: 'Login successful',
            data: {
                user: (0, auth_2.sanitizeUserData)(user),
                token,
                refreshToken: refreshTokenValue,
                expiresIn: '24h'
            }
        };
        res.json(response);
    }
    catch (error) {
        if (error instanceof errorHandler_1.ValidationError && error.message.includes('Invalid email or password')) {
            // Já incrementado acima
        }
        throw error;
    }
});
// Refresh token
exports.refreshTokenEndpoint = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken: providedRefreshToken } = req.body;
    if (!providedRefreshToken) {
        throw new errorHandler_1.ValidationError('Refresh token is required');
    }
    try {
        // Verificar refresh token (importar verifyToken)
        const jwt = require('jsonwebtoken');
        const { config } = require('../config');
        const payload = jwt.verify(providedRefreshToken, config.jwtSecret);
        // Verificar se usuário ainda existe
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId }
        });
        if (!user) {
            throw new errorHandler_1.ValidationError('User not found');
        }
        // Gerar novos tokens
        const newTokenPayload = {
            userId: user.id,
            email: user.email,
            type: user.type,
            profile: user.profile
        };
        const newToken = (0, auth_2.generateToken)(newTokenPayload);
        const newRefreshToken = (0, auth_2.generateRefreshToken)(newTokenPayload);
        const response = {
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken,
                refreshToken: newRefreshToken,
                expiresIn: '24h'
            }
        };
        res.json(response);
    }
    catch (error) {
        throw new errorHandler_1.ValidationError('Invalid refresh token');
    }
});
// Logout (invalidar token)
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        message: 'Logout successful',
        data: {
            loggedOutAt: new Date().toISOString()
        }
    };
    res.json(response);
});
// Perfil do usuário logado
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new errorHandler_1.ValidationError('User not authenticated');
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
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
        message: 'User profile retrieved',
        data: {
            ...(0, auth_2.sanitizeUserData)(user),
            formatted: {
                document: documentValidation.formatted,
                documentType: documentValidation.type,
                createdAt: user.createdAt.toLocaleDateString('pt-BR')
            },
            stats: {
                vehiclesCount: user._count.vehicles,
                workshopsCount: user._count.workshops
            }
        }
    };
    res.json(response);
});
// Atualizar perfil do usuário logado
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new errorHandler_1.ValidationError('User not authenticated');
    }
    const { name, phone, city, state } = req.body;
    // Preparar dados para atualização (apenas campos permitidos)
    const dataToUpdate = {};
    if (name)
        dataToUpdate.name = name.trim();
    if (phone !== undefined)
        dataToUpdate.phone = phone;
    if (city !== undefined)
        dataToUpdate.city = city;
    if (state !== undefined)
        dataToUpdate.state = state?.toUpperCase();
    // Atualizar usuário
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate
    });
    const response = {
        success: true,
        message: 'Profile updated successfully',
        data: (0, auth_2.sanitizeUserData)(user)
    };
    res.json(response);
});
// Alterar senha
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new errorHandler_1.ValidationError('User not authenticated');
    }
    const { currentPassword, newPassword } = req.body;
    // Buscar usuário atual
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        throw new errorHandler_1.NotFoundError('User');
    }
    // Verificar senha atual
    const isCurrentPasswordValid = await (0, auth_2.verifyPassword)(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        throw new errorHandler_1.ValidationError('Current password is incorrect');
    }
    // Hash da nova senha
    const hashedNewPassword = await (0, auth_2.hashPassword)(newPassword);
    // Atualizar senha
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
    });
    const response = {
        success: true,
        message: 'Password changed successfully',
        data: {
            changedAt: new Date().toISOString()
        }
    };
    res.json(response);
});
// Alias para compatibilidade
exports.refreshToken = exports.refreshTokenEndpoint;
//# sourceMappingURL=authController.js.map