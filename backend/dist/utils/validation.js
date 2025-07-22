"use strict";
// Validação básica sem zod por enquanto
// import { z } from 'zod';
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMonetaryValue = exports.validateMileage = exports.validateYear = exports.validateEmail = exports.validateCpfCnpj = exports.validateLicensePlate = void 0;
exports.isValidUUID = isValidUUID;
exports.isValidLicensePlate = isValidLicensePlate;
exports.isValidCPF = isValidCPF;
exports.isValidCNPJ = isValidCNPJ;
exports.isValidCpfCnpj = isValidCpfCnpj;
// Schema para validação de placa de veículo brasileira (simplificado)
const validateLicensePlate = (plate) => {
    if (!plate || typeof plate !== 'string')
        return false;
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/.test(plate);
};
exports.validateLicensePlate = validateLicensePlate;
// Schema para validação de CPF/CNPJ (simplificado)
const validateCpfCnpj = (doc) => {
    if (!doc || typeof doc !== 'string')
        return false;
    return /^[0-9]{11}$|^[0-9]{14}$|^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$|^[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}$/.test(doc);
};
exports.validateCpfCnpj = validateCpfCnpj;
// Schema para validação de e-mail (simplificado)
const validateEmail = (email) => {
    if (!email || typeof email !== 'string')
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
exports.validateEmail = validateEmail;
// Schema para validação de ano (simplificado)
const validateYear = (year) => {
    return year >= 1900 && year <= new Date().getFullYear() + 1;
};
exports.validateYear = validateYear;
// Schema para validação de quilometragem (simplificado)
const validateMileage = (mileage) => {
    return mileage >= 0 && mileage <= 9999999;
};
exports.validateMileage = validateMileage;
// Schema para validação de valor monetário (simplificado)
const validateMonetaryValue = (value) => {
    return value >= 0 && value <= 999999999;
}; /**
 * Valida se uma string é um UUID válido
 */
exports.validateMonetaryValue = validateMonetaryValue;
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * Valida se uma placa está no formato brasileiro
 */
function isValidLicensePlate(plate) {
    return (0, exports.validateLicensePlate)(plate);
} /**
 * Valida se um CPF é válido (algoritmo oficial)
 */
function isValidCPF(cpf) {
    // Remove formatação
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (cleanCPF.length !== 11)
        return false;
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF))
        return false;
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9)
        digit1 = 0;
    if (parseInt(cleanCPF.charAt(9)) !== digit1)
        return false;
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9)
        digit2 = 0;
    return parseInt(cleanCPF.charAt(10)) === digit2;
}
/**
 * Valida se um CNPJ é válido (algoritmo oficial)
 */
function isValidCNPJ(cnpj) {
    // Remove formatação
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    if (cleanCNPJ.length !== 14)
        return false;
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ))
        return false;
    // Validação do primeiro dígito verificador
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 9 ? 2 : weight + 1;
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    if (parseInt(cleanCNPJ.charAt(12)) !== digit1)
        return false;
    // Validação do segundo dígito verificador
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 9 ? 2 : weight + 1;
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    return parseInt(cleanCNPJ.charAt(13)) === digit2;
}
/**
 * Valida CPF ou CNPJ
 */
function isValidCpfCnpj(document) {
    const clean = document.replace(/[^\d]/g, '');
    if (clean.length === 11) {
        return isValidCPF(clean);
    }
    else if (clean.length === 14) {
        return isValidCNPJ(clean);
    }
    return false;
}
//# sourceMappingURL=validation.js.map