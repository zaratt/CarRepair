import { NextFunction, Request, Response } from 'express';
export declare const helmetConfig: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const hppProtection: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const validateContentType: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validatePayloadSize: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUserAgent: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMiddleware: ((req: Request, res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=securityMiddleware.d.ts.map