"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /system/stats
 * @desc Obter estatísticas gerais do sistema
 * @access Private (Admin only)
 */
router.get('/stats', auth_1.authenticateToken, (0, auth_1.authorize)(['admin']), systemController_1.getSystemStats);
/**
 * @route GET /system/health
 * @desc Verificar saúde do sistema
 * @access Public (para monitoring)
 */
router.get('/health', systemController_1.getSystemHealth);
/**
 * @route GET /system/endpoints
 * @desc Listar endpoints disponíveis da API
 * @access Public
 */
router.get('/endpoints', systemController_1.getSystemEndpoints);
exports.default = router;
//# sourceMappingURL=systemRoutes.js.map