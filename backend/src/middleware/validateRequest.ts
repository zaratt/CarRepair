import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

/**
 * Middleware para validar requisições usando express-validator
 * Deve ser usado após as validações do express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? (error as any).value : undefined
        }));

        const response: ApiResponse = {
            success: false,
            message: 'Dados de entrada inválidos',
            error: 'Validation failed',
            data: {
                errors: formattedErrors
            }
        };

        res.status(400).json(response);
        return;
    }

    next();
};