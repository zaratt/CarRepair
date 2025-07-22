"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const userValidation_1 = require("../middleware/userValidation");
const router = (0, express_1.Router)();
// Criar novo usuário
router.post('/', userValidation_1.validateUserData, userController_1.createUser);
// Listar usuários com filtros e paginação
router.get('/', userValidation_1.validateUserSearchParams, userController_1.getUsers);
// Buscar usuário por documento (CPF/CNPJ)
router.get('/document/:document', userController_1.getUserByDocument);
// Buscar usuário por ID
router.get('/:id', userValidation_1.validateUserId, userController_1.getUserById);
// Atualizar usuário
router.put('/:id', userValidation_1.validateUserId, userValidation_1.validateUserUpdateData, userController_1.updateUser);
// Validar/Invalidar usuário
router.patch('/:id/validate', userValidation_1.validateUserId, userController_1.validateUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map