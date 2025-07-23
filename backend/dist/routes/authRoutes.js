"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const authValidation_1 = require("../middleware/authValidation");
const router = (0, express_1.Router)();
/**
 * @route POST /auth/register
 * @desc Registrar novo usuário com senha
 * @access Public
 */
router.post('/register', authValidation_1.authValidation.register, authController_1.register);
/**
 * @route POST /auth/login
 * @desc Login de usuário com email e senha
 * @access Public
 */
router.post('/login', authValidation_1.authValidation.login, authController_1.login);
/**
 * @route POST /auth/refresh
 * @desc Renovar token de acesso
 * @access Public
 */
router.post('/refresh', authValidation_1.authValidation.refreshToken, authController_1.refreshToken);
/**
 * @route POST /auth/logout
 * @desc Logout (invalidar token)
 * @access Private
 */
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
/**
 * @route GET /auth/profile
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get('/profile', auth_1.authenticateToken, authController_1.getProfile);
/**
 * @route PUT /auth/profile
 * @desc Atualizar perfil do usuário logado
 * @access Private
 */
router.put('/profile', auth_1.authenticateToken, authValidation_1.authValidation.updateProfile, authController_1.updateProfile);
/**
 * @route PUT /auth/change-password
 * @desc Alterar senha do usuário logado
 * @access Private
 */
router.put('/change-password', auth_1.authenticateToken, authValidation_1.authValidation.changePassword, authController_1.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map