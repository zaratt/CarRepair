// Teste de validação de CPF
function testCPF() {
    console.log('🧪 TESTE DE VALIDAÇÃO DE CPF\n');

    // Algoritmo correto de validação de CPF
    function isValidCPF(cpf) {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]/g, '');

        console.log(`Testing CPF: ${cpf}`);

        // Verifica se tem 11 dígitos
        if (cpf.length !== 11) {
            console.log('❌ Não tem 11 dígitos');
            return false;
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1*$/.test(cpf)) {
            console.log('❌ Todos os dígitos são iguais');
            return false;
        }

        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf[i]) * (10 - i);
        }
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        console.log(`Primeiro dígito calculado: ${digit1}, esperado: ${cpf[9]}`);

        if (parseInt(cpf[9]) !== digit1) {
            console.log('❌ Primeiro dígito verificador inválido');
            return false;
        }

        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf[i]) * (11 - i);
        }
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        console.log(`Segundo dígito calculado: ${digit2}, esperado: ${cpf[10]}`);

        if (parseInt(cpf[10]) !== digit2) {
            console.log('❌ Segundo dígito verificador inválido');
            return false;
        }

        console.log('✅ CPF válido!');
        return true;
    }

    // Testes
    const testCases = [
        '12345678901', // CPF que você testou
        '11144477735', // CPF válido conhecido
        '00000000000', // CPF inválido (todos iguais)
        '12345678900', // CPF com dígitos verificadores errados
    ];

    testCases.forEach((cpf, index) => {
        console.log(`\n--- TESTE ${index + 1}: ${cpf} ---`);
        const result = isValidCPF(cpf);
        console.log(`Resultado: ${result ? 'VÁLIDO' : 'INVÁLIDO'}\n`);
    });
}

testCPF();
