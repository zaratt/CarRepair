import { NextFunction, Request, Response } from 'express';
import { parseKilometerValue, parseMonetaryValue } from '../utils/parsing';
import {
    isValidCpfCnpj,
    isValidLicensePlate,
    validateEmail,
    validateMileage,
    validateMonetaryValue,
    validateYear
} from '../utils/validation';
import { ValidationError } from './errorHandler';

// Middleware de validação de UUID
export const validateUUID = (paramName: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const uuid = req.params[paramName];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuid || !uuidRegex.test(uuid)) {
            throw new ValidationError(`Invalid UUID format for parameter '${paramName}'`);
        }

        next();
    };
};

// Middleware de validação de placa
export const validateLicensePlateParam = (req: Request, res: Response, next: NextFunction) => {
    const { licensePlate } = req.body;

    // ✅ SEGURANÇA: Validar tipo antes do uso (CWE-1287 Prevention)
    if (licensePlate !== undefined && licensePlate !== null) {
        if (typeof licensePlate !== 'string') {
            throw new ValidationError('License plate must be a string');
        }

        if (!isValidLicensePlate(licensePlate.toUpperCase())) {
            throw new ValidationError('Invalid license plate format. Use format ABC1234 or ABC1D23');
        }

        // Normaliza a placa para maiúscula
        req.body.licensePlate = licensePlate.toUpperCase();
    }

    next();
};

// Middleware de validação de CPF/CNPJ
export const validateCpfCnpjParam = (req: Request, res: Response, next: NextFunction) => {
    const { cpfCnpj } = req.body;

    // ✅ SEGURANÇA: Validar tipo antes do uso (CWE-1287 Prevention)
    if (cpfCnpj !== undefined && cpfCnpj !== null) {
        if (typeof cpfCnpj !== 'string') {
            throw new ValidationError('CPF/CNPJ must be a string');
        }

        if (!isValidCpfCnpj(cpfCnpj)) {
            throw new ValidationError('Invalid CPF/CNPJ format');
        }
    }

    next();
};

// Middleware de validação de email
export const validateEmailParam = (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (email && !validateEmail(email)) {
        throw new ValidationError('Invalid email format');
    }

    next();
};

// Middleware de validação de campos de veículo
export const validateVehicleData = (req: Request, res: Response, next: NextFunction) => {
    const { yearManufacture, modelYear, fuelType } = req.body;

    // Validar anos
    if (yearManufacture && !validateYear(yearManufacture)) {
        throw new ValidationError('Year of manufacture must be between 1900 and current year + 1');
    }

    if (modelYear && !validateYear(modelYear)) {
        throw new ValidationError('Model year must be between 1900 and current year + 1');
    }

    // Validar tipo de combustível
    const validFuelTypes = ['GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'GNV', 'ELECTRIC', 'HYBRID', 'OTHER'];
    if (fuelType && !validFuelTypes.includes(fuelType)) {
        throw new ValidationError(`Fuel type must be one of: ${validFuelTypes.join(', ')}`);
    }

    next();
};

// Middleware de validação e parsing de manutenção
export const validateMaintenanceData = (req: Request, res: Response, next: NextFunction) => {
    const { mileage, value, date } = req.body;

    // Parse e validação de quilometragem
    if (mileage !== undefined) {
        let parsedMileage;

        if (typeof mileage === 'string') {
            parsedMileage = parseKilometerValue(mileage);
        } else {
            parsedMileage = { success: true, value: mileage, originalString: mileage.toString() };
        }

        if (!parsedMileage.success || parsedMileage.value === null) {
            const errorMsg = 'error' in parsedMileage ? parsedMileage.error : 'Could not parse mileage';
            throw new ValidationError(`Invalid mileage format: ${errorMsg}`);
        }

        if (!validateMileage(parsedMileage.value)) {
            throw new ValidationError('Mileage must be between 0 and 9,999,999 km');
        }

        req.body.mileage = parsedMileage.value;
    }

    // Parse e validação de valor monetário
    if (value !== undefined && value !== null) {
        let parsedValue;

        if (typeof value === 'string') {
            parsedValue = parseMonetaryValue(value);
        } else {
            parsedValue = { success: true, value: value, originalString: value.toString() };
        }

        if (!parsedValue.success || parsedValue.value === null) {
            const errorMsg = 'error' in parsedValue ? parsedValue.error : 'Could not parse value';
            throw new ValidationError(`Invalid monetary value format: ${errorMsg}`);
        }

        if (!validateMonetaryValue(parsedValue.value)) {
            throw new ValidationError('Value must be between R$ 0 and R$ 999,999,999');
        }

        req.body.value = parsedValue.value;
    }

    // Validação de data
    if (date) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            throw new ValidationError('Invalid date format');
        }

        // Não permitir datas futuras
        if (parsedDate > new Date()) {
            throw new ValidationError('Maintenance date cannot be in the future');
        }

        req.body.date = parsedDate;
    }

    next();
};

// Middleware de validação de campos obrigatórios
export const validateRequiredFields = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const missingFields = fields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
        }

        next();
    };
};

// Middleware de paginação
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
    // ✅ SEGURANÇA: Validar tipos dos parâmetros de query (CWE-1287 Prevention)
    const pageParam = req.query.page;
    const limitParam = req.query.limit;

    let page = 1;
    let limit = 10;

    if (pageParam !== undefined) {
        if (typeof pageParam !== 'string') {
            throw new ValidationError('Page parameter must be a string');
        }
        const parsedPage = parseInt(pageParam);
        if (isNaN(parsedPage) || parsedPage < 1) {
            throw new ValidationError('Page must be a positive number');
        }
        page = parsedPage;
    }

    if (limitParam !== undefined) {
        if (typeof limitParam !== 'string') {
            throw new ValidationError('Limit parameter must be a string');
        }
        const parsedLimit = parseInt(limitParam);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            throw new ValidationError('Limit must be a number between 1 and 100');
        }
        limit = parsedLimit;
    }

    if (page < 1) {
        throw new ValidationError('Page must be greater than 0');
    }

    if (limit > 100) {
        throw new ValidationError('Limit cannot exceed 100');
    }

    // Adicionar valores validados ao query
    req.query.page = page.toString();
    req.query.limit = limit.toString();

    next();
};
