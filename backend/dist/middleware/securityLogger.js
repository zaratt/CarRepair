"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeLogger = exports.suspiciousActivityDetector = exports.detectSuspiciousActivity = exports.requestLogger = exports.logSecurityEvent = exports.SecurityEventType = exports.auditLogger = exports.securityLogger = void 0;
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
// ✅ Configuração do sistema de logs de segurança
const logDir = path_1.default.join(__dirname, '../logs');
// ✅ Formato personalizado para logs de segurança
const securityLogFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, meta, stack }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (meta) {
        log += ` | Meta: ${JSON.stringify(meta)}`;
    }
    if (stack) {
        log += ` | Stack: ${stack}`;
    }
    return log;
}));
// ✅ Transport para logs de segurança
const securityTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: securityLogFormat,
    level: 'info'
});
// ✅ Transport para logs de erro
const errorTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: securityLogFormat,
    level: 'error'
});
// ✅ Transport para logs de auditoria
const auditTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d', // Auditoria por mais tempo
    format: securityLogFormat,
});
// ✅ Logger principal de segurança
exports.securityLogger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        securityTransport,
        errorTransport,
        ...(process.env.NODE_ENV !== 'production' ? [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ] : [])
    ],
});
// ✅ Logger específico para auditoria
exports.auditLogger = winston_1.default.createLogger({
    level: 'info',
    transports: [auditTransport],
});
// ✅ Tipos de eventos de segurança
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    SecurityEventType["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    SecurityEventType["LOGOUT"] = "LOGOUT";
    SecurityEventType["TOKEN_REFRESH"] = "TOKEN_REFRESH";
    SecurityEventType["TOKEN_INVALID"] = "TOKEN_INVALID";
    SecurityEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    SecurityEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    SecurityEventType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    SecurityEventType["DATA_ACCESS"] = "DATA_ACCESS";
    SecurityEventType["DATA_MODIFICATION"] = "DATA_MODIFICATION";
    SecurityEventType["FILE_UPLOAD"] = "FILE_UPLOAD";
    SecurityEventType["MALICIOUS_UPLOAD"] = "MALICIOUS_UPLOAD";
    SecurityEventType["CONFIGURATION_CHANGE"] = "CONFIGURATION_CHANGE";
    SecurityEventType["MALICIOUS_REQUEST"] = "MALICIOUS_REQUEST";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
// ✅ Função para log de eventos de segurança
const logSecurityEvent = (event) => {
    const logData = {
        ...event,
        timestamp: event.timestamp || new Date(),
        level: event.success ? 'info' : 'warn'
    };
    // Log principal
    exports.securityLogger.log(logData.level, `Security Event: ${event.type}`, {
        meta: logData
    });
    // Log de auditoria para eventos críticos
    if (['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_CHANGE', 'ACCOUNT_CREATION'].includes(event.type)) {
        exports.auditLogger.info(`Audit: ${event.type}`, { meta: logData });
    }
    // Log de erro para eventos de alta prioridade
    if (event.risk_level === 'HIGH' || event.risk_level === 'CRITICAL') {
        exports.securityLogger.error(`High Risk Security Event: ${event.type}`, {
            meta: logData
        });
    }
};
exports.logSecurityEvent = logSecurityEvent;
// ✅ Middleware para logging automático de requisições
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id,
            timestamp: new Date()
        };
        // Log de requisições suspeitas
        if (res.statusCode >= 400 || duration > 5000) {
            exports.securityLogger.warn('Suspicious Request', { meta: logData });
        }
        else {
            exports.securityLogger.info('Request', { meta: logData });
        }
    });
    next();
};
exports.requestLogger = requestLogger;
// ✅ Função para detectar padrões suspeitos
const suspiciousPatterns = [
    /script\s*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
];
const detectSuspiciousActivity = (input, req) => {
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(input)) {
            (0, exports.logSecurityEvent)({
                type: SecurityEventType.MALICIOUS_REQUEST,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.originalUrl,
                method: req.method,
                payload: { suspiciousInput: input },
                success: false,
                message: `Suspicious pattern detected: ${pattern}`,
                risk_level: 'HIGH'
            });
            return true;
        }
    }
    return false;
};
exports.detectSuspiciousActivity = detectSuspiciousActivity;
// ✅ Middleware para detecção de atividade suspeita
const suspiciousActivityDetector = (req, res, next) => {
    const checkForSuspiciousContent = (obj) => {
        if (typeof obj === 'string') {
            return (0, exports.detectSuspiciousActivity)(obj, req);
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (checkForSuspiciousContent(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };
    // Verificar query parameters
    if (checkForSuspiciousContent(req.query)) {
        return res.status(400).json({
            success: false,
            message: 'Suspicious activity detected in query parameters'
        });
    }
    // Verificar body
    if (checkForSuspiciousContent(req.body)) {
        return res.status(400).json({
            success: false,
            message: 'Suspicious activity detected in request body'
        });
    }
    next();
};
exports.suspiciousActivityDetector = suspiciousActivityDetector;
// ✅ Inicialização do sistema de logs
const initializeLogger = () => {
    // Criar diretório de logs se não existir
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    exports.securityLogger.info('Security logging system initialized', {
        meta: {
            environment: process.env.NODE_ENV,
            logDirectory: logDir,
            timestamp: new Date()
        }
    });
};
exports.initializeLogger = initializeLogger;
//# sourceMappingURL=securityLogger.js.map