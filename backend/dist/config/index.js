"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
// Carrega variáveis de ambiente
dotenv_1.default.config();
exports.config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    // JWT (para autenticação futura)
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    // FIPE API
    fipe: {
        baseUrl: process.env.FIPE_API_BASE_URL || 'https://fipe.parallelum.com.br/api/v2',
        cacheTtl: parseInt(process.env.FIPE_CACHE_TTL || '3600', 10),
    },
    // File Upload
    upload: {
        path: process.env.UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(','),
    },
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    // Computed properties
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
};
// Validação de configurações obrigatórias
function validateConfig() {
    if (!exports.config.databaseUrl) {
        throw new Error('❌ DATABASE_URL é obrigatório no arquivo .env');
    }
    if (exports.config.isProduction && exports.config.jwtSecret === 'fallback-secret-key') {
        throw new Error('❌ JWT_SECRET deve ser definido em produção');
    }
    console.log(`✅ Configurações validadas para ambiente: ${exports.config.nodeEnv}`);
}
exports.default = exports.config;
//# sourceMappingURL=index.js.map