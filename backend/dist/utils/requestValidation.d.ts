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
export declare function safeQueryValidation<T = Record<string, any>>(req: Request, schema: ValidationSchema): T;
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
export declare function safeParamsValidation<T = Record<string, any>>(req: Request, schema: ValidationSchema): T;
/**
 * ✅ SEGURANÇA: Helper para validação de single query param (backward compatibility)
 *
 * @param req - Request object
 * @param paramName - Nome do parâmetro
 * @param type - Tipo esperado
 * @param defaultValue - Valor padrão
 * @returns Valor validado
 */
export declare function safeSingleQuery<T>(req: Request, paramName: string, type: 'string' | 'number' | 'boolean', defaultValue: T): T;
/**
 * ✅ SEGURANÇA: Helper para validação de single param (backward compatibility)
 *
 * @param req - Request object
 * @param paramName - Nome do parâmetro
 * @param type - Tipo esperado
 * @param required - Se é obrigatório
 * @returns Valor validado
 */
export declare function safeSingleParam<T>(req: Request, paramName: string, type: 'string' | 'number' | 'boolean', required?: boolean): T;
/**
 * ✅ SEGURANÇA: Helper específico para validação de paginação (uso comum)
 *
 * @param req - Request object
 * @returns Parâmetros de paginação validados
 */
export declare function safePaginationQuery(req: Request): {
    page: number;
    limit: number;
};
/**
 * ✅ SEGURANÇA: Helper específico para validação de req.body (CWE-1287 Prevention)
 *
 * @param req - Request object
 * @returns Validated body object
 */
export declare function safeBodyValidation(req: Request): any;
/**
 * ✅ SEGURANÇA: Helper específico para validação de filtros de usuário
 *
 * @param req - Request object
 * @returns Filtros de usuário validados
 */
export declare function safeUserFiltersQuery(req: Request): {
    userType: string;
    profile: string;
    state: string;
    search: string;
};
//# sourceMappingURL=requestValidation.d.ts.map