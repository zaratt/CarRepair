/**
 * ✅ SEGURANÇA: Helper universal para validação de query/params (CWE-1287 Prevention)
 * Elimina todas as vulnerabilidades de validação de tipo inadequada
 * 
 * @fileoverview Este módulo fornece funções helpers para validação segura de req.query e req.params
 * seguindo as best practices de zero-trust e validação explícita de tipos.
 * 
 * @author CarRepair Security Team
 * @version 2.0.0
 * @since 2025-09-19
 */

import { Request } from 'express';

/**
 * ✅ SEGURANÇA: Interface para definir esquemas de validação
 */
export interface ValidationSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean';
        required?: boolean;
        defaultValue?: any;
        validator?: (value: any) => boolean;
    };
}

/**
 * ✅ SEGURANÇA: Helper universal para validação segura de req.query (CWE-1287 Prevention)
 * 
 * @param req - Request object do Express
 * @param schema - Schema de validação definindo tipos esperados
 * @returns Objeto com valores validados e sanitizados
 * 
 * @example
 * const schema: ValidationSchema = {
 *   page: { type: 'number', defaultValue: 1 },
 *   limit: { type: 'number', defaultValue: 10 },
 *   search: { type: 'string', defaultValue: '' },
 *   active: { type: 'boolean', defaultValue: true }
 * };
 * 
 * const validatedQuery = safeQueryValidation(req, schema);
 */
export function safeQueryValidation<T = Record<string, any>>(
    req: Request,
    schema: ValidationSchema
): T {
    const result: Record<string, any> = {};

    for (const [key, config] of Object.entries(schema)) {
        const queryValue = req.query[key];

        // ✅ SEGURANÇA: Validação explícita de tipo para cada parâmetro
        result[key] = validateAndSanitizeValue(queryValue, config);
    }

    return result as T;
}

/**
 * ✅ SEGURANÇA: Helper universal para validação segura de req.params (CWE-1287 Prevention)
 * 
 * @param req - Request object do Express
 * @param schema - Schema de validação definindo tipos esperados
 * @returns Objeto com valores validados e sanitizados
 * 
 * @example
 * const schema: ValidationSchema = {
 *   id: { type: 'string', required: true },
 *   userId: { type: 'string', required: true }
 * };
 * 
 * const validatedParams = safeParamsValidation(req, schema);
 */
export function safeParamsValidation<T = Record<string, any>>(
    req: Request,
    schema: ValidationSchema
): T {
    const result: Record<string, any> = {};

    for (const [key, config] of Object.entries(schema)) {
        const paramValue = req.params[key];

        // ✅ SEGURANÇA: Validação explícita de tipo para cada parâmetro
        result[key] = validateAndSanitizeValue(paramValue, config);
    }

    return result as T;
}

/**
 * ✅ SEGURANÇA: Função interna para validação e sanitização de valores
 * 
 * @param value - Valor bruto do req.query ou req.params
 * @param config - Configuração de validação
 * @returns Valor validado e sanitizado
 */
function validateAndSanitizeValue(value: unknown, config: ValidationSchema[string]): any {
    // ✅ SEGURANÇA: Verificar se valor é undefined primeiro
    if (value === undefined) {
        if (config.required) {
            throw new Error(`Required parameter is missing`);
        }
        return config.defaultValue;
    }

    // ✅ SEGURANÇA: Validação explícita de tipo baseada no schema
    switch (config.type) {
        case 'string':
            return validateStringValue(value, config);

        case 'number':
            return validateNumberValue(value, config);

        case 'boolean':
            return validateBooleanValue(value, config);

        default:
            return config.defaultValue;
    }
}

/**
 * ✅ SEGURANÇA: Validação específica para strings (CWE-1287 Prevention)
 */
function validateStringValue(value: unknown, config: ValidationSchema[string]): string {
    // ✅ SEGURANÇA: Verificação explícita de tipo string
    if (typeof value === 'string') {
        const trimmedValue = value.trim();

        // ✅ Aplicar validador customizado se fornecido
        if (config.validator && !config.validator(trimmedValue)) {
            return config.defaultValue || '';
        }

        return trimmedValue;
    }

    // ✅ SEGURANÇA: Tratamento de arrays (query params podem ser arrays)
    if (Array.isArray(value)) {
        const firstValue = value[0];
        if (typeof firstValue === 'string') {
            const trimmedValue = firstValue.trim();

            if (config.validator && !config.validator(trimmedValue)) {
                return config.defaultValue || '';
            }

            return trimmedValue;
        }
    }

    // ✅ SEGURANÇA: Fallback seguro para outros tipos
    return config.defaultValue || '';
}

/**
 * ✅ SEGURANÇA: Validação específica para numbers (CWE-1287 Prevention)
 */
