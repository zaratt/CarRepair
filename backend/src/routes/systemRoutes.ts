import { Router } from 'express';
import {
    getSystemEndpoints,
    getSystemHealth,
    getSystemStats
} from '../controllers/systemController';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route GET /system/stats
 * @desc Obter estatísticas gerais do sistema
 * @access Private (Admin only)
 */
router.get('/stats', authenticateToken, authorize(['admin']), getSystemStats);

/**
 * @route GET /system/health
 * @desc Verificar saúde do sistema
 * @access Public (para monitoring)
 */
router.get('/health', getSystemHealth);

/**
 * @route GET /system/endpoints
 * @desc Listar endpoints disponíveis da API
 * @access Public
 */
router.get('/endpoints', getSystemEndpoints);

export default router;
