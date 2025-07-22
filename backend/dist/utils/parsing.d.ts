import { ParsedKilometerValue, ParsedMonetaryValue } from '@/types';
/**
 * Converte strings monetárias brasileiras para números
 * Suporta formatos: "R$ 1.500,00", "1500,50", "1.500", etc.
 */
export declare function parseMonetaryValue(input: string | null | undefined): ParsedMonetaryValue;
/**
 * Converte strings de quilometragem para números
 * Suporta formatos: "152.000", "152000", "152,000", etc.
 */
export declare function parseKilometerValue(input: string | null | undefined): ParsedKilometerValue;
/**
 * Formata um número como valor monetário brasileiro
 */
export declare function formatCurrency(value: number): string;
/**
 * Formata um número como quilometragem
 */
export declare function formatKilometers(value: number): string;
//# sourceMappingURL=parsing.d.ts.map