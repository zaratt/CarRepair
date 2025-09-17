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
export declare class SecureTypeValidators {
    /**
     * Safely validate and parse a string parameter
     */
    static validateString(value: unknown, fieldName: string, options?: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        allowEmpty?: boolean;
    }): ValidationResult<string>;
    /**
     * Safely validate and parse a number parameter
     */
    static validateNumber(value: unknown, fieldName: string, options?: {
        required?: boolean;
        min?: number;
        max?: number;
        integer?: boolean;
    }): ValidationResult<number>;
    /**
     * Safely validate a boolean parameter
     */
    static validateBoolean(value: unknown, fieldName: string, options?: {
        required?: boolean;
    }): ValidationResult<boolean>;
    /**
     * Safely validate an object parameter
     */
    static validateObject(value: unknown, fieldName: string, options?: {
        required?: boolean;
        allowNull?: boolean;
    }): ValidationResult<object | null>;
    /**
     * Safely validate request body as object
     */
    static validateRequestBody(body: unknown): ValidationResult<object>;
    /**
     * Safely validate query parameter with automatic type conversion
     */
    static validateQueryParam(value: unknown, fieldName: string, type: 'string' | 'number' | 'boolean', options?: any): ValidationResult<any>;
    /**
     * Validate multiple query parameters at once
     */
    static validateQueryParams(query: any, schema: Record<string, {
        type: 'string' | 'number' | 'boolean';
        options?: any;
    }>): ValidationResult<Record<string, any>>;
    /**
     * Validate required string fields in request body
     */
    static validateRequiredStringFields(body: any, fields: Array<{
        name: string;
        minLength?: number;
        maxLength?: number;
    }>): ValidationResult<Record<string, string>>;
}
/**
 * Helper function to throw validation error if validation fails
 */
export declare function validateOrThrow<T>(validation: ValidationResult<T>): T;
//# sourceMappingURL=secureTypeValidation.d.ts.map