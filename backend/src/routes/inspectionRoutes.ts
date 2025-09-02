import { Router } from 'express';
import {
    getInspectionStats,
    getInspectionTypes,
    getUserInspections,
    scheduleInspection
} from '../controllers/inspectionController';

const router = Router();

// Lista de inspeções (rota principal)
router.get('/', getUserInspections);

// Estatísticas de vistorias
router.get('/stats', getInspectionStats);

// Tipos de vistoria disponíveis
router.get('/types', getInspectionTypes);

// Agendar nova vistoria
router.post('/', scheduleInspection);

// Obter vistorias do usuário
router.get('/user/:userId', getUserInspections);

export default router;
