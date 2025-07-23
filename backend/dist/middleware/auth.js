"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
exports.authorize = authorize;
exports.authorizeProfile = authorizeProfile;
exports.authorizeOwner = authorizeOwner;
exports.rateLimitAuth = rateLimitAuth;
exports.incrementLoginAttempts = incrementLoginAttempts;
exports.resetLoginAttempts = resetLoginAttempts;
const auth_1 = require("../utils/auth");
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware para autenticar token JWT
 */
function authenticateToken(req, res, next) {
    try {
        const token = (0, auth_1.extractTokenFromHeader)(req.headers.authorization);
        const payload = (0, auth_1.verifyToken)(token);
        // Adicionar dados do usuário à requisição
        req.user = payload;
        next();
    }
    catch (error) {
        throw new errorHandler_1.ValidationError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Middleware para autenticação opcional (não falha se não houver token)
 */
function optionalAuth(req, res, next) {
    try {
        if (req.headers.authorization) {
            const token = (0, auth_1.extractTokenFromHeader)(req.headers.authorization);
            const payload = (0, auth_1.verifyToken)(token);
            req.user = payload;
        }
        next();
    }
    catch (error) {
        // Ignora erros de autenticação quando opcional
        next();
    }
}
/**
 * Middleware para autorização baseada em tipos de usuário
 */
function authorize(allowedTypes) {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.ValidationError('Authentication required');
        }
        if (!allowedTypes.includes(req.user.type)) {
            throw new errorHandler_1.ValidationError(`Access denied. Required types: ${allowedTypes.join(', ')}`);
        }
        next();
    };
}
/**
 * Middleware para autorização baseada em perfis de usuário
 */
function authorizeProfile(allowedProfiles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.ValidationError('Authentication required');
        }
        if (!allowedProfiles.includes(req.user.profile)) {
            throw new errorHandler_1.ValidationError(`Access denied. Required profiles: ${allowedProfiles.join(', ')}`);
        }
        next();
    };
}
/**
 * Middleware para verificar se usuário é proprietário do recurso
 */
function authorizeOwner(userIdParam = 'id') {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.ValidationError('Authentication required');
        }
        const resourceUserId = req.params[userIdParam];
        if (req.user.userId !== resourceUserId) {
            throw new errorHandler_1.ValidationError('Access denied. You can only access your own resources');
        }
        next();
    };
}
/**
 * Middleware básico de rate limiting para autenticação
 */
const loginAttempts = new Map();
function rateLimitAuth(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
        const clientId = req.ip || 'unknown';
        const now = new Date();
        const attempts = loginAttempts.get(clientId);
        if (attempts) {
            // Reset contador se passou da janela de tempo
            if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
                loginAttempts.delete(clientId);
            }
            else if (attempts.count >= maxAttempts) {
                throw new errorHandler_1.ValidationError(`Too many authentication attempts. Try again later.`);
            }
        }
        next();
    };
}
/**
 * Incrementar contador de tentativas de login
 */
function incrementLoginAttempts(req) {
    const clientId = req.ip || 'unknown';
    const now = new Date();
    const attempts = loginAttempts.get(clientId);
    if (attempts) {
        attempts.count += 1;
        attempts.lastAttempt = now;
    }
    else {
        loginAttempts.set(clientId, { count: 1, lastAttempt: now });
    }
}
/**
 * Reset contador de tentativas de login (em caso de sucesso)
 */
function resetLoginAttempts(req) {
    const clientId = req.ip || 'unknown';
    loginAttempts.delete(clientId);
}
//# sourceMappingURL=auth.js.map