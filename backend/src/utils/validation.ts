// Validação básica sem zod por enquanto
// import { z } from 'zod';

// Schema para validação de placa de veículo brasileira (simplificado)
export const validateLicensePlate = (plate: string): boolean => {
    if (!plate || typeof plate !== 'string') return false;
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/.test(plate);
};

// Schema para validação de CPF/CNPJ (simplificado)
export const validateCpfCnpj = (doc: string): boolean => {
    if (!doc || typeof doc !== 'string') return false;
    return /^[0-9]{11}$|^[0-9]{14}$|^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$|^[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}$/.test(doc);
};

// Schema para validação de e-mail (simplificado)
export const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Schema para validação de ano (simplificado)
export const validateYear = (year: number): boolean => {
    return year >= 1900 && year <= new Date().getFullYear() + 1;
};

// Schema para validação de quilometragem (simplificado)
export const validateMileage = (mileage: number): boolean => {
    return mileage >= 0 && mileage <= 9999999;
};

// Schema para validação de valor monetário (simplificado)
export const validateMonetaryValue = (value: number): boolean => {
    return value >= 0 && value <= 999999999;
};/**
 * Valida se uma string é um UUID válido
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Valida se uma placa está no formato brasileiro
 */
export function isValidLicensePlate(plate: string): boolean {
    return validateLicensePlate(plate);
}/**
 * Valida se um CPF é válido (algoritmo oficial)
 */
export function isValidCPF(cpf: string): boolean {
    // Remove formatação
    const cleanCPF = cpf.replace(/[^\d]/g, '');

    if (cleanCPF.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    if (parseInt(cleanCPF.charAt(9)) !== digit1) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return parseInt(cleanCPF.charAt(10)) === digit2;
}

/**
 * Valida se um CNPJ é válido (algoritmo oficial)
 */
export function isValidCNPJ(cnpj: string): boolean {
    // Remove formatação
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

    if (cleanCNPJ.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 9 ? 2 : weight + 1;
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;

    if (parseInt(cleanCNPJ.charAt(12)) !== digit1) return false;

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
export function isValidCpfCnpj(document: string): boolean {
    const clean = document.replace(/[^\d]/g, '');

    if (clean.length === 11) {
        return isValidCPF(clean);
    } else if (clean.length === 14) {
        return isValidCNPJ(clean);
    }

    return false;
}
