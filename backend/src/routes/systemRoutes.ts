import { Router } from 'express';
import {
    getSystemEndpoints,
    getSystemHealth,
    getSystemStats,
    systemEndpointsRateLimit,
    systemHealthRateLimit,
    systemStatsRateLimit
} from '../controllers/systemController';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route GET /system/stats
 * @desc Obter estatísticas gerais do sistema
 * @access Private (Admin only)
 */
router.get('/stats', systemStatsRateLimit, authenticateToken, authorize(['admin']), getSystemStats);

/**
 * @route GET /system/health
 * @desc Verificar saúde do sistema
 * @access Public (para monitoring)
 */
router.get('/health', systemHealthRateLimit, getSystemHealth);

/**
 * @route GET /system/endpoints
 * @desc Listar endpoints disponíveis da API
 * @access Public
 */
router.get('/endpoints', systemEndpointsRateLimit, getSystemEndpoints);

export default router;
