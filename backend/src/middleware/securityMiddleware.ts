import { NextFunction, Request, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { logSecurityEvent, SecurityEventType } from './securityLogger';

// ✅ Configuração do Helmet para headers de segurança
export const helmetConfig = helmet({
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
const createRateLimit = (
    windowMs: number,
    max: number,
    message: string,
    skipSuccessfulRequests: boolean = false
) => {
    return rateLimit({
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
        handler: (req: Request, res: Response) => {
            // Log da tentativa de rate limit
            logSecurityEvent({
                type: SecurityEventType.RATE_LIMIT_EXCEEDED,
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
        skip: (req: Request) => {
            // Skip para IPs de confiança (opcional)
            const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
            return trustedIPs.includes(req.ip || '');
        }
    });
};

// ✅ Rate Limits específicos por endpoint
export const generalRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutos
    100, // 100 requests por 15 minutos
    'Muitas requisições deste IP. Tente novamente em alguns minutos.'
);

export const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutos
    5, // 5 tentativas de login por 15 minutos
    'Muitas tentativas de login. Tente novamente em 15 minutos.',
    true // Skip requisições bem-sucedidas
);

export const uploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hora
    10, // 10 uploads por hora
    'Limite de uploads atingido. Tente novamente em 1 hora.'
);

export const apiRateLimit = createRateLimit(
    1 * 60 * 1000, // 1 minuto
    60, // 60 requests por minuto
    'API rate limit exceeded. Aguarde 1 minuto.'
);

// ✅ Middleware de sanitização de dados
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Sanitizar dados MongoDB
    mongoSanitize()(req, res, () => {
        // Sanitização adicional para XSS
        const sanitizeObject = (obj: any): any => {
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
                const sanitized: any = {};
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

// ✅ Middleware para proteção HPP (HTTP Parameter Pollution)
export const hppProtection = hpp({
    whitelist: ['tags', 'services'] // Permitir arrays para estes campos
});

// ✅ Middleware para validação de Content-Type
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
    // Para rotas que esperam JSON
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');

        // Permitir multipart para uploads
        if (req.originalUrl.includes('/upload')) {
            return next();
        }

        // Verificar se é JSON válido
        if (!contentType || !contentType.includes('application/json')) {
            logSecurityEvent({
                type: SecurityEventType.MALICIOUS_REQUEST,
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

// ✅ Middleware para validação de tamanho de payload
export const validatePayloadSize = (req: Request, res: Response, next: NextFunction): void => {
    const maxSize = req.originalUrl.includes('/upload') ? 50 * 1024 * 1024 : 1 * 1024 * 1024; // 50MB para upload, 1MB para outros

    if (req.get('Content-Length')) {
        const contentLength = parseInt(req.get('Content-Length') || '0');

        if (contentLength > maxSize) {
            logSecurityEvent({
                type: SecurityEventType.MALICIOUS_REQUEST,
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
};// ✅ Middleware para detecção de User-Agent suspeito
export const validateUserAgent = (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('User-Agent');

    if (!userAgent) {
        logSecurityEvent({
            type: SecurityEventType.SUSPICIOUS_ACTIVITY,
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

    const isSuspicious = suspiciousAgents.some(pattern =>
        userAgent ? pattern.test(userAgent) : false
    );

    if (isSuspicious && !req.originalUrl.includes('/health')) {
        logSecurityEvent({
            type: SecurityEventType.SUSPICIOUS_ACTIVITY,
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

// ✅ Middleware combinado de segurança
export const securityMiddleware = [
    helmetConfig,
    generalRateLimit,
    sanitizeInput,
    hppProtection,
    validateContentType,
    validatePayloadSize,
    validateUserAgent
];