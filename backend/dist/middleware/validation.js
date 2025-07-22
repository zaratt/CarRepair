"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.validateRequiredFields = exports.validateMaintenanceData = exports.validateVehicleData = exports.validateEmailParam = exports.validateCpfCnpjParam = exports.validateLicensePlateParam = exports.validateUUID = void 0;
const parsing_1 = require("../utils/parsing");
const validation_1 = require("../utils/validation");
const errorHandler_1 = require("./errorHandler");
// Middleware de validação de UUID
const validateUUID = (paramName = 'id') => {
    return (req, res, next) => {
        const uuid = req.params[paramName];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuid || !uuidRegex.test(uuid)) {
            throw new errorHandler_1.ValidationError(`Invalid UUID format for parameter '${paramName}'`);
        }
        next();
    };
};
exports.validateUUID = validateUUID;
// Middleware de validação de placa
const validateLicensePlateParam = (req, res, next) => {
    const { licensePlate } = req.body;
    if (licensePlate && !(0, validation_1.isValidLicensePlate)(licensePlate.toUpperCase())) {
        throw new errorHandler_1.ValidationError('Invalid license plate format. Use format ABC1234 or ABC1D23');
    }
    // Normaliza a placa para maiúscula
    if (licensePlate) {
        req.body.licensePlate = licensePlate.toUpperCase();
    }
    next();
};
exports.validateLicensePlateParam = validateLicensePlateParam;
// Middleware de validação de CPF/CNPJ
const validateCpfCnpjParam = (req, res, next) => {
    const { cpfCnpj } = req.body;
    if (cpfCnpj && !(0, validation_1.isValidCpfCnpj)(cpfCnpj)) {
        throw new errorHandler_1.ValidationError('Invalid CPF/CNPJ format');
    }
    next();
};
exports.validateCpfCnpjParam = validateCpfCnpjParam;
// Middleware de validação de email
const validateEmailParam = (req, res, next) => {
    const { email } = req.body;
    if (email && !(0, validation_1.validateEmail)(email)) {
        throw new errorHandler_1.ValidationError('Invalid email format');
    }
    next();
};
exports.validateEmailParam = validateEmailParam;
// Middleware de validação de campos de veículo
const validateVehicleData = (req, res, next) => {
    const { yearManufacture, modelYear, fuelType } = req.body;
    // Validar anos
    if (yearManufacture && !(0, validation_1.validateYear)(yearManufacture)) {
        throw new errorHandler_1.ValidationError('Year of manufacture must be between 1900 and current year + 1');
    }
    if (modelYear && !(0, validation_1.validateYear)(modelYear)) {
        throw new errorHandler_1.ValidationError('Model year must be between 1900 and current year + 1');
    }
    // Validar tipo de combustível
    const validFuelTypes = ['GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'GNV', 'ELECTRIC', 'HYBRID', 'OTHER'];
    if (fuelType && !validFuelTypes.includes(fuelType)) {
        throw new errorHandler_1.ValidationError(`Fuel type must be one of: ${validFuelTypes.join(', ')}`);
    }
    next();
};
exports.validateVehicleData = validateVehicleData;
// Middleware de validação e parsing de manutenção
const validateMaintenanceData = (req, res, next) => {
    const { mileage, value, date } = req.body;
    // Parse e validação de quilometragem
    if (mileage !== undefined) {
        let parsedMileage;
        if (typeof mileage === 'string') {
            parsedMileage = (0, parsing_1.parseKilometerValue)(mileage);
        }
        else {
            parsedMileage = { success: true, value: mileage, originalString: mileage.toString() };
        }
        if (!parsedMileage.success || parsedMileage.value === null) {
            const errorMsg = 'error' in parsedMileage ? parsedMileage.error : 'Could not parse mileage';
            throw new errorHandler_1.ValidationError(`Invalid mileage format: ${errorMsg}`);
        }
        if (!(0, validation_1.validateMileage)(parsedMileage.value)) {
            throw new errorHandler_1.ValidationError('Mileage must be between 0 and 9,999,999 km');
        }
        req.body.mileage = parsedMileage.value;
    }
    // Parse e validação de valor monetário
    if (value !== undefined && value !== null) {
        let parsedValue;
        if (typeof value === 'string') {
            parsedValue = (0, parsing_1.parseMonetaryValue)(value);
        }
        else {
            parsedValue = { success: true, value: value, originalString: value.toString() };
        }
        if (!parsedValue.success || parsedValue.value === null) {
            const errorMsg = 'error' in parsedValue ? parsedValue.error : 'Could not parse value';
            throw new errorHandler_1.ValidationError(`Invalid monetary value format: ${errorMsg}`);
        }
        if (!(0, validation_1.validateMonetaryValue)(parsedValue.value)) {
            throw new errorHandler_1.ValidationError('Value must be between R$ 0 and R$ 999,999,999');
        }
        req.body.value = parsedValue.value;
    }
    // Validação de data
    if (date) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            throw new errorHandler_1.ValidationError('Invalid date format');
        }
        // Não permitir datas futuras
        if (parsedDate > new Date()) {
            throw new errorHandler_1.ValidationError('Maintenance date cannot be in the future');
        }
        req.body.date = parsedDate;
    }
    next();
};
exports.validateMaintenanceData = validateMaintenanceData;
// Middleware de validação de campos obrigatórios
const validateRequiredFields = (fields) => {
    return (req, res, next) => {
        const missingFields = fields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });
        if (missingFields.length > 0) {
            throw new errorHandler_1.ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
        }
        next();
    };
};
exports.validateRequiredFields = validateRequiredFields;
// Middleware de paginação
const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1) {
        throw new errorHandler_1.ValidationError('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
        throw new errorHandler_1.ValidationError('Limit must be between 1 and 100');
    }
    req.query.page = page.toString();
    req.query.limit = limit.toString();
    next();
};
exports.validatePagination = validatePagination;
//# sourceMappingURL=validation.js.map