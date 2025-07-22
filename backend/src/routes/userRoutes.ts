import { Router } from 'express';
import {
    createUser,
    getUserByDocument,
    getUserById,
    getUsers,
    updateUser,
    validateUser
} from '../controllers/userController';
import {
    validateUserData,
    validateUserId,
    validateUserSearchParams,
    validateUserUpdateData
} from '../middleware/userValidation';

const router = Router();

// Criar novo usuário
router.post('/', validateUserData, createUser);

// Listar usuários com filtros e paginação
router.get('/', validateUserSearchParams, getUsers);

// Buscar usuário por documento (CPF/CNPJ)
router.get('/document/:document', getUserByDocument);

// Buscar usuário por ID
router.get('/:id', validateUserId, getUserById);

// Atualizar usuário
router.put('/:id', validateUserId, validateUserUpdateData, updateUser);

// Validar/Invalidar usuário
router.patch('/:id/validate', validateUserId, validateUser);

export default router;
