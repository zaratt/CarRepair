import { Router } from 'express';
import { getDashboardSummary, getDashboardVehicles } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ✅ Aplicar middleware de autenticação para todas as rotas
router.use(authenticateToken);

// 📊 Rotas do Dashboard
router.get('/summary/:userId', getDashboardSummary);
router.get('/vehicles/:userId', getDashboardVehicles);

export default router;