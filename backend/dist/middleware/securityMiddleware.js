"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.validateUserAgent = exports.validatePayloadSize = exports.validateContentType = exports.hppProtection = exports.sanitizeInput = exports.apiRateLimit = exports.uploadRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.helmetConfig = void 0;
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
const securityLogger_1 = require("./securityLogger");
// ✅ Configuração do Helmet para headers de segurança
exports.helmetConfig = (0, helmet_1.default)({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    // X-Frame-Options
    frameguard: { action: 'deny' },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection
    xssFilter: true,
    // Referrer Policy
    referrerPolicy: { policy: 'same-origin' },
    // HSTS (HTTP Strict Transport Security)
    hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true
    },
    // Hide powered by header
    hidePoweredBy: true,
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },
    // X-Download-Options
    ieNoOpen: true,
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: false
});
// ✅ Rate Limiting Configurações
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: {
            success: false,
            message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        skipSuccessfulRequests,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            // Log da tentativa de rate limit
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.RATE_LIMIT_EXCEEDED,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                success: false,
                message: `Rate limit exceeded: ${message}`,
                risk_level: 'MEDIUM'
            });
            res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        },
        skip: (req) => {
            // Skip para IPs de confiança (opcional)
            const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
            return trustedIPs.includes(req.ip || '');
        }
    });
};
// ✅ Rate Limits específicos por endpoint
exports.generalRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutos
100, // 100 requests por 15 minutos
'Muitas requisições deste IP. Tente novamente em alguns minutos.');
exports.authRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutos
5, // 5 tentativas de login por 15 minutos
'Muitas tentativas de login. Tente novamente em 15 minutos.', true // Skip requisições bem-sucedidas
);
exports.uploadRateLimit = createRateLimit(60 * 60 * 1000, // 1 hora
10, // 10 uploads por hora
'Limite de uploads atingido. Tente novamente em 1 hora.');
exports.apiRateLimit = createRateLimit(1 * 60 * 1000, // 1 minuto
60, // 60 requests por minuto
'API rate limit exceeded. Aguarde 1 minuto.');
// ✅ Middleware de sanitização de dados
const sanitizeInput = (req, res, next) => {
    // Sanitizar dados MongoDB
    (0, express_mongo_sanitize_1.default)()(req, res, () => {
        // Sanitização adicional para XSS
        const sanitizeObject = (obj) => {
            if (typeof obj === 'string') {
                // Remove scripts e tags perigosas
                return obj
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            if (typeof obj === 'object' && obj !== null) {
                const sanitized = {};
                for (const key in obj) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
                return sanitized;
            }
            return obj;
        };
        // Sanitizar query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        // Sanitizar body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        // Sanitizar params
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        next();
    });
};
exports.sanitizeInput = sanitizeInput;
// ✅ Middleware para proteção HPP (HTTP Parameter Pollution)
exports.hppProtection = (0, hpp_1.default)({
    whitelist: ['tags', 'services'] // Permitir arrays para estes campos
});
// ✅ Middleware para validação de Content-Type
const validateContentType = (req, res, next) => {
    // Para rotas que esperam JSON
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');
        // Permitir multipart para uploads
        if (req.originalUrl.includes('/upload')) {
            return next();
        }
        // Verificar se é JSON válido
        if (!contentType || !contentType.includes('application/json')) {
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.MALICIOUS_REQUEST,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                success: false,
                message: `Invalid Content-Type: ${contentType}`,
                risk_level: 'LOW'
            });
            return res.status(400).json({
                success: false,
                message: 'Content-Type deve ser application/json'
            });
        }
    }
    next();
};
exports.validateContentType = validateContentType;
// ✅ Middleware para validação de tamanho de payload
const validatePayloadSize = (req, res, next) => {
    const maxSize = req.originalUrl.includes('/upload') ? 50 * 1024 * 1024 : 1 * 1024 * 1024; // 50MB para upload, 1MB para outros
    if (req.get('Content-Length')) {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        if (contentLength > maxSize) {
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.MALICIOUS_REQUEST,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                payload: { contentLength, maxSize },
                success: false,
                message: `Payload too large: ${contentLength} bytes`,
                risk_level: 'MEDIUM'
            });
            res.status(413).json({
                success: false,
                message: 'Payload muito grande'
            });
            return;
        }
    }
    next();
}; // ✅ Middleware para detecção de User-Agent suspeito
exports.validatePayloadSize = validatePayloadSize;
const validateUserAgent = (req, res, next) => {
    const userAgent = req.get('User-Agent');
    if (!userAgent) {
        (0, securityLogger_1.logSecurityEvent)({
            type: securityLogger_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            ip: req.ip || 'unknown',
            userAgent: 'missing',
            endpoint: req.originalUrl,
            method: req.method,
            success: false,
            message: 'Missing User-Agent header',
            risk_level: 'LOW'
        });
    }
    // Lista de User-Agents suspeitos
    const suspiciousAgents = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /^$/
    ];
    const isSuspicious = suspiciousAgents.some(pattern => userAgent ? pattern.test(userAgent) : false);
    if (isSuspicious && !req.originalUrl.includes('/health')) {
        (0, securityLogger_1.logSecurityEvent)({
            type: securityLogger_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            ip: req.ip || 'unknown',
            userAgent: userAgent || 'unknown',
            endpoint: req.originalUrl,
            method: req.method,
            success: false,
            message: `Suspicious User-Agent: ${userAgent}`,
            risk_level: 'MEDIUM'
        });
    }
    next();
};
exports.validateUserAgent = validateUserAgent;
// ✅ Middleware combinado de segurança
exports.securityMiddleware = [
    exports.helmetConfig,
    exports.generalRateLimit,
    exports.sanitizeInput,
    exports.hppProtection,
    exports.validateContentType,
    exports.validatePayloadSize,
    exports.validateUserAgent
];
//# sourceMappingURL=securityMiddleware.js.map