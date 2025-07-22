import { Router } from 'express';
import {
    createVehicle,
    deleteVehicle,
    getVehicleById,
    getVehicles,
    searchVehiclesByPlate,
    updateVehicle
} from '../controllers/vehicleController';
import { asyncHandler } from '../middleware/errorHandler';
import {
    validateLicensePlateParam,
    validatePagination,
    validateRequiredFields,
    validateUUID,
    validateVehicleData
} from '../middleware/validation';

const router = Router();

// GET /api/vehicles - Listar veículos com paginação e filtros
router.get('/',
    validatePagination,
    asyncHandler(getVehicles)
);

// GET /api/vehicles/search/:plate - Buscar veículos por placa (busca parcial)
router.get('/search/:plate',
    asyncHandler(searchVehiclesByPlate)
);

// GET /api/vehicles/:id - Buscar veículo por ID
router.get('/:id',
    validateUUID('id'),
    asyncHandler(getVehicleById)
);

// POST /api/vehicles - Criar novo veículo
router.post('/',
    validateRequiredFields(['licensePlate', 'yearManufacture', 'modelYear', 'fuelType']),
    validateLicensePlateParam,
    validateVehicleData,
    asyncHandler(createVehicle)
);

// PUT /api/vehicles/:id - Atualizar veículo
router.put('/:id',
    validateUUID('id'),
    validateLicensePlateParam,
    validateVehicleData,
    asyncHandler(updateVehicle)
);

// DELETE /api/vehicles/:id - Excluir veículo (soft delete por padrão)
router.delete('/:id',
    validateUUID('id'),
    asyncHandler(deleteVehicle)
);

export default router;
