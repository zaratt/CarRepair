export class DocumentValidator {
    // ✅ VALIDAR CPF
    static isValidCPF(cpf: string): boolean {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]/g, '');

        // Verifica se tem 11 dígitos
        if (cpf.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1*$/.test(cpf)) return false;

        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf[i]) * (10 - i);
        }
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        if (parseInt(cpf[9]) !== digit1) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf[i]) * (11 - i);
        }
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        return parseInt(cpf[10]) === digit2;
    }

    // ✅ VALIDAR CNPJ
    static isValidCNPJ(cnpj: string): boolean {
        // Remove caracteres não numéricos
        cnpj = cnpj.replace(/[^\d]/g, '');

        // Verifica se tem 14 dígitos
        if (cnpj.length !== 14) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1*$/.test(cnpj)) return false;

        // Validação do primeiro dígito verificador
        let sum = 0;
        let weight = 2;
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cnpj[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        if (parseInt(cnpj[12]) !== digit1) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cnpj[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        return parseInt(cnpj[13]) === digit2;
    }

    // ✅ VALIDAR DOCUMENTO (CPF OU CNPJ)
    static isValidDocument(document: string): { isValid: boolean; type: 'CPF' | 'CNPJ' | null } {
        const cleanDocument = document.replace(/[^\d]/g, '');

        if (cleanDocument.length === 11) {
            return {
                isValid: this.isValidCPF(document),
                type: 'CPF'
            };
        } else if (cleanDocument.length === 14) {
            return {
                isValid: this.isValidCNPJ(document),
                type: 'CNPJ'
            };
        }

        return {
            isValid: false,
            type: null
        };
    }

    // ✅ FORMATAR CPF
    static formatCPF(cpf: string): string {
        const clean = cpf.replace(/[^\d]/g, '');
        if (clean.length === 11) {
            return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    // ✅ FORMATAR CNPJ
    static formatCNPJ(cnpj: string): string {
        const clean = cnpj.replace(/[^\d]/g, '');
        if (clean.length === 14) {
            return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return cnpj;
    }

    // ✅ FORMATAR DOCUMENTO AUTOMATICAMENTE
    static formatDocument(document: string): string {
        const clean = document.replace(/[^\d]/g, '');

        if (clean.length <= 11) {
            return this.formatCPF(document);
        } else if (clean.length <= 14) {
            return this.formatCNPJ(document);
        }

        return document;
    }

    // ✅ REMOVER FORMATAÇÃO
    static removeFormatting(document: string): string {
        return document.replace(/[^\d]/g, '');
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
