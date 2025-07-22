import { Router } from 'express';
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
