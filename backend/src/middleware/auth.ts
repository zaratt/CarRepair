import { NextFunction, Request, Response } from 'express';
import { extractTokenFromHeader, TokenPayload, verifyToken } from '../utils/auth';
import { ValidationError } from './errorHandler';

// Estender o Request para incluir user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * Middleware para autenticar token JWT
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        const payload = verifyToken(token);

        // Adicionar dados do usuário à requisição
        req.user = payload;

        next();
    } catch (error) {
        throw new ValidationError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Middleware para autenticação opcional (não falha se não houver token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.headers.authorization) {
            const token = extractTokenFromHeader(req.headers.authorization);
            const payload = verifyToken(token);
            req.user = payload;
        }
        next();
    } catch (error) {
        // Ignora erros de autenticação quando opcional
        next();
    }
}

/**
 * Middleware para autorização baseada em tipos de usuário
 */
export function authorize(allowedTypes: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new ValidationError('Authentication required');
        }

        if (!allowedTypes.includes(req.user.type)) {
            throw new ValidationError(`Access denied. Required types: ${allowedTypes.join(', ')}`);
        }

        next();
    };
}

/**
 * Middleware para autorização baseada em perfis de usuário
 */
export function authorizeProfile(allowedProfiles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new ValidationError('Authentication required');
        }

        if (!allowedProfiles.includes(req.user.profile)) {
            throw new ValidationError(`Access denied. Required profiles: ${allowedProfiles.join(', ')}`);
        }

        next();
    };
}

/**
 * Middleware para verificar se usuário é proprietário do recurso
 */
export function authorizeOwner(userIdParam: string = 'id') {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new ValidationError('Authentication required');
        }

        const resourceUserId = req.params[userIdParam];
        if (req.user.userId !== resourceUserId) {
            throw new ValidationError('Access denied. You can only access your own resources');
        }

        next();
    };
}

/**
 * Middleware básico de rate limiting para autenticação
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function rateLimitAuth(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || 'unknown';
        const now = new Date();

        const attempts = loginAttempts.get(clientId);

        if (attempts) {
            // Reset contador se passou da janela de tempo
            if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
                loginAttempts.delete(clientId);
            } else if (attempts.count >= maxAttempts) {
                throw new ValidationError(`Too many authentication attempts. Try again later.`);
            }
        }

        next();
    };
}

/**
 * Incrementar contador de tentativas de login
 */
export function incrementLoginAttempts(req: Request) {
    const clientId = req.ip || 'unknown';
    const now = new Date();

    const attempts = loginAttempts.get(clientId);

    if (attempts) {
        attempts.count += 1;
        attempts.lastAttempt = now;
    } else {
        loginAttempts.set(clientId, { count: 1, lastAttempt: now });
    }
}

/**
 * Reset contador de tentativas de login (em caso de sucesso)
 */
export function resetLoginAttempts(req: Request) {
    const clientId = req.ip || 'unknown';
    loginAttempts.delete(clientId);
}
