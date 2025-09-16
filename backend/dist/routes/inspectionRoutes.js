"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const inspectionController_1 = require("../controllers/inspectionController");
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
// ✅ MIDDLEWARE DE AUTENTICAÇÃO OBRIGATÓRIO
router.use(auth_1.authenticateToken);
// ✅ VALIDAÇÕES PARA CRIAR INSPEÇÃO
const createInspectionValidation = [
    (0, express_validator_1.body)('vehicleId')
        .isUUID()
        .withMessage('vehicleId deve ser um UUID válido'),
    (0, express_validator_1.body)('status')
        .isIn(['Pendente', 'Aprovado', 'Aprovado com apontamentos', 'Não conforme'])
        .withMessage('Status deve ser: Pendente, Aprovado, Aprovado com apontamentos ou Não conforme'),
    (0, express_validator_1.body)('company')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
    (0, express_validator_1.body)('date')
        .isISO8601()
        .withMessage('Data deve estar no formato ISO8601')
];
// ✅ VALIDAÇÕES PARA ATUALIZAR INSPEÇÃO
const updateInspectionValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('ID deve ser um UUID válido'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['Pendente', 'Aprovado', 'Aprovado com apontamentos', 'Não conforme'])
        .withMessage('Status deve ser: Pendente, Aprovado, Aprovado com apontamentos ou Não conforme'),
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
    (0, express_validator_1.body)('date')
        .optional()
        .isISO8601()
        .withMessage('Data deve estar no formato ISO8601')
];
// ✅ ROTAS COMPLETAS COM VALIDAÇÃO
/**
 * @route GET /api/inspections
 * @desc Obter todas as inspeções do usuário autenticado
 * @access Private
 */
router.get('/', inspectionController_1.getInspections);
/**
 * @route POST /api/inspections
 * @desc Criar nova inspeção
 * @access Private
 */
router.post('/', createInspectionValidation, validateRequest_1.validateRequest, inspectionController_1.createInspection);
/**
 * @route GET /api/inspections/stats
 * @desc Estatísticas de inspeções
 * @access Private
 */
router.get('/stats', inspectionController_1.getInspectionStats);
/**
 * @route GET /api/inspections/types
 * @desc Tipos de inspeção disponíveis
 * @access Private
 */
router.get('/types', inspectionController_1.getInspectionTypes);
/**
 * @route GET /api/inspections/:id
 * @desc Obter inspeção específica
 * @access Private
 */
router.get('/:id', (0, express_validator_1.param)('id').isUUID().withMessage('ID deve ser um UUID válido'), validateRequest_1.validateRequest, inspectionController_1.getInspectionById);
/**
 * @route PUT /api/inspections/:id
 * @desc Atualizar inspeção existente
 * @access Private
 */
router.put('/:id', updateInspectionValidation, validateRequest_1.validateRequest, inspectionController_1.updateInspection);
/**
 * @route DELETE /api/inspections/:id
 * @desc Deletar inspeção
 * @access Private
 */
router.delete('/:id', (0, express_validator_1.param)('id').isUUID().withMessage('ID deve ser um UUID válido'), validateRequest_1.validateRequest, inspectionController_1.deleteInspection);
exports.default = router;
//# sourceMappingURL=inspectionRoutes.js.map