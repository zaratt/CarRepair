"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserData = validateUserData;
exports.validateUserUpdateData = validateUserUpdateData;
exports.validateUserId = validateUserId;
exports.validateUserSearchParams = validateUserSearchParams;
const documentValidation_1 = require("../utils/documentValidation");
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware para validar dados de criação de usuário
 */
function validateUserData(req, res, next) {
    const userData = req.body;
    const errors = [];
    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!userData || typeof userData !== 'object') {
        throw new errorHandler_1.ValidationError('Invalid request body: expected object');
    }
    // Validações obrigatórias com verificação de tipo
    if (!userData.name || typeof userData.name !== 'string' || userData.name.trim().length < 2) {
        errors.push('Name must be a string with at least 2 characters');
    }
    if (!userData.email || typeof userData.email !== 'string' || !(0, documentValidation_1.validateEmail)(userData.email)) {
        errors.push('Valid email is required (must be string)');
    }
    if (!userData.document || typeof userData.document !== 'string') {
        errors.push('Document (CPF or CNPJ) is required and must be a string');
    }
    else {
        const documentValidation = (0, documentValidation_1.validateDocument)(userData.document);
        if (!documentValidation.isValid) {
            errors.push(`Invalid document: ${documentValidation.error}`);
        }
        else {
            // Usar documento formatado
            userData.document = documentValidation.formatted;
        }
    }
    // Validações opcionais com verificação de tipo
    if (userData.phone !== undefined && userData.phone !== null) {
        if (typeof userData.phone !== 'string' || !(0, documentValidation_1.validatePhone)(userData.phone)) {
            errors.push('Phone must be a valid string format');
        }
    }
    if (userData.state !== undefined && userData.state !== null) {
        if (typeof userData.state !== 'string' || userData.state.length !== 2) {
            errors.push('State must be a string with 2 characters (e.g., SP, RJ)');
        }
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
    }
    next();
}
/**
 * Middleware para validar dados de atualização de usuário
 */
function validateUserUpdateData(req, res, next) {
    const userData = req.body;
    const errors = [];
    // ✅ SEGURANÇA: Validar tipos de entrada (CWE-1287 Prevention)
    if (!userData || typeof userData !== 'object') {
        throw new errorHandler_1.ValidationError('Invalid request body: expected object');
    }
    // Só validar campos que foram fornecidos com verificação de tipo
    if (userData.name !== undefined) {
        if (typeof userData.name !== 'string' || userData.name.trim().length < 2) {
            errors.push('Name must be a string with at least 2 characters');
        }
    }
    if (userData.email !== undefined) {
        if (typeof userData.email !== 'string' || !(0, documentValidation_1.validateEmail)(userData.email)) {
            errors.push('Email must be a valid string format');
        }
    }
    if (userData.phone !== undefined && userData.phone !== null) {
        if (typeof userData.phone !== 'string' || !(0, documentValidation_1.validatePhone)(userData.phone)) {
            errors.push('Phone must be a valid string format');
        }
    }
    if (userData.state !== undefined && userData.state !== null) {
        if (typeof userData.state !== 'string' || userData.state.length !== 2) {
            errors.push('State must be a string with 2 characters (e.g., SP, RJ)');
        }
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
    }
    next();
}
/**
 * Middleware para validar UUID de usuário
 */
function validateUserId(req, res, next) {
    const { id } = req.params;
    if (!id) {
        throw new errorHandler_1.ValidationError('User ID is required');
    }
    // Regex para UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new errorHandler_1.ValidationError('Invalid user ID format');
    }
    next();
}
/**
 * Middleware para validar query parameters de busca de usuários
 */
function validateUserSearchParams(req, res, next) {
    const { type, profile, state } = req.query;
    const errors = [];
    // ✅ SEGURANÇA: Validar tipos dos parâmetros de query (CWE-1287 Prevention)
    if (type !== undefined) {
        if (typeof type !== 'string') {
            errors.push('type must be a string');
        }
        else if (!['user', 'workshop'].includes(type)) {
            errors.push('type must be "user" or "workshop"');
        }
    }
    if (profile !== undefined) {
        if (typeof profile !== 'string') {
            errors.push('profile must be a string');
        }
        else if (!['car_owner', 'wshop_owner'].includes(profile)) {
            errors.push('profile must be "car_owner" or "wshop_owner"');
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
//# sourceMappingURL=userValidation.js.map