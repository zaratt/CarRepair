"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workshopController_1 = require("../controllers/workshopController");
const workshopValidation_1 = require("../middleware/workshopValidation");
const router = (0, express_1.Router)();
// Criar nova oficina
router.post('/', workshopValidation_1.validateWorkshopData, workshopController_1.createWorkshop);
// Listar oficinas com filtros e paginação
router.get('/', workshopValidation_1.validateWorkshopSearchParams, workshopController_1.getWorkshops);
// Buscar oficinas por termo
router.get('/search/:term', workshopValidation_1.validateSearchTerm, workshopController_1.searchWorkshops);
// Buscar oficina por ID
router.get('/:id', workshopValidation_1.validateWorkshopId, workshopController_1.getWorkshopById);
// Estatísticas detalhadas da oficina
router.get('/:id/stats', workshopValidation_1.validateWorkshopId, workshopController_1.getWorkshopStats);
// Atualizar oficina
router.put('/:id', workshopValidation_1.validateWorkshopId, workshopValidation_1.validateWorkshopUpdateData, workshopController_1.updateWorkshop);
exports.default = router;
//# sourceMappingURL=workshopRoutes.js.map