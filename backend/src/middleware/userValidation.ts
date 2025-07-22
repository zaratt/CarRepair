import { NextFunction, Request, Response } from 'express';
import { UserCreateData, UserUpdateData } from '../types';
import { validateDocument, validateEmail, validatePhone } from '../utils/documentValidation';
import { ValidationError } from './errorHandler';

/**
 * Middleware para validar dados de criação de usuário
 */
export function validateUserData(req: Request, res: Response, next: NextFunction) {
    const userData: UserCreateData = req.body;
    const errors: string[] = [];

    // Validações obrigatórias
    if (!userData.name || userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (!userData.email || !validateEmail(userData.email)) {
        errors.push('Valid email is required');
    }

    if (!userData.document) {
        errors.push('Document (CPF or CNPJ) is required');
    } else {
        const documentValidation = validateDocument(userData.document);
        if (!documentValidation.isValid) {
            errors.push(`Invalid document: ${documentValidation.error}`);
        } else {
            // Usar documento formatado
            userData.document = documentValidation.formatted;
        }
    }

    // Validações opcionais
    if (userData.phone && !validatePhone(userData.phone)) {
        errors.push('Invalid phone format');
    }

    if (userData.state && userData.state.length !== 2) {
        errors.push('State must be 2 characters (e.g., SP, RJ)');
    }

    if (errors.length > 0) {
        throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    next();
}

/**
 * Middleware para validar dados de atualização de usuário
 */
export function validateUserUpdateData(req: Request, res: Response, next: NextFunction) {
    const userData: UserUpdateData = req.body;
    const errors: string[] = [];

    // Só validar campos que foram fornecidos
    if (userData.name !== undefined && userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (userData.email !== undefined && !validateEmail(userData.email)) {
        errors.push('Invalid email format');
    }

    if (userData.phone !== undefined && userData.phone !== null && !validatePhone(userData.phone)) {
        errors.push('Invalid phone format');
    }

    if (userData.state !== undefined && userData.state !== null && userData.state.length !== 2) {
        errors.push('State must be 2 characters (e.g., SP, RJ)');
    }

    if (errors.length > 0) {
        throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    next();
}

/**
 * Middleware para validar UUID de usuário
 */
export function validateUserId(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('User ID is required');
    }

    // Regex para UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid user ID format');
    }

    next();
}

/**
 * Middleware para validar query parameters de busca de usuários
 */
export function validateUserSearchParams(req: Request, res: Response, next: NextFunction) {
    const { type, profile, state } = req.query;
    const errors: string[] = [];

    if (type && !['user', 'workshop'].includes(type as string)) {
        errors.push('type must be "user" or "workshop"');
    }

    if (profile && !['car_owner', 'wshop_owner'].includes(profile as string)) {
        errors.push('profile must be "car_owner" or "wshop_owner"');
    }

    if (state && (state as string).length !== 2) {
        errors.push('state must be 2 characters (e.g., SP, RJ)');
    }

    if (errors.length > 0) {
        throw new ValidationError(`Invalid search parameters: ${errors.join(', ')}`);
    }

    next();
}
