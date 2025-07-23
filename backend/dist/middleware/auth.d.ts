import { NextFunction, Request, Response } from 'express';
import { TokenPayload } from '../utils/auth';
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
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para autenticação opcional (não falha se não houver token)
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para autorização baseada em tipos de usuário
 */
export declare function authorize(allowedTypes: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware para autorização baseada em perfis de usuário
 */
export declare function authorizeProfile(allowedProfiles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware para verificar se usuário é proprietário do recurso
 */
export declare function authorizeOwner(userIdParam?: string): (req: Request, res: Response, next: NextFunction) => void;
export declare function rateLimitAuth(maxAttempts?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Incrementar contador de tentativas de login
 */
export declare function incrementLoginAttempts(req: Request): void;
/**
 * Reset contador de tentativas de login (em caso de sucesso)
 */
export declare function resetLoginAttempts(req: Request): void;
//# sourceMappingURL=auth.d.ts.map