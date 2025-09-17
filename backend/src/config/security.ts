// Configurações de segurança
export const SecurityConfig = {
    // Senha padrão para novos usuários (deve ser alterada no primeiro login)
    DEFAULT_PASSWORD: (() => {
        if (!process.env.DEFAULT_USER_PASSWORD) {
            throw new Error('DEFAULT_USER_PASSWORD environment variable must be set for security reasons.');
        }
        return process.env.DEFAULT_USER_PASSWORD;
    })(),

    // Rounds para bcrypt (quanto maior, mais seguro mas mais lento)
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),

    // Validações de senha
    PASSWORD_REQUIREMENTS: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
    }
};

// Validação de configuração na inicialização
export const validateSecurityConfig = () => {
    if (!process.env.DEFAULT_USER_PASSWORD) {
        console.warn('⚠️  DEFAULT_USER_PASSWORD não definida. Usando valor padrão inseguro.');
    }

    if (process.env.DEFAULT_USER_PASSWORD === 'temp123456') {
        console.warn('⚠️  DEFAULT_USER_PASSWORD usando valor padrão. Altere em produção!');
    }

    if (SecurityConfig.BCRYPT_SALT_ROUNDS < 10) {
        console.warn('⚠️  BCRYPT_SALT_ROUNDS muito baixo. Recomendado: 12 ou mais.');
    }
};