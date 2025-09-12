import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// ✅ Configuração do sistema de logs de segurança
const logDir = path.join(__dirname, '../logs');

// ✅ Formato personalizado para logs de segurança
const securityLogFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, meta, stack }) => {
        let log = `${timestamp} [${level.toUpperCase()}] ${message}`;

        if (meta) {
            log += ` | Meta: ${JSON.stringify(meta)}`;
        }

        if (stack) {
            log += ` | Stack: ${stack}`;
        }

        return log;
    })
);

// ✅ Transport para logs de segurança
const securityTransport = new DailyRotateFile({
    filename: path.join(logDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: securityLogFormat,
    level: 'info'
});

// ✅ Transport para logs de erro
const errorTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: securityLogFormat,
    level: 'error'
});

// ✅ Transport para logs de auditoria
const auditTransport = new DailyRotateFile({
    filename: path.join(logDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d', // Auditoria por mais tempo
    format: securityLogFormat,
});

// ✅ Logger principal de segurança
export const securityLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        securityTransport,
        errorTransport,
        ...(process.env.NODE_ENV !== 'production' ? [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ] : [])
    ],
});

// ✅ Logger específico para auditoria
export const auditLogger = winston.createLogger({
    level: 'info',
    transports: [auditTransport],
});

// ✅ Tipos de eventos de segurança
export enum SecurityEventType {
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    LOGOUT = 'LOGOUT',
    TOKEN_REFRESH = 'TOKEN_REFRESH',
    TOKEN_INVALID = 'TOKEN_INVALID',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
    DATA_ACCESS = 'DATA_ACCESS',
    DATA_MODIFICATION = 'DATA_MODIFICATION',
    FILE_UPLOAD = 'FILE_UPLOAD',
    MALICIOUS_UPLOAD = 'MALICIOUS_UPLOAD',
    CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
    MALICIOUS_REQUEST = 'MALICIOUS_REQUEST'
}

// ✅ Interface para eventos de segurança
export interface SecurityEvent {
    type: SecurityEventType;
    userId?: string;
    email?: string;
    ip: string;
    userAgent: string;
    endpoint?: string;
    method?: string;
    payload?: any;
    success: boolean;
    message: string;
    timestamp?: Date;
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    session_id?: string;
    geo_location?: string;
}

// ✅ Função para log de eventos de segurança
export const logSecurityEvent = (event: SecurityEvent) => {
    const logData = {
        ...event,
        timestamp: event.timestamp || new Date(),
        level: event.success ? 'info' : 'warn'
    };

    // Log principal
    securityLogger.log(logData.level, `Security Event: ${event.type}`, {
        meta: logData
    });

    // Log de auditoria para eventos críticos
    if (['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_CHANGE', 'ACCOUNT_CREATION'].includes(event.type)) {
        auditLogger.info(`Audit: ${event.type}`, { meta: logData });
    }

    // Log de erro para eventos de alta prioridade
    if (event.risk_level === 'HIGH' || event.risk_level === 'CRITICAL') {
        securityLogger.error(`High Risk Security Event: ${event.type}`, {
            meta: logData
        });
    }
};

// ✅ Middleware para logging automático de requisições
export const requestLogger = (req: any, res: any, next: any) => {
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
            securityLogger.warn('Suspicious Request', { meta: logData });
        } else {
            securityLogger.info('Request', { meta: logData });
        }
    });

    next();
};

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

export const detectSuspiciousActivity = (input: string, req: any): boolean => {
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(input)) {
            logSecurityEvent({
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

// ✅ Middleware para detecção de atividade suspeita
export const suspiciousActivityDetector = (req: any, res: any, next: any) => {
    const checkForSuspiciousContent = (obj: any) => {
        if (typeof obj === 'string') {
            return detectSuspiciousActivity(obj, req);
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

// ✅ Inicialização do sistema de logs
export const initializeLogger = () => {
    // Criar diretório de logs se não existir
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    securityLogger.info('Security logging system initialized', {
        meta: {
            environment: process.env.NODE_ENV,
            logDirectory: logDir,
            timestamp: new Date()
        }
    });
};