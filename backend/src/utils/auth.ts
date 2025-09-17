import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Interfaces para autenticação
export interface TokenPayload {
    userId: string;
    email: string;
    type: string;
    profile: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone?: string;
    document: string;
    city?: string;
    state?: string;
}

/**
 * Hash da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verificar senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Gerar JWT token
 */
export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: '24h',
        issuer: 'carrepair-api'
    });
}

/**
 * Gerar refresh token (maior duração)
 */
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: '7d',
        issuer: 'carrepair-api'
    });
}

/**
 * Verificar e decodificar JWT token
 */
export function verifyToken(token: string): TokenPayload {
    try {
        return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Extrair token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
        throw new Error('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new Error('Authorization header must be in format: Bearer <token>');
    }

    const token = parts[1];
    if (!token) {
        throw new Error('Token is missing from Authorization header');
    }

    return token;
}

/**
 * Validar força da senha
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
} {
    const errors: string[] = [];
    let score = 0;

    // Comprimento mínimo
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    } else {
        score += 1;
    }

    // Letra minúscula
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else {
        score += 1;
    }

    // Letra maiúscula
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else {
        score += 1;
    }

    // Número
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    } else {
        score += 1;
    }

    // Caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    } else {
        score += 1;
    }

    return {
        isValid: errors.length === 0,
        errors,
        score
    };
}

/**
 * Gerar código de verificação aleatório
 */
export function generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Verificar se email é válido
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitizar dados de usuário para resposta (remover senha)
 */
export function sanitizeUserData(user: any): any {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
}

/**
 * ✅ SEGURANÇA: Sanitizar strings para logs seguros (CWE-134 Prevention)
 * Remove/escapa caracteres que podem ser usados em ataques de format string
 */
export function sanitizeForLog(input: string): string {
    if (!input) return 'EMPTY';

    return input
        .replace(/[%]/g, '%%')           // Escape % usado em format strings
        .replace(/[\r\n]/g, ' ')        // Remove quebras de linha
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
        .substring(0, 200)              // Limita tamanho para evitar log bombing
        .trim();
}
