import { validate as validateCpf } from 'gerador-validador-cpf';

export class DocumentValidator {
    // ✅ VALIDAR CPF (usando biblioteca gerador-validador-cpf)
    static isValidCPF(cpfStr: string): boolean {
        try {
            // A biblioteca já lida com formatação automaticamente
            return validateCpf(cpfStr);
        } catch (error) {
            return false;
        }
    }

    // ✅ VALIDAR CNPJ (numérico E alfanumérico)
    static isValidCNPJ(cnpj: string): boolean {
        try {
            // Remove caracteres não alfanuméricos (mantém apenas 0-9 e A-Z)
            const cleanCNPJ = cnpj.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

            // Verifica se tem exatamente 14 caracteres
            if (cleanCNPJ.length !== 14) return false;

            // Verifica se todos os caracteres são iguais (inválido)
            if (/^(.)\1*$/.test(cleanCNPJ)) return false;

            // Função para converter caractere alfanumérico para valor numérico
            const getCharValue = (char: string): number => {
                if (/\d/.test(char)) {
                    return parseInt(char);
                } else if (/[A-Z]/.test(char)) {
                    // A=10, B=11, ..., Z=35
                    return char.charCodeAt(0) - 55;
                }
                return 0;
            };

            // Validação do primeiro dígito verificador
            let sum = 0;
            let weight = 2;
            for (let i = 11; i >= 0; i--) {
                sum += getCharValue(cleanCNPJ[i]) * weight;
                weight = weight === 9 ? 2 : weight + 1;
            }
            let remainder = sum % 11;
            const expectedDigit1 = remainder < 2 ? 0 : 11 - remainder;

            const actualDigit1 = getCharValue(cleanCNPJ[12]);
            if (actualDigit1 !== expectedDigit1) return false;

            // Validação do segundo dígito verificador
            sum = 0;
            weight = 2;
            for (let i = 12; i >= 0; i--) {
                sum += getCharValue(cleanCNPJ[i]) * weight;
                weight = weight === 9 ? 2 : weight + 1;
            }
            remainder = sum % 11;
            const expectedDigit2 = remainder < 2 ? 0 : 11 - remainder;

            const actualDigit2 = getCharValue(cleanCNPJ[13]);
            return actualDigit2 === expectedDigit2;
        } catch (error) {
            return false;
        }
    }

    // ✅ VALIDAR DOCUMENTO (CPF OU CNPJ) com detalhes
    static isValidDocument(document: string): {
        isValid: boolean;
        type: 'CPF' | 'CNPJ' | null;
        error?: string;
    } {
        const cleanNumeric = document.replace(/[^\d]/g, '');
        const cleanAlphanumeric = document.replace(/[^0-9A-Za-z]/g, '');

        // Primeiro tenta como CPF (sempre numérico)
        if (cleanNumeric.length === 11) {
            const isValid = this.isValidCPF(document);
            return {
                isValid,
                type: 'CPF',
                error: isValid ? undefined : 'CPF inválido'
            };
        }
        // Depois tenta como CNPJ (alfanumérico)
        else if (cleanAlphanumeric.length === 14) {
            const isValid = this.isValidCNPJ(document);
            return {
                isValid,
                type: 'CNPJ',
                error: isValid ? undefined : 'CNPJ inválido'
            };
        }

        // Documento incompleto ou inválido
        if (cleanAlphanumeric.length === 0) {
            return {
                isValid: false,
                type: null,
                error: 'Digite CPF (11 dígitos) ou CNPJ (14 caracteres alfanuméricos)'
            };
        } else if (cleanNumeric.length > 0 && cleanNumeric.length < 11) {
            return {
                isValid: false,
                type: null,
                error: `CPF incompleto (${cleanNumeric.length}/11 dígitos)`
            };
        } else if (cleanAlphanumeric.length > 11 && cleanAlphanumeric.length < 14) {
            return {
                isValid: false,
                type: null,
                error: `CNPJ incompleto (${cleanAlphanumeric.length}/14 caracteres)`
            };
        } else {
            return {
                isValid: false,
                type: null,
                error: 'Documento deve ter 11 dígitos (CPF) ou 14 caracteres alfanuméricos (CNPJ)'
            };
        }
    }

