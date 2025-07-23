import { Router } from 'express';
import {
    createWorkshop,
    getWorkshopById,
    getWorkshops,
    getWorkshopStats,
    searchWorkshops,
    updateWorkshop
} from '../controllers/workshopController';
import {
    validateSearchTerm,
    validateWorkshopData,
    validateWorkshopId,
    validateWorkshopSearchParams,
    validateWorkshopUpdateData
} from '../middleware/workshopValidation';

const router = Router();

// Criar nova oficina
router.post('/', validateWorkshopData, createWorkshop);

// Listar oficinas com filtros e paginação
router.get('/', validateWorkshopSearchParams, getWorkshops);

// Buscar oficinas por termo
router.get('/search/:term', validateSearchTerm, searchWorkshops);

// Buscar oficina por ID
router.get('/:id', validateWorkshopId, getWorkshopById);

// Estatísticas detalhadas da oficina
router.get('/:id/stats', validateWorkshopId, getWorkshopStats);

// Atualizar oficina
router.put('/:id', validateWorkshopId, validateWorkshopUpdateData, updateWorkshop);

export default router;
