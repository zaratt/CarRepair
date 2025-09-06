"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicleController_1 = require("../controllers/vehicleController");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// GET /api/vehicles - Listar veículos com paginação e filtros
router.get('/', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(vehicleController_1.getVehicles));
// GET /api/vehicles/stats - Estatísticas gerais de veículos
router.get('/stats', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Vehicle statistics',
        data: {
            total: 0,
            active: 0,
            brands: 0,
            models: 0
        }
    });
}));
// GET /api/vehicles/search/:plate - Buscar veículos por placa (busca parcial)
router.get('/search/:plate', (0, errorHandler_1.asyncHandler)(vehicleController_1.searchVehiclesByPlate));
// GET /api/vehicles/:id - Buscar veículo por ID
router.get('/:id', (0, validation_1.validateUUID)('id'), (0, errorHandler_1.asyncHandler)(vehicleController_1.getVehicleById));
// POST /api/vehicles - Criar novo veículo
router.post('/', (0, validation_1.validateRequiredFields)(['licensePlate', 'yearManufacture', 'modelYear', 'fuelType']), validation_1.validateLicensePlateParam, validation_1.validateVehicleData, (0, errorHandler_1.asyncHandler)(vehicleController_1.createVehicle));
// PUT /api/vehicles/:id - Atualizar veículo
router.put('/:id', (0, validation_1.validateUUID)('id'), validation_1.validateLicensePlateParam, validation_1.validateVehicleData, (0, errorHandler_1.asyncHandler)(vehicleController_1.updateVehicle));
// DELETE /api/vehicles/:id - Excluir veículo (soft delete por padrão)
router.delete('/:id', (0, validation_1.validateUUID)('id'), (0, errorHandler_1.asyncHandler)(vehicleController_1.deleteVehicle));
exports.default = router;
//# sourceMappingURL=vehicleRoutes.js.map