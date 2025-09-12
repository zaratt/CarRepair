import { Router } from 'express';
import { FileUploadController, uploadMiddleware } from '../controllers/fileUploadController';

const router = Router();

/**
 * @route POST /api/upload/maintenance-documents
 * @desc Upload múltiplos documentos de manutenção
 * @access Private (futuramente adicionar auth middleware)
 */
router.post(
    '/maintenance-documents',
    uploadMiddleware.array('documents', 10), // Aceita até 10 arquivos com campo 'documents'
    FileUploadController.uploadMaintenanceDocuments
);

/**
 * @route POST /api/upload/single
 * @desc Upload de arquivo único
 * @access Private (futuramente adicionar auth middleware)
 */
router.post(
    '/single',
    uploadMiddleware.single('document'), // Aceita 1 arquivo com campo 'document'
    FileUploadController.uploadSingleFile
);

/**
 * @route DELETE /api/upload/file/:filename
 * @desc Deletar arquivo específico
 * @access Private (futuramente adicionar auth middleware)
 */
router.delete(
    '/file/:filename',
    FileUploadController.deleteFile
);

/**
 * @route GET /api/upload/files
 * @desc Listar todos os arquivos disponíveis
 * @access Private (futuramente adicionar auth middleware)
 */
router.get(
    '/files',
    FileUploadController.listFiles
);

export default router;