"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestBody = exports.TypeGuards = exports.TypeValidators = void 0;
// Validadores de tipo para req.body e req.query
exports.TypeValidators = {
    /**
     * Valida se um valor é string e aplica transformação segura
     */
    safeString: (value, fallback = '') => {
        if (typeof value === 'string') {
            return value;
        }
        return fallback;
    },
    /**
     * Aplica trim de forma segura
     */
    safeTrim: (value) => {
        if (typeof value === 'string') {
            return value.trim();
        }
        return '';
    },
    /**
     * Aplica toLowerCase de forma segura
     */
    safeToLowerCase: (value) => {
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
        return '';
    },
    /**
     * Aplica toUpperCase de forma segura
     */
    safeToUpperCase: (value) => {
        if (typeof value === 'string') {
            return value.toUpperCase();
        }
        return '';
    },
    /**
     * Valida se um valor é número
     */
    safeNumber: (value, fallback = 0) => {
        if (typeof value === 'number' && !isNaN(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? fallback : parsed;
        }
        return fallback;
    },
    /**
     * Valida se um valor é boolean
     */
    safeBoolean: (value, fallback = false) => {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return fallback;
    }
};
/**
 * Type guards para validação de estruturas de dados
 */
exports.TypeGuards = {
    /**
     * Valida UserCreateData
     */
    isUserCreateData: (data) => {
        return (typeof data === 'object' &&
            data !== null &&
            typeof data.name === 'string' &&
            typeof data.email === 'string' &&
            typeof data.document === 'string' &&
            (data.phone === undefined || typeof data.phone === 'string') &&
            (data.city === undefined || typeof data.city === 'string') &&
            (data.state === undefined || typeof data.state === 'string'));
    },
    /**
     * Valida UserUpdateData
     */
    isUserUpdateData: (data) => {
        return (typeof data === 'object' &&
            data !== null &&
            (data.name === undefined || typeof data.name === 'string') &&
            (data.email === undefined || typeof data.email === 'string') &&
            (data.phone === undefined || typeof data.phone === 'string') &&
            (data.city === undefined || typeof data.city === 'string') &&
            (data.state === undefined || typeof data.state === 'string'));
    }
};
/**
 * Middleware de validação de tipos para Express
 */
const validateRequestBody = (validator, errorMessage = 'Invalid request body structure') => {
    return (req, res, next) => {
        if (!validator(req.body)) {
            return res.status(400).json({
                success: false,
                message: errorMessage,
                error: 'INVALID_REQUEST_BODY'
            });
        }
        next();
    };
};
exports.validateRequestBody = validateRequestBody;
//# sourceMappingURL=typeValidation.js.map