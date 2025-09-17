"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkshopData = validateWorkshopData;
exports.validateWorkshopUpdateData = validateWorkshopUpdateData;
exports.validateWorkshopId = validateWorkshopId;
exports.validateWorkshopSearchParams = validateWorkshopSearchParams;
exports.validateSearchTerm = validateSearchTerm;
const documentValidation_1 = require("../utils/documentValidation");
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware para validar dados de criação de oficina
 */
function validateWorkshopData(req, res, next) {
    const workshopData = req.body;
    const errors = [];
    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!workshopData || typeof workshopData !== 'object') {
        throw new errorHandler_1.ValidationError('Invalid request body: expected object');
    }
    // Validações obrigatórias com verificação de tipo
    if (!workshopData.name || typeof workshopData.name !== 'string' || workshopData.name.trim().length < 2) {
        errors.push('Workshop name must be a string with at least 2 characters');
    }
    if (!workshopData.userId || typeof workshopData.userId !== 'string') {
        errors.push('User ID must be a valid string');
    }
    else {
        // Validar formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(workshopData.userId)) {
            errors.push('Invalid user ID format');
        }
    }
    if (!workshopData.address || typeof workshopData.address !== 'string' || workshopData.address.trim().length < 10) {
        errors.push('Address must be a string with at least 10 characters');
    }
    if (!workshopData.phone || typeof workshopData.phone !== 'string' || !(0, documentValidation_1.validatePhone)(workshopData.phone)) {
        errors.push('Valid phone number is required (must be string)');
    }
    // Validações opcionais com verificação de tipo
    if (workshopData.subdomain !== undefined) {
        if (typeof workshopData.subdomain !== 'string') {
            errors.push('Subdomain must be a string');
        }
        else {
            // Validar formato do subdomain (apenas letras, números e hífens)
            const subdomainRegex = /^[a-z0-9-]+$/;
            if (!subdomainRegex.test(workshopData.subdomain) || workshopData.subdomain.length < 3) {
                errors.push('Subdomain must contain only lowercase letters, numbers and hyphens, minimum 3 characters');
            }
        }
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
    }
    next();
}
/**
 * Middleware para validar dados de atualização de oficina
 */
function validateWorkshopUpdateData(req, res, next) {
    const workshopData = req.body;
    const errors = [];
    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!workshopData || typeof workshopData !== 'object') {
        throw new errorHandler_1.ValidationError('Invalid request body: expected object');
    }
    // Só validar campos que foram fornecidos com verificação de tipo
    if (workshopData.name !== undefined) {
        if (typeof workshopData.name !== 'string' || workshopData.name.trim().length < 2) {
            errors.push('Workshop name must be a string with at least 2 characters');
        }
    }
    if (workshopData.address !== undefined) {
        if (typeof workshopData.address !== 'string' || workshopData.address.trim().length < 10) {
            errors.push('Address must be a string with at least 10 characters');
        }
    }
    if (workshopData.phone !== undefined) {
        if (typeof workshopData.phone !== 'string' || !(0, documentValidation_1.validatePhone)(workshopData.phone)) {
            errors.push('Phone must be a valid string format');
        }
    }
    if (workshopData.subdomain !== undefined && workshopData.subdomain !== null) {
        if (typeof workshopData.subdomain !== 'string') {
            errors.push('Subdomain must be a string');
        }
        else {
            const subdomainRegex = /^[a-z0-9-]+$/;
            if (!subdomainRegex.test(workshopData.subdomain) || workshopData.subdomain.length < 3) {
                errors.push('Subdomain must contain only lowercase letters, numbers and hyphens, minimum 3 characters');
            }
        }
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
    }
    next();
}
/**
 * Middleware para validar UUID de oficina
 */
function validateWorkshopId(req, res, next) {
    const { id } = req.params;
    if (!id) {
        throw new errorHandler_1.ValidationError('Workshop ID is required');
    }
    // Regex para UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new errorHandler_1.ValidationError('Invalid workshop ID format');
    }
    next();
}
/**
 * Middleware para validar query parameters de busca de oficinas
 */
function validateWorkshopSearchParams(req, res, next) {
    const { minRating, state } = req.query;
    const errors = [];
    // ✅ SEGURANÇA: Validar tipos dos parâmetros de query (CWE-1287 Prevention)
    if (minRating !== undefined) {
        if (typeof minRating !== 'string') {
            errors.push('minRating must be a string representation of a number');
        }
        else {
            const rating = parseFloat(minRating);
            if (isNaN(rating) || rating < 0 || rating > 5) {
                errors.push('minRating must be a number between 0 and 5');
            }
        }
    }
    if (state !== undefined) {
        if (typeof state !== 'string') {
            errors.push('state must be a string');
        }
        else if (state.length !== 2) {
            errors.push('state must be 2 characters (e.g., SP, RJ)');
        }
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(`Invalid search parameters: ${errors.join(', ')}`);
    }
    next();
}
/**
 * Middleware para validar termo de busca
 */
function validateSearchTerm(req, res, next) {
    const { term } = req.params;
    // ✅ SEGURANÇA: Validar tipo do parâmetro (CWE-1287 Prevention)
    if (!term || typeof term !== 'string') {
        throw new errorHandler_1.ValidationError('Search term must be a valid string');
    }
    if (term.trim().length < 2) {
        throw new errorHandler_1.ValidationError('Search term must be at least 2 characters long');
    }
    next();
}
//# sourceMappingURL=workshopValidation.js.map