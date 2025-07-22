export declare const validateLicensePlate: (plate: string) => boolean;
export declare const validateCpfCnpj: (doc: string) => boolean;
export declare const validateEmail: (email: string) => boolean;
export declare const validateYear: (year: number) => boolean;
export declare const validateMileage: (mileage: number) => boolean;
export declare const validateMonetaryValue: (value: number) => boolean; /**
 * Valida se uma string é um UUID válido
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * Valida se uma placa está no formato brasileiro
 */
export declare function isValidLicensePlate(plate: string): boolean; /**
 * Valida se um CPF é válido (algoritmo oficial)
 */
export declare function isValidCPF(cpf: string): boolean;
/**
 * Valida se um CNPJ é válido (algoritmo oficial)
 */
export declare function isValidCNPJ(cnpj: string): boolean;
/**
 * Valida CPF ou CNPJ
 */
export declare function isValidCpfCnpj(document: string): boolean;
//# sourceMappingURL=validation.d.ts.map