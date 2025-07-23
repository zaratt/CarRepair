import { Router } from 'express';
import {
    changePassword,
    getProfile,
    login,
    logout,
    refreshToken,
    register,
    updateProfile
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authValidation } from '../middleware/authValidation';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Registrar novo usuário com senha
 * @access Public
 */
router.post('/register', authValidation.register, register);

/**
 * @route POST /auth/login
 * @desc Login de usuário com email e senha
 * @access Public
 */
router.post('/login', authValidation.login, login);

/**
 * @route POST /auth/refresh
 * @desc Renovar token de acesso
 * @access Public
 */
router.post('/refresh', authValidation.refreshToken, refreshToken);

/**
 * @route POST /auth/logout
 * @desc Logout (invalidar token)
 * @access Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route GET /auth/profile
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /auth/profile
 * @desc Atualizar perfil do usuário logado
 * @access Private
 */
router.put('/profile', authenticateToken, authValidation.updateProfile, updateProfile);

/**
 * @route PUT /auth/change-password
 * @desc Alterar senha do usuário logado
 * @access Private
 */
router.put('/change-password', authenticateToken, authValidation.changePassword, changePassword);

export default router;
