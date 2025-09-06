"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inspectionController_1 = require("../controllers/inspectionController");
const router = (0, express_1.Router)();
// Lista de inspeções (rota principal)
router.get('/', inspectionController_1.getUserInspections);
// Estatísticas de vistorias
router.get('/stats', inspectionController_1.getInspectionStats);
// Tipos de vistoria disponíveis
router.get('/types', inspectionController_1.getInspectionTypes);
// Agendar nova vistoria
router.post('/', inspectionController_1.scheduleInspection);
// Obter vistorias do usuário
router.get('/user/:userId', inspectionController_1.getUserInspections);
exports.default = router;
//# sourceMappingURL=inspectionRoutes.js.map