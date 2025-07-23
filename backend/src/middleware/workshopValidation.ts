import { NextFunction, Request, Response } from 'express';
import { validatePhone } from '../utils/documentValidation';
import { ValidationError } from './errorHandler';

interface WorkshopCreateData {
    name: string;
    userId: string;
    address: string;
    phone: string;
    subdomain?: string;
}

interface WorkshopUpdateData {
    name?: string;
    address?: string;
    phone?: string;
    subdomain?: string;
}

/**
 * Middleware para validar dados de criação de oficina
 */
export function validateWorkshopData(req: Request, res: Response, next: NextFunction) {
    const workshopData: WorkshopCreateData = req.body;
    const errors: string[] = [];

    // Validações obrigatórias
    if (!workshopData.name || workshopData.name.trim().length < 2) {
        errors.push('Workshop name must be at least 2 characters long');
    }

    if (!workshopData.userId) {
        errors.push('User ID is required');
    } else {
        // Validar formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(workshopData.userId)) {
            errors.push('Invalid user ID format');
        }
    }

    if (!workshopData.address || workshopData.address.trim().length < 10) {
        errors.push('Address must be at least 10 characters long');
    }

    if (!workshopData.phone || !validatePhone(workshopData.phone)) {
        errors.push('Valid phone number is required');
    }

    // Validações opcionais
    if (workshopData.subdomain) {
        // Validar formato do subdomain (apenas letras, números e hífens)
        const subdomainRegex = /^[a-z0-9-]+$/;
        if (!subdomainRegex.test(workshopData.subdomain) || workshopData.subdomain.length < 3) {
            errors.push('Subdomain must contain only lowercase letters, numbers and hyphens, minimum 3 characters');
        }
    }

    if (errors.length > 0) {
        throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    next();
}

/**
 * Middleware para validar dados de atualização de oficina
 */
export function validateWorkshopUpdateData(req: Request, res: Response, next: NextFunction) {
    const workshopData: WorkshopUpdateData = req.body;
    const errors: string[] = [];

    // Só validar campos que foram fornecidos
    if (workshopData.name !== undefined && workshopData.name.trim().length < 2) {
        errors.push('Workshop name must be at least 2 characters long');
    }

    if (workshopData.address !== undefined && workshopData.address.trim().length < 10) {
        errors.push('Address must be at least 10 characters long');
    }

    if (workshopData.phone !== undefined && !validatePhone(workshopData.phone)) {
        errors.push('Invalid phone format');
    }

    if (workshopData.subdomain !== undefined && workshopData.subdomain !== null) {
        const subdomainRegex = /^[a-z0-9-]+$/;
        if (!subdomainRegex.test(workshopData.subdomain) || workshopData.subdomain.length < 3) {
            errors.push('Subdomain must contain only lowercase letters, numbers and hyphens, minimum 3 characters');
        }
    }

    if (errors.length > 0) {
        throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    next();
}

/**
 * Middleware para validar UUID de oficina
 */
export function validateWorkshopId(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Workshop ID is required');
    }

    // Regex para UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid workshop ID format');
    }

    next();
}

/**
 * Middleware para validar query parameters de busca de oficinas
 */
export function validateWorkshopSearchParams(req: Request, res: Response, next: NextFunction) {
    const { minRating, state } = req.query;
    const errors: string[] = [];

    if (minRating) {
        const rating = parseFloat(minRating as string);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            errors.push('minRating must be a number between 0 and 5');
        }
    }

    if (state && (state as string).length !== 2) {
        errors.push('state must be 2 characters (e.g., SP, RJ)');
    }

    if (errors.length > 0) {
        throw new ValidationError(`Invalid search parameters: ${errors.join(', ')}`);
    }

    next();
}

/**
 * Middleware para validar termo de busca
 */
export function validateSearchTerm(req: Request, res: Response, next: NextFunction) {
    const { term } = req.params;

    if (!term || term.trim().length < 2) {
        throw new ValidationError('Search term must be at least 2 characters long');
    }

    next();
}
