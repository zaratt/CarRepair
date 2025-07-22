import { DocumentValidation } from '../types';

/**
 * Remove caracteres não numéricos de uma string
 */
export function cleanDocument(document: string): string {
    return document.replace(/\D/g, '');
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
    const cleanCpf = cleanDocument(cpf);

    // Verificar se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
    const cleanCnpj = cleanDocument(cnpj);

    // Verificar se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

    // Validar primeiro dígito verificador
    let length = cleanCnpj.length - 2;
    let numbers = cleanCnpj.substring(0, length);
    const digits = cleanCnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validar segundo dígito verificador
    length = length + 1;
    numbers = cleanCnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}

/**
 * Formata CPF (###.###.###-##)
 */
export function formatCPF(cpf: string): string {
    const cleanCpf = cleanDocument(cpf);
    if (cleanCpf.length !== 11) return cpf;

    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ (##.###.###/####-##)
 */
export function formatCNPJ(cnpj: string): string {
    const cleanCnpj = cleanDocument(cnpj);
    if (cleanCnpj.length !== 14) return cnpj;

    return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Detecta e valida tipo de documento (CPF ou CNPJ)
 */
export function validateDocument(document: string): DocumentValidation {
    const cleanDoc = cleanDocument(document);

    if (cleanDoc.length === 11) {
        // CPF
        const isValid = validateCPF(document);
        return {
            isValid,
            type: 'cpf',
            formatted: isValid ? formatCPF(document) : document,
            originalValue: document,
            error: isValid ? undefined : 'Invalid CPF format or check digits'
        };
    } else if (cleanDoc.length === 14) {
        // CNPJ
        const isValid = validateCNPJ(document);
        return {
            isValid,
            type: 'cnpj',
            formatted: isValid ? formatCNPJ(document) : document,
            originalValue: document,
            error: isValid ? undefined : 'Invalid CNPJ format or check digits'
        };
    } else {
        return {
            isValid: false,
            type: 'unknown',
            formatted: document,
            originalValue: document,
            error: `Document must have 11 digits (CPF) or 14 digits (CNPJ), got ${cleanDoc.length}`
        };
    }
}

/**
 * Determina o tipo de usuário baseado no documento
 */
export function getUserTypeFromDocument(document: string): 'individual' | 'business' {
    const cleanDoc = cleanDocument(document);
    return cleanDoc.length === 11 ? 'individual' : 'business';
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida formato de telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    // Aceita: 10 dígitos (fixo) ou 11 dígitos (celular)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length === 10) {
        // Telefone fixo: (11) 1234-5678
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
        // Celular: (11) 91234-5678
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return phone;
}

/**
 * Valida CEP brasileiro
 */
export function validateZipCode(zipCode: string): boolean {
    const cleanZip = zipCode.replace(/\D/g, '');
    return cleanZip.length === 8;
}

/**
 * Formata CEP brasileiro (12345-678)
 */
export function formatZipCode(zipCode: string): string {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length === 8) {
        return cleanZip.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return zipCode;
}
