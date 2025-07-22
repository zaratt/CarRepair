import { DocumentValidation } from '../types';
/**
 * Remove caracteres não numéricos de uma string
 */
export declare function cleanDocument(document: string): string;
/**
 * Valida CPF
 */
export declare function validateCPF(cpf: string): boolean;
/**
 * Valida CNPJ
 */
export declare function validateCNPJ(cnpj: string): boolean;
/**
 * Formata CPF (###.###.###-##)
 */
export declare function formatCPF(cpf: string): string;
/**
 * Formata CNPJ (##.###.###/####-##)
 */
export declare function formatCNPJ(cnpj: string): string;
/**
 * Detecta e valida tipo de documento (CPF ou CNPJ)
 */
export declare function validateDocument(document: string): DocumentValidation;
/**
 * Determina o tipo de usuário baseado no documento
 */
export declare function getUserTypeFromDocument(document: string): 'individual' | 'business';
/**
 * Valida formato de email
 */
export declare function validateEmail(email: string): boolean;
/**
 * Valida formato de telefone brasileiro
 */
export declare function validatePhone(phone: string): boolean;
/**
 * Formata telefone brasileiro
 */
export declare function formatPhone(phone: string): string;
/**
 * Valida CEP brasileiro
 */
export declare function validateZipCode(zipCode: string): boolean;
/**
 * Formata CEP brasileiro (12345-678)
 */
export declare function formatZipCode(zipCode: string): string;
//# sourceMappingURL=documentValidation.d.ts.map