    // ✅ FORMATAR CPF
    static formatCPF(cpf: string): string {
        const clean = cpf.replace(/[^\d]/g, '');
        if (clean.length === 11) {
            return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    // ✅ FORMATAR CNPJ (alfanumérico)
    static formatCNPJ(cnpj: string): string {
        const clean = cnpj.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
        if (clean.length === 14) {
            return clean.replace(/([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})([0-9A-Z]{2})/, '$1.$2.$3/$4-$5');
        }
        return cnpj.toUpperCase();
    }

    // ✅ FORMATAR DOCUMENTO AUTOMATICAMENTE
    static formatDocument(document: string): string {
        const cleanNumeric = document.replace(/[^\d]/g, '');
        const cleanAlphanumeric = document.replace(/[^0-9A-Za-z]/g, '');

        if (cleanNumeric.length <= 11 && /^\d*$/.test(cleanAlphanumeric)) {
            // Trata como CPF se for só números e até 11 dígitos
            return this.formatCPF(document);
        } else if (cleanAlphanumeric.length <= 14) {
            // Trata como CNPJ se tiver até 14 caracteres alfanuméricos
            return this.formatCNPJ(document);
        }

        return document.toUpperCase();
    }

    // ✅ FORMATAÇÃO INTELIGENTE DURANTE DIGITAÇÃO
    static formatDocumentAsTyping(document: string): string {
        const cleanAlphanumeric = document.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

        // Se tem só números e até 11 caracteres, trata como CPF
        const isNumericOnly = /^\d*$/.test(cleanAlphanumeric);

        if (isNumericOnly && cleanAlphanumeric.length <= 11) {
            // Formatação progressiva de CPF
            if (cleanAlphanumeric.length <= 3) return cleanAlphanumeric;
            if (cleanAlphanumeric.length <= 6) return cleanAlphanumeric.replace(/(\d{3})(\d+)/, '$1.$2');
            if (cleanAlphanumeric.length <= 9) return cleanAlphanumeric.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
            return cleanAlphanumeric.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
        } else {
            // Formatação progressiva de CNPJ alfanumérico
            if (cleanAlphanumeric.length <= 2) return cleanAlphanumeric;
            if (cleanAlphanumeric.length <= 5) return cleanAlphanumeric.replace(/([0-9A-Z]{2})([0-9A-Z]+)/, '$1.$2');
            if (cleanAlphanumeric.length <= 8) return cleanAlphanumeric.replace(/([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]+)/, '$1.$2.$3');
            if (cleanAlphanumeric.length <= 12) return cleanAlphanumeric.replace(/([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]+)/, '$1.$2.$3/$4');
            return cleanAlphanumeric.replace(/([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})([0-9A-Z]+)/, '$1.$2.$3/$4-$5');
        }
    }

    // ✅ REMOVER FORMATAÇÃO (permite alfanuméricos)
    static removeFormatting(document: string): string {
        return document.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    }

    // ✅ GERAR CNPJ ALFANUMÉRICO VÁLIDO PARA TESTES
    static generateValidAlphanumericCNPJ(): string {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let cnpj = '';

        // Gerar 12 primeiros caracteres aleatórios
        for (let i = 0; i < 12; i++) {
            cnpj += chars[Math.floor(Math.random() * chars.length)];
        }

        const getCharValue = (char: string): number => {
            if (/\d/.test(char)) return parseInt(char);
            return char.charCodeAt(0) - 55;
        };

        const getCharFromValue = (value: number): string => {
            if (value < 10) return value.toString();
            return String.fromCharCode(value + 55);
        };

        // Calcular primeiro dígito verificador
        let sum = 0;
        let weight = 2;
        for (let i = 11; i >= 0; i--) {
            sum += getCharValue(cnpj[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        const digit1 = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
        cnpj += getCharFromValue(digit1);

        // Calcular segundo dígito verificador
        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += getCharValue(cnpj[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        const digit2 = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
        cnpj += getCharFromValue(digit2);

        return cnpj;
    }
}

export class PasswordValidator {
    // ✅ VALIDAR FORÇA DA SENHA
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
        strength: 'weak' | 'medium' | 'strong';
    } {
        const errors: string[] = [];

        // Verificações obrigatórias
        if (password.length < 8) {
            errors.push('A senha deve ter pelo menos 8 caracteres');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('A senha deve conter pelo menos uma letra maiúscula');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('A senha deve conter pelo menos uma letra minúscula');
        }

        if (!/\d/.test(password)) {
            errors.push('A senha deve conter pelo menos um número');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('A senha deve conter pelo menos um caractere especial');
        }

        // Calcular força da senha
        let strength: 'weak' | 'medium' | 'strong' = 'weak';

        if (errors.length === 0) {
            if (password.length >= 12 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                strength = 'strong';
            } else {
                strength = 'medium';
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }

    // ✅ VALIDAR CONFIRMAÇÃO DE SENHA
    static validatePasswordConfirmation(password: string, confirmPassword: string): boolean {
        return password === confirmPassword && password.length > 0;
    }
}

export class EmailValidator {
    // ✅ VALIDAR EMAIL
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.toLowerCase());
    }

    // ✅ NORMALIZAR EMAIL
    static normalizeEmail(email: string): string {
        return email.toLowerCase().trim();
    }
}

export class PhoneValidator {
    // ✅ VALIDAR TELEFONE BRASILEIRO
    static isValidPhone(phone: string): boolean {
        const clean = phone.replace(/[^\d]/g, '');
        // Aceita: 10 dígitos (telefone fixo) ou 11 dígitos (celular)
        return clean.length === 10 || clean.length === 11;
    }

    // ✅ FORMATAR TELEFONE
    static formatPhone(phone: string): string {
        const clean = phone.replace(/[^\d]/g, '');

        if (clean.length === 10) {
            // Telefone fixo: (11) 1234-5678
            return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (clean.length === 11) {
            // Celular: (11) 91234-5678
            return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        return phone;
    }

    // ✅ REMOVER FORMATAÇÃO
    static removeFormatting(phone: string): string {
        return phone.replace(/[^\d]/g, '');
    }
}
