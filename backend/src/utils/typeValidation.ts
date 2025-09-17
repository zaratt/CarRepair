// Validadores de tipo para req.body e req.query
export const TypeValidators = {
    /**
     * Valida se um valor é string e aplica transformação segura
     */
    safeString: (value: unknown, fallback: string = ''): string => {
        if (typeof value === 'string') {
            return value;
        }
        return fallback;
    },

    /**
     * Aplica trim de forma segura
     */
    safeTrim: (value: unknown): string => {
        if (typeof value === 'string') {
            return value.trim();
        }
        return '';
    },

    /**
     * Aplica toLowerCase de forma segura
     */
    safeToLowerCase: (value: unknown): string => {
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
        return '';
    },

    /**
     * Aplica toUpperCase de forma segura
     */
    safeToUpperCase: (value: unknown): string => {
        if (typeof value === 'string') {
            return value.toUpperCase();
        }
        return '';
    },

    /**
     * Valida se um valor é número
     */
    safeNumber: (value: unknown, fallback: number = 0): number => {
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
    safeBoolean: (value: unknown, fallback: boolean = false): boolean => {
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
export const TypeGuards = {
    /**
     * Valida UserCreateData
     */
    isUserCreateData: (data: any): data is {
        name: string;
        email: string;
        document: string;
        phone?: string;
        city?: string;
        state?: string;
    } => {
        return (
            typeof data === 'object' &&
            data !== null &&
            typeof data.name === 'string' &&
            typeof data.email === 'string' &&
            typeof data.document === 'string' &&
            (data.phone === undefined || typeof data.phone === 'string') &&
            (data.city === undefined || typeof data.city === 'string') &&
            (data.state === undefined || typeof data.state === 'string')
        );
    },

    /**
     * Valida UserUpdateData
     */
    isUserUpdateData: (data: any): data is {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
    } => {
        return (
            typeof data === 'object' &&
            data !== null &&
            (data.name === undefined || typeof data.name === 'string') &&
            (data.email === undefined || typeof data.email === 'string') &&
            (data.phone === undefined || typeof data.phone === 'string') &&
            (data.city === undefined || typeof data.city === 'string') &&
            (data.state === undefined || typeof data.state === 'string')
        );
    }
};

/**
 * Middleware de validação de tipos para Express
 */
export const validateRequestBody = <T>(
    validator: (data: any) => data is T,
    errorMessage: string = 'Invalid request body structure'
) => {
    return (req: any, res: any, next: any) => {
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