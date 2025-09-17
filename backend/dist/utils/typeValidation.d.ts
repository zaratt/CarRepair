export declare const TypeValidators: {
    /**
     * Valida se um valor é string e aplica transformação segura
     */
    safeString: (value: unknown, fallback?: string) => string;
    /**
     * Aplica trim de forma segura
     */
    safeTrim: (value: unknown) => string;
    /**
     * Aplica toLowerCase de forma segura
     */
    safeToLowerCase: (value: unknown) => string;
    /**
     * Aplica toUpperCase de forma segura
     */
    safeToUpperCase: (value: unknown) => string;
    /**
     * Valida se um valor é número
     */
    safeNumber: (value: unknown, fallback?: number) => number;
    /**
     * Valida se um valor é boolean
     */
    safeBoolean: (value: unknown, fallback?: boolean) => boolean;
};
/**
 * Type guards para validação de estruturas de dados
 */
export declare const TypeGuards: {
    /**
     * Valida UserCreateData
     */
    isUserCreateData: (data: any) => data is {
        name: string;
        email: string;
        document: string;
        phone?: string;
        city?: string;
        state?: string;
    };
    /**
     * Valida UserUpdateData
     */
    isUserUpdateData: (data: any) => data is {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
    };
};
/**
 * Middleware de validação de tipos para Express
 */
export declare const validateRequestBody: <T>(validator: (data: any) => data is T, errorMessage?: string) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=typeValidation.d.ts.map