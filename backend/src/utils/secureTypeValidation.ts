/**
 * Utility functions for secure type validation
 * Prevents CWE-1287: Improper Validation of Specified Type of Input
 */

export interface ValidationResult<T> {
    isValid: boolean;
    value?: T;
    error?: string;
}

/**
 * Secure type validators to prevent type confusion attacks
 */
export class SecureTypeValidators {

    /**
     * Safely validate and parse a string parameter
     */
    static validateString(
        value: unknown,
        fieldName: string,
        options: {
            required?: boolean;
            minLength?: number;
            maxLength?: number;
            allowEmpty?: boolean;
        } = {}
    ): ValidationResult<string> {
        const { required = false, minLength = 0, maxLength = Infinity, allowEmpty = true } = options;

        // Check if value exists when required
        if (required && (value === undefined || value === null)) {
            return {
                isValid: false,
                error: `${fieldName} is required`
            };
        }

        // Allow undefined/null for optional fields
        if (!required && (value === undefined || value === null)) {
            return {
                isValid: true,
                value: undefined
            };
        }

        // Type validation
        if (typeof value !== 'string') {
            return {
                isValid: false,
                error: `${fieldName} must be a string`
            };
        }

        // Empty string validation
        if (!allowEmpty && value.trim().length === 0) {
            return {
                isValid: false,
                error: `${fieldName} cannot be empty`
            };
        }

        // Length validation
        const trimmedValue = value.trim();
        if (trimmedValue.length < minLength) {
            return {
                isValid: false,
                error: `${fieldName} must be at least ${minLength} characters long`
            };
        }

        if (trimmedValue.length > maxLength) {
            return {
                isValid: false,
                error: `${fieldName} cannot exceed ${maxLength} characters`
            };
        }

        return {
            isValid: true,
            value: trimmedValue
        };
    }

    /**
     * Safely validate and parse a number parameter
     */
    static validateNumber(
        value: unknown,
        fieldName: string,
        options: {
            required?: boolean;
            min?: number;
            max?: number;
            integer?: boolean;
        } = {}
    ): ValidationResult<number> {
        const { required = false, min = -Infinity, max = Infinity, integer = false } = options;

        // Check if value exists when required
        if (required && (value === undefined || value === null)) {
            return {
                isValid: false,
                error: `${fieldName} is required`
            };
        }

        // Allow undefined/null for optional fields
        if (!required && (value === undefined || value === null)) {
            return {
                isValid: true,
                value: undefined
            };
        }

        // Parse from string if needed
        let numValue: number;
        if (typeof value === 'string') {
            numValue = parseInt(value, 10);
            if (isNaN(numValue)) {
                return {
                    isValid: false,
                    error: `${fieldName} must be a valid number`
                };
            }
        } else if (typeof value === 'number') {
            numValue = value;
        } else {
            return {
                isValid: false,
                error: `${fieldName} must be a number or string representation of a number`
            };
        }

        // Integer validation
        if (integer && !Number.isInteger(numValue)) {
            return {
                isValid: false,
                error: `${fieldName} must be an integer`
            };
        }

        // Range validation
        if (numValue < min) {
            return {
                isValid: false,
                error: `${fieldName} must be at least ${min}`
            };
        }

        if (numValue > max) {
            return {
                isValid: false,
                error: `${fieldName} cannot exceed ${max}`
            };
        }

        return {
            isValid: true,
            value: numValue
        };
    }

    /**
     * Safely validate a boolean parameter
     */
    static validateBoolean(
        value: unknown,
        fieldName: string,
        options: {
            required?: boolean;
        } = {}
    ): ValidationResult<boolean> {
        const { required = false } = options;

        // Check if value exists when required
        if (required && (value === undefined || value === null)) {
            return {
                isValid: false,
                error: `${fieldName} is required`
            };
        }

        // Allow undefined/null for optional fields
        if (!required && (value === undefined || value === null)) {
            return {
                isValid: true,
                value: undefined
            };
        }

        // Parse from string if needed
        if (typeof value === 'string') {
            if (value === 'true') {
                return { isValid: true, value: true };
            } else if (value === 'false') {
                return { isValid: true, value: false };
            } else {
                return {
                    isValid: false,
                    error: `${fieldName} must be 'true' or 'false'`
                };
            }
        } else if (typeof value === 'boolean') {
            return {
                isValid: true,
                value: value
            };
        } else {
            return {
                isValid: false,
                error: `${fieldName} must be a boolean or string representation of a boolean`
            };
        }
    }

