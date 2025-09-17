import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { ApiResponse } from '../types';
import { sanitizeForLog } from '../utils/auth';

// Tipos de erro customizados
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, field?: string) {
        super(`Validation error: ${message}${field ? ` (field: ${field})` : ''}`, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

// Middleware de tratamento de erros global
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = { ...err } as AppError;
    error.message = err.message;

    // ✅ SEGURANÇA: Sanitizar dados da request antes do log (CWE-134 Prevention)
    const sanitizedMethod = sanitizeForLog(req.method || 'UNKNOWN');
    const sanitizedPath = sanitizeForLog(req.path || '/unknown');
    const sanitizedMessage = sanitizeForLog(err.message || 'Unknown error');

    // ✅ Log do erro com format string estático (CWE-134 Prevention)
    console.error('🚨 Error Details:', {
        method: sanitizedMethod,
        path: sanitizedPath,
        message: sanitizedMessage,
        stack: config.isDevelopment ? err.stack : undefined,
        body: req.body,
        params: req.params,
        query: req.query,
    });

    // Erro do Prisma - Unique constraint
    if (err.message.includes('Unique constraint')) {
        error = new ConflictError('Record already exists with this value');
    }

    // Erro do Prisma - Record not found
    if (err.message.includes('Record to update not found')) {
        error = new NotFoundError('Record');
    }

    // Erro de validação do Prisma
    if (err.message.includes('Invalid input')) {
        error = new ValidationError('Invalid input data');
    }

    // Erro de parsing de JSON
    if (err instanceof SyntaxError && 'body' in err) {
        error = new ValidationError('Invalid JSON format');
    }

    // Se não é um erro operacional conhecido, trata como erro interno
    if (!(error instanceof AppError)) {
        error = new AppError(
            config.isDevelopment ? err.message : 'Internal server error',
            500,
            false
        );
    }

    const response: ApiResponse = {
        success: false,
        error: error.message,
        message: 'Request failed',
        ...(config.isDevelopment && error.stack && { stack: error.stack }),
    };

    res.status(error.statusCode).json(response);
};

// Middleware para capturar erros async
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
