"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSecurityConfig = exports.SecurityConfig = void 0;
// Configurações de segurança
exports.SecurityConfig = {
    // Senha padrão para novos usuários (deve ser alterada no primeiro login)
    DEFAULT_PASSWORD: process.env.DEFAULT_USER_PASSWORD || 'ChangeMe123!',
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
const validateSecurityConfig = () => {
    if (!process.env.DEFAULT_USER_PASSWORD) {
        console.warn('⚠️  DEFAULT_USER_PASSWORD não definida. Usando valor padrão inseguro.');
    }
    if (process.env.DEFAULT_USER_PASSWORD === 'temp123456') {
        console.warn('⚠️  DEFAULT_USER_PASSWORD usando valor padrão. Altere em produção!');
    }
    if (exports.SecurityConfig.BCRYPT_SALT_ROUNDS < 10) {
        console.warn('⚠️  BCRYPT_SALT_ROUNDS muito baixo. Recomendado: 12 ou mais.');
    }
};
exports.validateSecurityConfig = validateSecurityConfig;
//# sourceMappingURL=security.js.map