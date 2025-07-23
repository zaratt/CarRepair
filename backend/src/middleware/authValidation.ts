import { NextFunction, Request, Response } from 'express';
import { isValidEmail } from '../utils/auth';
import { validateDocument } from '../utils/documentValidation';
import { ValidationError } from './errorHandler';

/**
 * Validação avançada para registro de usuário (com senha)
 */
export const register = (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, confirmPassword, document, phone, city, state } = req.body;
    const errors: string[] = [];

    // Validar nome
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }

    // Validar email
    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    // Validar senha
    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
    } else {
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
    } else {
        const validation = validateDocument(document);
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
        throw new ValidationError(errors.join(', '));
    }

    next();
};

/**
 * Validação para login com senha
 */
export const login = (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const errors: string[] = [];

    // Validar email
    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    // Validar senha
    if (!password || typeof password !== 'string' || password.trim() === '') {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join(', '));
    }

    next();
};

/**
 * Validação para alterar senha
 */
export const changePassword = (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const errors: string[] = [];

    // Validar senha atual
    if (!currentPassword || typeof currentPassword !== 'string') {
        errors.push('Current password is required');
    }

    // Validar nova senha com mesmas regras de segurança
    if (!newPassword || typeof newPassword !== 'string') {
        errors.push('New password is required');
    } else {
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
        throw new ValidationError(errors.join(', '));
    }

    next();
};

/**
 * Validação para refresh token
 */
export const refreshToken = (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
        throw new ValidationError('Refresh token is required');
    }

    next();
};

/**
 * Validação para atualização de perfil
 */
export const updateProfile = (req: Request, res: Response, next: NextFunction) => {
    const { name, phone, city, state } = req.body;
    const errors: string[] = [];

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
        throw new ValidationError(errors.join(', '));
    }

    next();
};

/**
 * Exportação do objeto de validações
 */
export const authValidation = {
    register,
    login,
    changePassword,
    refreshToken,
    updateProfile
};
