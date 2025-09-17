"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ✅ Aplicar middleware de autenticação para todas as rotas
router.use(auth_1.authenticateToken);
// 📊 Rotas do Dashboard
router.get('/summary/:userId', dashboardController_1.getDashboardSummary);
router.get('/vehicles/:userId', dashboardController_1.getDashboardVehicles);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map