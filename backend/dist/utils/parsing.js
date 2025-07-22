"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMonetaryValue = parseMonetaryValue;
exports.parseKilometerValue = parseKilometerValue;
exports.formatCurrency = formatCurrency;
exports.formatKilometers = formatKilometers;
/**
 * Converte strings monetárias brasileiras para números
 * Suporta formatos: "R$ 1.500,00", "1500,50", "1.500", etc.
 */
function parseMonetaryValue(input) {
    const result = {
        success: false,
        value: null,
        originalString: input || '',
    };
    if (!input || typeof input !== 'string') {
        result.error = 'Input is null, undefined, or not a string';
        return result;
    }
    try {
        // Remove espaços, R$, e outros caracteres não numéricos exceto vírgula e ponto
        let cleaned = input.trim()
            .replace(/R\$?\s*/gi, '') // Remove R$ ou R com espaços
            .replace(/[^\d.,]/g, '') // Mantém apenas dígitos, vírgulas e pontos
            .trim();
        if (!cleaned) {
            result.error = 'No numeric content found after cleaning';
            return result;
        }
        // Identifica o formato brasileiro (vírgula como decimal)
        const hasComma = cleaned.includes(',');
        const hasDot = cleaned.includes('.');
        if (hasComma && hasDot) {
            // Formato: 1.500,50 (ponto como separador de milhares, vírgula como decimal)
            const parts = cleaned.split(',');
            if (parts.length === 2) {
                const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
                const decimalPart = parts[1];
                cleaned = `${integerPart}.${decimalPart}`; // Formato americano para parseFloat
            }
        }
        else if (hasComma && !hasDot) {
            // Formato: 1500,50 (vírgula como decimal)
            cleaned = cleaned.replace(',', '.');
        }
        else if (hasDot && !hasComma) {
            // Pode ser 1500.50 (decimal) ou 1.500 (milhares)
            const parts = cleaned.split('.');
            if (parts.length === 2) {
                const decimalPart = parts[1];
                if (decimalPart.length <= 2) {
                    // Provavelmente é decimal (1500.50)
                    // Mantém como está
                }
                else {
                    // Provavelmente são milhares (1.500.000)
                    cleaned = cleaned.replace(/\./g, '');
                }
            }
        }
        const numericValue = parseFloat(cleaned);
        if (isNaN(numericValue)) {
            result.error = `Could not parse "${cleaned}" to a valid number`;
            return result;
        }
        result.success = true;
        result.value = numericValue;
        return result;
    }
    catch (error) {
        result.error = `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return result;
    }
}
/**
 * Converte strings de quilometragem para números
 * Suporta formatos: "152.000", "152000", "152,000", etc.
 */
function parseKilometerValue(input) {
    const result = {
        success: false,
        value: null,
        originalString: input || '',
    };
    if (!input || typeof input !== 'string') {
        result.error = 'Input is null, undefined, or not a string';
        return result;
    }
    try {
        // Remove espaços e "km" se presente
        let cleaned = input.trim()
            .replace(/km\s*$/gi, '') // Remove "km" no final
            .replace(/[^\d.,]/g, '') // Mantém apenas dígitos, vírgulas e pontos
            .trim();
        if (!cleaned) {
            result.error = 'No numeric content found after cleaning';
            return result;
        }
        // Para quilometragem, assumimos que pontos e vírgulas são separadores de milhares
        // Quilometragem raramente tem casas decimais
        const hasComma = cleaned.includes(',');
        const hasDot = cleaned.includes('.');
        if (hasComma && hasDot) {
            // Formato: 1.152,000 - remove ambos os separadores
            cleaned = cleaned.replace(/[.,]/g, '');
        }
        else if (hasComma) {
            // Formato: 152,000 - remove vírgula
            cleaned = cleaned.replace(/,/g, '');
        }
        else if (hasDot) {
            // Formato: 152.000 - remove ponto
            cleaned = cleaned.replace(/\./g, '');
        }
        const numericValue = parseInt(cleaned, 10);
        if (isNaN(numericValue)) {
            result.error = `Could not parse "${cleaned}" to a valid integer`;
            return result;
        }
        result.success = true;
        result.value = numericValue;
        return result;
    }
    catch (error) {
        result.error = `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return result;
    }
}
/**
 * Formata um número como valor monetário brasileiro
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
/**
 * Formata um número como quilometragem
 */
function formatKilometers(value) {
    return new Intl.NumberFormat('pt-BR').format(value) + ' km';
}
//# sourceMappingURL=parsing.js.map