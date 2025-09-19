import { Request, Response } from 'express';
export declare const systemStatsRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Estatísticas gerais do sistema
 */
export declare const getSystemStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const systemHealthRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Status detalhado do sistema
 */
export declare const getSystemHealth: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const systemEndpointsRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Endpoints de sistema disponíveis
 */
export declare const getSystemEndpoints: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=systemController.d.ts.map