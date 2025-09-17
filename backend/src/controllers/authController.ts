import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { incrementLoginAttempts, resetLoginAttempts } from '../middleware/auth';
import { asyncHandler, ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import {
    generateRefreshToken,
    generateToken,
    hashPassword,
    LoginCredentials,
    RegisterData,
    sanitizeUserData,
    TokenPayload,
    verifyPassword
} from '../utils/auth';
import { getUserTypeFromDocument, validateDocument } from '../utils/documentValidation';

// Registrar novo usuário com senha
export const register = asyncHandler(async (req: Request, res: Response) => {
    const userData: RegisterData = req.body;

    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!userData || typeof userData !== 'object') {
        throw new ValidationError('Invalid request body: expected object');
    }

    if (!userData.email || typeof userData.email !== 'string') {
        throw new ValidationError('Email must be a valid string');
    }

    if (!userData.name || typeof userData.name !== 'string') {
        throw new ValidationError('Name must be a valid string');
    }

    if (!userData.password || typeof userData.password !== 'string') {
        throw new ValidationError('Password must be a valid string');
    }

    if (!userData.document || typeof userData.document !== 'string') {
        throw new ValidationError('Document must be a valid string');
    }

    if (userData.phone && typeof userData.phone !== 'string') {
        throw new ValidationError('Phone must be a string when provided');
    }

    if (userData.city && typeof userData.city !== 'string') {
        throw new ValidationError('City must be a string when provided');
    }

    if (userData.state && typeof userData.state !== 'string') {
        throw new ValidationError('State must be a string when provided');
    }

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
    const hashedPassword = await hashPassword(userData.password);

    // Determinar tipo e perfil baseado no documento
    const documentType = getUserTypeFromDocument(userData.document);
    const userType = 'user';
    const profile = documentType === 'individual' ? 'car_owner' : 'wshop_owner';

    // Criar usuário
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
            isValidated: true
        }
    });

    // Gerar tokens
    const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        type: user.type,
        profile: user.profile
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Resetar tentativas de login
    resetLoginAttempts(req);

    const response: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
            user: sanitizeUserData(user),
            token,
            refreshToken,
            expiresIn: '24h'
        }
    };

    res.status(201).json(response);
});

// Login com email e senha
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginCredentials = req.body;

    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!email || typeof email !== 'string') {
        throw new ValidationError('Email must be a valid string');
    }

    if (!password || typeof password !== 'string') {
        throw new ValidationError('Password must be a valid string');
    }

    try {
        // Buscar usuário por email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            incrementLoginAttempts(req);
            throw new ValidationError('Invalid email or password');
        }

        // Verificar senha
        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            incrementLoginAttempts(req);
            throw new ValidationError('Invalid email or password');
        }

        // Gerar tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            type: user.type,
            profile: user.profile
        };

        const token = generateToken(tokenPayload);
        const refreshTokenValue = generateRefreshToken(tokenPayload);

        // Resetar tentativas de login em caso de sucesso
        resetLoginAttempts(req);

        const response: ApiResponse = {
            success: true,
            message: 'Login successful',
            data: {
                user: sanitizeUserData(user),
                token,
                refreshToken: refreshTokenValue,
                expiresIn: '24h'
            }
        };

        res.json(response);
    } catch (error) {
        if (error instanceof ValidationError && error.message.includes('Invalid email or password')) {
            // Já incrementado acima
        }
        throw error;
    }
});

// Refresh token
export const refreshTokenEndpoint = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
        throw new ValidationError('Refresh token is required');
    }

    try {
        // Verificar refresh token (importar verifyToken)
        const jwt = require('jsonwebtoken');
        const { config } = require('../config');
        const payload = jwt.verify(providedRefreshToken, config.jwtSecret) as TokenPayload;

        // Verificar se usuário ainda existe
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) {
            throw new ValidationError('User not found');
        }

        // Gerar novos tokens
        const newTokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            type: user.type,
            profile: user.profile
        };

        const newToken = generateToken(newTokenPayload);
        const newRefreshToken = generateRefreshToken(newTokenPayload);

        const response: ApiResponse = {
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken,
                refreshToken: newRefreshToken,
                expiresIn: '24h'
            }
        };

        res.json(response);
    } catch (error) {
        throw new ValidationError('Invalid refresh token');
    }
});

// Logout (invalidar token)
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
        data: {
            loggedOutAt: new Date().toISOString()
        }
    };

    res.json(response);
});

// Perfil do usuário logado
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ValidationError('User not authenticated');
    }

    const user = await prisma.user.findUnique({
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
        throw new NotFoundError('User');
    }

    const documentValidation = validateDocument(user.cpfCnpj);

    const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved',
        data: {
            ...sanitizeUserData(user),
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
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ValidationError('User not authenticated');
    }

    const { name, phone, city, state } = req.body;

    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (name !== undefined && typeof name !== 'string') {
        throw new ValidationError('Name must be a string when provided');
    }

    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
        throw new ValidationError('Phone must be a string when provided');
    }

    if (city !== undefined && city !== null && typeof city !== 'string') {
        throw new ValidationError('City must be a string when provided');
    }

    if (state !== undefined && state !== null && typeof state !== 'string') {
        throw new ValidationError('State must be a string when provided');
    }

    // Preparar dados para atualização (apenas campos permitidos)
    const dataToUpdate: any = {};

    if (name && typeof name === 'string') dataToUpdate.name = name.trim();
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (city !== undefined) dataToUpdate.city = city;
    if (state !== undefined) dataToUpdate.state = state?.toUpperCase();

    // Atualizar usuário
    const user = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate
    });

    const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: sanitizeUserData(user)
    };

    res.json(response);
});

// Alterar senha
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ValidationError('User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!currentPassword || typeof currentPassword !== 'string') {
        throw new ValidationError('Current password must be a valid string');
    }

    if (!newPassword || typeof newPassword !== 'string') {
        throw new ValidationError('New password must be a valid string');
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
    }

    // Hash da nova senha
    const hashedNewPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
    });

    const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
        data: {
            changedAt: new Date().toISOString()
        }
    };

    res.json(response);
});

// Alias para compatibilidade
export const refreshToken = refreshTokenEndpoint;
