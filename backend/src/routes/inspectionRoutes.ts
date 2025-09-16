import { Router } from 'express';
import { body, param } from 'express-validator';
import {
    createInspection,
    deleteInspection,
    getInspectionById,
    getInspections,
    getInspectionStats,
    getInspectionTypes,
    updateInspection
} from '../controllers/inspectionController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// ✅ MIDDLEWARE DE AUTENTICAÇÃO OBRIGATÓRIO
router.use(authenticateToken);

// ✅ VALIDAÇÕES PARA CRIAR INSPEÇÃO
const createInspectionValidation = [
    body('vehicleId')
        .isUUID()
        .withMessage('vehicleId deve ser um UUID válido'),
    body('status')
        .isIn(['Pendente', 'Aprovado', 'Aprovado com apontamentos', 'Não conforme'])
        .withMessage('Status deve ser: Pendente, Aprovado, Aprovado com apontamentos ou Não conforme'),
    body('company')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
    body('date')
        .isISO8601()
        .withMessage('Data deve estar no formato ISO8601')
];

// ✅ VALIDAÇÕES PARA ATUALIZAR INSPEÇÃO
const updateInspectionValidation = [
    param('id')
        .isUUID()
        .withMessage('ID deve ser um UUID válido'),
    body('status')
        .optional()
        .isIn(['Pendente', 'Aprovado', 'Aprovado com apontamentos', 'Não conforme'])
        .withMessage('Status deve ser: Pendente, Aprovado, Aprovado com apontamentos ou Não conforme'),
    body('company')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
    body('date')
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
router.get('/', getInspections);

/**
 * @route POST /api/inspections
 * @desc Criar nova inspeção
 * @access Private
 */
router.post('/', createInspectionValidation, validateRequest, createInspection);

/**
 * @route GET /api/inspections/stats
 * @desc Estatísticas de inspeções
 * @access Private
 */
router.get('/stats', getInspectionStats);

/**
 * @route GET /api/inspections/types
 * @desc Tipos de inspeção disponíveis
 * @access Private
 */
router.get('/types', getInspectionTypes);

/**
 * @route GET /api/inspections/:id
 * @desc Obter inspeção específica
 * @access Private
 */
router.get('/:id', param('id').isUUID().withMessage('ID deve ser um UUID válido'), validateRequest, getInspectionById);

/**
 * @route PUT /api/inspections/:id
 * @desc Atualizar inspeção existente
 * @access Private
 */
router.put('/:id', updateInspectionValidation, validateRequest, updateInspection);

/**
 * @route DELETE /api/inspections/:id
 * @desc Deletar inspeção
 * @access Private
 */
router.delete('/:id', param('id').isUUID().withMessage('ID deve ser um UUID válido'), validateRequest, deleteInspection);

export default router;
