import { Request, Response, Router } from 'express';
import {
    createMaintenance,
    deleteMaintenance,
    getMaintenanceById,
    getMaintenances,
    getMaintenancesByVehicle,
    updateMaintenance
} from '../controllers/maintenanceController';
import { asyncHandler } from '../middleware/errorHandler';
import {
    validateMaintenanceData,
    validatePagination,
    validateRequiredFields,
    validateUUID
} from '../middleware/validation';

const router = Router();

// GET /api/maintenances - Listar manutenções com paginação e filtros
router.get('/',
    validatePagination,
    asyncHandler(getMaintenances)
);

// GET /api/maintenances/stats - Estatísticas gerais de manutenções
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Maintenance statistics',
        data: {
            total: 0,
            completed: 0,
            pending: 0,
            validated: 0
        }
    });
}));

// GET /api/maintenance-types - Tipos de manutenção
router.get('/types', asyncHandler(async (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Maintenance types',
        data: [
            'Troca de óleo',
            'Revisão geral',
            'Freios',
            'Suspensão',
            'Motor',
            'Elétrica',
            'Ar condicionado',
            'Outros'
        ]
    });
}));

// GET /api/maintenances/:id - Buscar manutenção por ID
router.get('/:id',
    validateUUID('id'),
    asyncHandler(getMaintenanceById)
);

// GET /api/maintenances/vehicle/:vehicleId - Buscar manutenções por veículo
router.get('/vehicle/:vehicleId',
    validateUUID('vehicleId'),
    asyncHandler(getMaintenancesByVehicle)
);

// POST /api/maintenances - Criar nova manutenção
router.post('/',
    validateRequiredFields(['vehicleId', 'date', 'description', 'products', 'mileage']),
    validateMaintenanceData,
    asyncHandler(createMaintenance)
);

// PUT /api/maintenances/:id - Atualizar manutenção
router.put('/:id',
    validateUUID('id'),
    validateMaintenanceData,
    asyncHandler(updateMaintenance)
);

// DELETE /api/maintenances/:id - Excluir manutenção
router.delete('/:id',
    validateUUID('id'),
    asyncHandler(deleteMaintenance)
);

export default router;
