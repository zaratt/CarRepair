"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = exports.updateProfile = exports.refreshToken = exports.changePassword = exports.login = exports.register = void 0;
const auth_1 = require("../utils/auth");
const documentValidation_1 = require("../utils/documentValidation");
const errorHandler_1 = require("./errorHandler");
/**
 * Validação avançada para registro de usuário (com senha)
 */
const register = (req, res, next) => {
    const { name, email, password, confirmPassword, document, phone, city, state } = req.body;
    const errors = [];
    // Validar nome
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }
    // Validar email
    if (!email || !(0, auth_1.isValidEmail)(email)) {
        errors.push('Valid email is required');
    }
    // Validar senha
    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
    }
    else {
        // Senha deve ter pelo menos 8 caracteres
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        // Deve conter pelo menos uma letra maiúscula
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        // Deve conter pelo menos uma letra minúscula
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        // Deve conter pelo menos um número
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        // Deve conter pelo menos um caractere especial
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
    }
    // Confirmar senha
    if (password && confirmPassword && password !== confirmPassword) {
        errors.push('Password confirmation does not match');
    }
    // Validar documento
    if (!document) {
        errors.push('Document (CPF/CNPJ) is required');
    }
    else {
        const validation = (0, documentValidation_1.validateDocument)(document);
        if (!validation.isValid) {
            errors.push(`Invalid document: ${validation.error}`);
        }
    }
    // Validar telefone (opcional)
    if (phone && typeof phone === 'string' && phone.trim() !== '') {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            errors.push('Phone must be in format (XX) XXXXX-XXXX');
        }
    }
    // Validar cidade (opcional)
    if (city && (typeof city !== 'string' || city.trim().length < 2)) {
        errors.push('City must be at least 2 characters');
    }
    // Validar estado (opcional)
    if (state && (typeof state !== 'string' || state.trim().length !== 2)) {
        errors.push('State must be 2 characters (UF)');
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(errors.join(', '));
    }
    next();
};
exports.register = register;
/**
 * Validação para login com senha
 */
const login = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    // Validar email
    if (!email || !(0, auth_1.isValidEmail)(email)) {
        errors.push('Valid email is required');
    }
    // Validar senha
    if (!password || typeof password !== 'string' || password.trim() === '') {
        errors.push('Password is required');
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(errors.join(', '));
    }
    next();
};
exports.login = login;
/**
 * Validação para alterar senha
 */
const changePassword = (req, res, next) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const errors = [];
    // Validar senha atual
    if (!currentPassword || typeof currentPassword !== 'string') {
        errors.push('Current password is required');
    }
    // Validar nova senha com mesmas regras de segurança
    if (!newPassword || typeof newPassword !== 'string') {
        errors.push('New password is required');
    }
    else {
        if (newPassword.length < 8) {
            errors.push('New password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(newPassword)) {
            errors.push('New password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(newPassword)) {
            errors.push('New password must contain at least one lowercase letter');
        }
        if (!/\d/.test(newPassword)) {
            errors.push('New password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            errors.push('New password must contain at least one special character');
        }
    }
    // Confirmar nova senha
    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
        errors.push('New password confirmation does not match');
    }
    // Verificar se nova senha é diferente da atual
    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push('New password must be different from current password');
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(errors.join(', '));
    }
    next();
};
exports.changePassword = changePassword;
/**
 * Validação para refresh token
 */
const refreshToken = (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
        throw new errorHandler_1.ValidationError('Refresh token is required');
    }
    next();
};
exports.refreshToken = refreshToken;
/**
 * Validação para atualização de perfil
 */
const updateProfile = (req, res, next) => {
    const { name, phone, city, state } = req.body;
    const errors = [];
    // Validar nome (opcional)
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2) {
            errors.push('Name must be at least 2 characters');
        }
    }
    // Validar telefone (opcional, pode ser null)
    if (phone !== undefined && phone !== null && phone !== '') {
        if (typeof phone === 'string' && phone.trim() !== '') {
            const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
            if (!phoneRegex.test(phone)) {
                errors.push('Phone must be in format (XX) XXXXX-XXXX');
            }
        }
    }
    // Validar cidade (opcional, pode ser null)
    if (city !== undefined && city !== null && city !== '') {
        if (typeof city !== 'string' || city.trim().length < 2) {
            errors.push('City must be at least 2 characters');
        }
    }
    // Validar estado (opcional, pode ser null)
    if (state !== undefined && state !== null && state !== '') {
        if (typeof state !== 'string' || state.trim().length !== 2) {
            errors.push('State must be 2 characters (UF)');
        }
    }
    if (errors.length > 0) {
        throw new errorHandler_1.ValidationError(errors.join(', '));
    }
    next();
};
exports.updateProfile = updateProfile;
/**
 * Exportação do objeto de validações
 */
exports.authValidation = {
    register: exports.register,
    login: exports.login,
    changePassword: exports.changePassword,
    refreshToken: exports.refreshToken,
    updateProfile: exports.updateProfile
};
//# sourceMappingURL=authValidation.js.map