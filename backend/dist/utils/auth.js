"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.validatePasswordStrength = validatePasswordStrength;
exports.generateVerificationCode = generateVerificationCode;
exports.isValidEmail = isValidEmail;
exports.sanitizeUserData = sanitizeUserData;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
/**
 * Hash da senha usando bcrypt
 */
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
}
/**
 * Verificar senha contra hash
 */
async function verifyPassword(password, hash) {
    return await bcryptjs_1.default.compare(password, hash);
}
/**
 * Gerar JWT token
 */
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
        expiresIn: '24h',
        issuer: 'carrepair-api'
    });
}
/**
 * Gerar refresh token (maior duração)
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
        expiresIn: '7d',
        issuer: 'carrepair-api'
    });
}
/**
 * Verificar e decodificar JWT token
 */
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
}
/**
 * Extrair token do header Authorization
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        throw new Error('Authorization header is required');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new Error('Authorization header must be in format: Bearer <token>');
    }
    const token = parts[1];
    if (!token) {
        throw new Error('Token is missing from Authorization header');
    }
    return token;
}
/**
 * Validar força da senha
 */
function validatePasswordStrength(password) {
    const errors = [];
    let score = 0;
    // Comprimento mínimo
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    else {
        score += 1;
    }
    // Letra minúscula
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    else {
        score += 1;
    }
    // Letra maiúscula
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    else {
        score += 1;
    }
    // Número
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    else {
        score += 1;
    }
    // Caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    else {
        score += 1;
    }
    return {
        isValid: errors.length === 0,
        errors,
        score
    };
}
/**
 * Gerar código de verificação aleatório
 */
function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
/**
 * Verificar se email é válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Sanitizar dados de usuário para resposta (remover senha)
 */
function sanitizeUserData(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
}
//# sourceMappingURL=auth.js.map