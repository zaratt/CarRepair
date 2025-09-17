"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
const config_1 = require("../config");
const auth_1 = require("../utils/auth");
// Tipos de erro customizados
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field) {
        super(`Validation error: ${message}${field ? ` (field: ${field})` : ''}`, 400);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
// Middleware de tratamento de erros global
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // ✅ SEGURANÇA: Sanitizar dados da request antes do log (CWE-134 Prevention)
    const sanitizedMethod = (0, auth_1.sanitizeForLog)(req.method || 'UNKNOWN');
    const sanitizedPath = (0, auth_1.sanitizeForLog)(req.path || '/unknown');
    const sanitizedMessage = (0, auth_1.sanitizeForLog)(err.message || 'Unknown error');
    // ✅ Log do erro com format string estático (CWE-134 Prevention)
    console.error('🚨 Error Details:', {
        method: sanitizedMethod,
        path: sanitizedPath,
        message: sanitizedMessage,
        stack: config_1.config.isDevelopment ? err.stack : undefined,
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
        error = new AppError(config_1.config.isDevelopment ? err.message : 'Internal server error', 500, false);
    }
    const response = {
        success: false,
        error: error.message,
        message: 'Request failed',
        ...(config_1.config.isDevelopment && error.stack && { stack: error.stack }),
    };
    res.status(error.statusCode).json(response);
};
exports.errorHandler = errorHandler;
// Middleware para capturar erros async
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map