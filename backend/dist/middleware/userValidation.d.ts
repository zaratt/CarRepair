import { NextFunction, Request, Response } from 'express';
/**
 * Middleware para validar dados de criação de usuário
 */
export declare function validateUserData(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar dados de atualização de usuário
 */
export declare function validateUserUpdateData(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar UUID de usuário
 */
export declare function validateUserId(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar query parameters de busca de usuários
 */
export declare function validateUserSearchParams(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=userValidation.d.ts.map