function validateNumberValue(value: unknown, config: ValidationSchema[string]): number {
    // ✅ SEGURANÇA: Verificação explícita de tipo number
    if (typeof value === 'number' && !isNaN(value)) {
        return value;
    }

    // ✅ SEGURANÇA: Verificação explícita de tipo string (para conversão)
    if (typeof value === 'string') {
        const parsed = parseInt(value.trim(), 10);
        if (!isNaN(parsed)) {
            // ✅ Aplicar validador customizado se fornecido
            if (config.validator && !config.validator(parsed)) {
                return config.defaultValue || 0;
            }
            return parsed;
        }
    }

    // ✅ SEGURANÇA: Tratamento de arrays
    if (Array.isArray(value)) {
        const firstValue = value[0];
        if (typeof firstValue === 'string') {
            const parsed = parseInt(firstValue.trim(), 10);
            if (!isNaN(parsed)) {
                if (config.validator && !config.validator(parsed)) {
                    return config.defaultValue || 0;
                }
                return parsed;
            }
        }
    }

    // ✅ SEGURANÇA: Fallback seguro
    return config.defaultValue || 0;
}

/**
 * ✅ SEGURANÇA: Validação específica para booleans (CWE-1287 Prevention)
 */
function validateBooleanValue(value: unknown, config: ValidationSchema[string]): boolean {
    // ✅ SEGURANÇA: Verificação explícita de tipo boolean
    if (typeof value === 'boolean') {
        return value;
    }

    // ✅ SEGURANÇA: Verificação explícita de tipo string (para conversão)
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === '1') {
            return true;
        }
        if (lowerValue === 'false' || lowerValue === '0') {
            return false;
        }
    }

    // ✅ SEGURANÇA: Tratamento de arrays
    if (Array.isArray(value)) {
        const firstValue = value[0];
        if (typeof firstValue === 'string') {
            const lowerValue = firstValue.toLowerCase().trim();
            if (lowerValue === 'true' || lowerValue === '1') {
                return true;
            }
            if (lowerValue === 'false' || lowerValue === '0') {
                return false;
            }
        }
    }

    // ✅ SEGURANÇA: Fallback seguro
    return config.defaultValue || false;
}

/**
 * ✅ SEGURANÇA: Helper para validação de single query param (backward compatibility)
 * 
 * @param req - Request object
 * @param paramName - Nome do parâmetro
 * @param type - Tipo esperado
 * @param defaultValue - Valor padrão
 * @returns Valor validado
 */
export function safeSingleQuery<T>(
    req: Request,
    paramName: string,
    type: 'string' | 'number' | 'boolean',
    defaultValue: T
): T {
    const schema: ValidationSchema = {
        [paramName]: { type, defaultValue }
    };

    const result = safeQueryValidation(req, schema);
    return result[paramName] as T;
}

/**
 * ✅ SEGURANÇA: Helper para validação de single param (backward compatibility)
 * 
 * @param req - Request object
 * @param paramName - Nome do parâmetro
 * @param type - Tipo esperado
 * @param required - Se é obrigatório
 * @returns Valor validado
 */
export function safeSingleParam<T>(
    req: Request,
    paramName: string,
    type: 'string' | 'number' | 'boolean',
    required: boolean = true
): T {
    const schema: ValidationSchema = {
        [paramName]: { type, required }
    };

    const result = safeParamsValidation(req, schema);
    return result[paramName] as T;
}

/**
 * ✅ SEGURANÇA: Helper específico para validação de paginação (uso comum)
 * 
 * @param req - Request object
 * @returns Parâmetros de paginação validados
 */
export function safePaginationQuery(req: Request): { page: number; limit: number } {
    const schema: ValidationSchema = {
        page: {
            type: 'number',
            defaultValue: 1,
            validator: (val: number) => val > 0
        },
        limit: {
            type: 'number',
            defaultValue: 10,
            validator: (val: number) => val > 0 && val <= 100
        }
    };

    return safeQueryValidation(req, schema);
}

/**
 * ✅ SEGURANÇA: Helper específico para validação de req.body (CWE-1287 Prevention)
 * 
 * @param req - Request object
 * @returns Validated body object
 */
export function safeBodyValidation(req: Request): any {
    // ✅ SEGURANÇA CWE-1287: Validação explícita de req.body antes de uso
    if (!req.body || typeof req.body !== 'object') {
        throw new Error('Request body must be a valid object');
    }

    // ✅ SEGURANÇA: Validação segura de estrutura do body
    const bodyData = req.body;
    if (Array.isArray(bodyData)) {
        throw new Error('Request body cannot be an array');
    }

    return bodyData;
}

/**
 * ✅ SEGURANÇA: Helper específico para validação de filtros de usuário
 * 
 * @param req - Request object
 * @returns Filtros de usuário validados
 */
export function safeUserFiltersQuery(req: Request): {
    userType: string;
    profile: string;
    state: string;
    search: string;
} {
    const schema: ValidationSchema = {
        userType: { type: 'string', defaultValue: '' },
        profile: { type: 'string', defaultValue: '' },
        state: { type: 'string', defaultValue: '' },
        search: { type: 'string', defaultValue: '' }
    };

    return safeQueryValidation(req, schema);
}