    /**
     * Safely validate an object parameter
     */
    static validateObject(
        value: unknown,
        fieldName: string,
        options: {
            required?: boolean;
            allowNull?: boolean;
        } = {}
    ): ValidationResult<object | null> {
        const { required = false, allowNull = false } = options;

        // Check if value exists when required
        if (required && (value === undefined || value === null)) {
            return {
                isValid: false,
                error: `${fieldName} is required`
            };
        }

        // Allow undefined for optional fields
        if (!required && value === undefined) {
            return {
                isValid: true,
                value: undefined
            };
        }

        // Handle null
        if (value === null) {
            if (allowNull) {
                return { isValid: true, value: null };
            } else {
                return {
                    isValid: false,
                    error: `${fieldName} cannot be null`
                };
            }
        }

        // Type validation
        if (typeof value !== 'object' || Array.isArray(value)) {
            return {
                isValid: false,
                error: `${fieldName} must be an object`
            };
        }

        return {
            isValid: true,
            value: value
        };
    }

    /**
     * Safely validate request body as object
     */
    static validateRequestBody(body: unknown): ValidationResult<object> {
        const result = this.validateObject(body, 'Request body', { required: true });
        return {
            isValid: result.isValid,
            value: result.value as object,
            error: result.error
        };
    }

    /**
     * Safely validate query parameter with automatic type conversion
     */
    static validateQueryParam(
        value: unknown,
        fieldName: string,
        type: 'string' | 'number' | 'boolean',
        options: any = {}
    ): ValidationResult<any> {
        switch (type) {
            case 'string':
                return this.validateString(value, fieldName, options);
            case 'number':
                return this.validateNumber(value, fieldName, options);
            case 'boolean':
                return this.validateBoolean(value, fieldName, options);
            default:
                return {
                    isValid: false,
                    error: `Unknown validation type: ${type}`
                };
        }
    }

    /**
     * Validate multiple query parameters at once
     */
    static validateQueryParams(
        query: any,
        schema: Record<string, {
            type: 'string' | 'number' | 'boolean';
            options?: any;
        }>
    ): ValidationResult<Record<string, any>> {
        const result: Record<string, any> = {};
        const errors: string[] = [];

        for (const [fieldName, config] of Object.entries(schema)) {
            const validation = this.validateQueryParam(
                query[fieldName],
                fieldName,
                config.type,
                config.options || {}
            );

            if (!validation.isValid) {
                errors.push(validation.error!);
            } else {
                result[fieldName] = validation.value;
            }
        }

        if (errors.length > 0) {
            return {
                isValid: false,
                error: `Validation errors: ${errors.join(', ')}`
            };
        }

        return {
            isValid: true,
            value: result
        };
    }

    /**
     * Validate required string fields in request body
     */
    static validateRequiredStringFields(
        body: any,
        fields: Array<{
            name: string;
            minLength?: number;
            maxLength?: number;
        }>
    ): ValidationResult<Record<string, string>> {
        const result: Record<string, string> = {};
        const errors: string[] = [];

        // First validate body is object
        const bodyValidation = this.validateRequestBody(body);
        if (!bodyValidation.isValid) {
            return bodyValidation as ValidationResult<Record<string, string>>;
        }

        for (const field of fields) {
            const validation = this.validateString(body[field.name], field.name, {
                required: true,
                allowEmpty: false,
                minLength: field.minLength,
                maxLength: field.maxLength
            });

            if (!validation.isValid) {
                errors.push(validation.error!);
            } else {
                result[field.name] = validation.value!;
            }
        }

        if (errors.length > 0) {
            return {
                isValid: false,
                error: `Validation errors: ${errors.join(', ')}`
            };
        }

        return {
            isValid: true,
            value: result
        };
    }
}

/**
 * Helper function to throw validation error if validation fails
 */
export function validateOrThrow<T>(validation: ValidationResult<T>): T {
    if (!validation.isValid) {
        throw new Error(validation.error || 'Validation failed');
    }
    return validation.value as T;
}