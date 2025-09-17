"use strict";
/**
 * Utility functions for secure type validation
 * Prevents CWE-1287: Improper Validation of Specified Type of Input
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureTypeValidators = void 0;
exports.validateOrThrow = validateOrThrow;
/**
 * Secure type validators to prevent type confusion attacks
 */
class SecureTypeValidators {
    /**
     * Safely validate and parse a string parameter
     */
    static validateString(value, fieldName, options = {}) {
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
    static validateNumber(value, fieldName, options = {}) {
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
        let numValue;
        if (typeof value === 'string') {
            numValue = parseInt(value, 10);
            if (isNaN(numValue)) {
                return {
                    isValid: false,
                    error: `${fieldName} must be a valid number`
                };
            }
        }
        else if (typeof value === 'number') {
            numValue = value;
        }
        else {
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
    static validateBoolean(value, fieldName, options = {}) {
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
            }
            else if (value === 'false') {
                return { isValid: true, value: false };
            }
            else {
                return {
                    isValid: false,
                    error: `${fieldName} must be 'true' or 'false'`
                };
            }
        }
        else if (typeof value === 'boolean') {
            return {
                isValid: true,
                value: value
            };
        }
        else {
            return {
                isValid: false,
                error: `${fieldName} must be a boolean or string representation of a boolean`
            };
        }
    }
    /**
     * Safely validate an object parameter
     */
    static validateObject(value, fieldName, options = {}) {
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
            }
            else {
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
    static validateRequestBody(body) {
        const result = this.validateObject(body, 'Request body', { required: true });
        return {
            isValid: result.isValid,
            value: result.value,
            error: result.error
        };
    }
    /**
     * Safely validate query parameter with automatic type conversion
     */
    static validateQueryParam(value, fieldName, type, options = {}) {
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
    static validateQueryParams(query, schema) {
        const result = {};
        const errors = [];
        for (const [fieldName, config] of Object.entries(schema)) {
            const validation = this.validateQueryParam(query[fieldName], fieldName, config.type, config.options || {});
            if (!validation.isValid) {
                errors.push(validation.error);
            }
            else {
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
    static validateRequiredStringFields(body, fields) {
        const result = {};
        const errors = [];
        // First validate body is object
        const bodyValidation = this.validateRequestBody(body);
        if (!bodyValidation.isValid) {
            return bodyValidation;
        }
        for (const field of fields) {
            const validation = this.validateString(body[field.name], field.name, {
                required: true,
                allowEmpty: false,
                minLength: field.minLength,
                maxLength: field.maxLength
            });
            if (!validation.isValid) {
                errors.push(validation.error);
            }
            else {
                result[field.name] = validation.value;
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
exports.SecureTypeValidators = SecureTypeValidators;
/**
 * Helper function to throw validation error if validation fails
 */
function validateOrThrow(validation) {
    if (!validation.isValid) {
        throw new Error(validation.error || 'Validation failed');
    }
    return validation.value;
}
//# sourceMappingURL=secureTypeValidation.js.map