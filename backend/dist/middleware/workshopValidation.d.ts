import { NextFunction, Request, Response } from 'express';
/**
 * Middleware para validar dados de criação de oficina
 */
export declare function validateWorkshopData(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar dados de atualização de oficina
 */
export declare function validateWorkshopUpdateData(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar UUID de oficina
 */
export declare function validateWorkshopId(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar query parameters de busca de oficinas
 */
export declare function validateWorkshopSearchParams(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware para validar termo de busca
 */
export declare function validateSearchTerm(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=workshopValidation.d.ts.map