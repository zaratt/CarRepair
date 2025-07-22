"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenanceController_1 = require("../controllers/maintenanceController");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// GET /api/maintenances - Listar manutenções com paginação e filtros
router.get('/', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(maintenanceController_1.getMaintenances));
// GET /api/maintenances/:id - Buscar manutenção por ID
router.get('/:id', (0, validation_1.validateUUID)('id'), (0, errorHandler_1.asyncHandler)(maintenanceController_1.getMaintenanceById));
// GET /api/maintenances/vehicle/:vehicleId - Buscar manutenções por veículo
router.get('/vehicle/:vehicleId', (0, validation_1.validateUUID)('vehicleId'), (0, errorHandler_1.asyncHandler)(maintenanceController_1.getMaintenancesByVehicle));
// POST /api/maintenances - Criar nova manutenção
router.post('/', (0, validation_1.validateRequiredFields)(['vehicleId', 'date', 'description', 'products', 'mileage']), validation_1.validateMaintenanceData, (0, errorHandler_1.asyncHandler)(maintenanceController_1.createMaintenance));
// PUT /api/maintenances/:id - Atualizar manutenção
router.put('/:id', (0, validation_1.validateUUID)('id'), validation_1.validateMaintenanceData, (0, errorHandler_1.asyncHandler)(maintenanceController_1.updateMaintenance));
// DELETE /api/maintenances/:id - Excluir manutenção
router.delete('/:id', (0, validation_1.validateUUID)('id'), (0, errorHandler_1.asyncHandler)(maintenanceController_1.deleteMaintenance));
exports.default = router;
//# sourceMappingURL=maintenanceRoutes.js.map