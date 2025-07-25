// Script de teste para verificar validação de CPF
const fs = require('fs');
const validatorsPath = '../frontend-mobile/src/utils/validators.ts';

// Simular a classe DocumentValidator
class DocumentValidator {
    static INVALID_CPFS = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ];

    static isValidCPF(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            if (cleanCPF.length !== 11) return false;
            if (this.INVALID_CPFS.includes(cleanCPF)) return false;

            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cleanCPF[i]) * (10 - i);
            }
            let remainder = sum % 11;
            const digit1 = remainder < 2 ? 0 : 11 - remainder;
            if (parseInt(cleanCPF[9]) !== digit1) return false;

            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cleanCPF[i]) * (11 - i);
            }
            remainder = sum % 11;
            const digit2 = remainder < 2 ? 0 : 11 - remainder;
            return parseInt(cleanCPF[10]) === digit2;
        } catch (error) {
            return false;
        }
    }

    static isValidDocument(document) {
        const cleanNumeric = document.replace(/[^\d]/g, '');
        const cleanAlphanumeric = document.replace(/[^0-9A-Za-z]/g, '');

        if (cleanNumeric.length === 11) {
            const isValid = this.isValidCPF(document);
            return {
                isValid,
                type: 'CPF',
                error: isValid ? undefined : 'CPF inválido',
            };
        }

        return {
            isValid: false,
            type: null,
            error: 'Documento deve ter 11 dígitos (CPF) ou 14 caracteres (CNPJ)'
        };
    }
}

// Testar CPFs válidos conhecidos
const testCPFs = [
    '12345678909',  // CPF válido
    '123.456.789-09',  // CPF válido formatado
    '11111111111',  // CPF inválido (sequência)
    '123456789',   // CPF incompleto
    '12345678901',  // CPF com dígito verificador errado
];

console.log('🧪 TESTE DE VALIDAÇÃO DE CPF\n');

testCPFs.forEach(cpf => {
    const result = DocumentValidator.isValidDocument(cpf);
    console.log(`CPF: ${cpf}`);
    console.log(`Válido: ${result.isValid}`);
    console.log(`Tipo: ${result.type}`);
    console.log(`Erro: ${result.error || 'Nenhum'}`);
    console.log('---');
});

// Gerar um CPF válido para teste
function generateValidCPF() {
    // Gera os 9 primeiros dígitos
    let cpf = '';
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10);
    }

    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    cpf += digit1;

    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    cpf += digit2;

    return cpf;
}

console.log('\n🎲 TESTE COM CPF GERADO AUTOMATICAMENTE\n');
const generatedCPF = generateValidCPF();
const result = DocumentValidator.isValidDocument(generatedCPF);
console.log(`CPF gerado: ${generatedCPF}`);
console.log(`Válido: ${result.isValid}`);
console.log(`Tipo: ${result.type}`);
console.log(`Erro: ${result.error || 'Nenhum'}`);
