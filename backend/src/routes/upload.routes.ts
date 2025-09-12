import { Router } from 'express';
import { FileUploadController } from '../controllers/fileUploadController';
import { authenticateToken } from '../middleware/auth';
import {
    uploadMaintenanceDoc,
    uploadVehicleImage,
    validateUploadedFile
} from '../middleware/uploadSecurity';

const router = Router();

/**
 * @route POST /api/upload/maintenance-documents
 * @desc Upload múltiplos documentos de manutenção COM SEGURANÇA
 * @access Private - Requer autenticação
 * @security Rate limited, file validation, virus scanning
 */
router.post(
    '/maintenance-documents',
    authenticateToken,
    uploadMaintenanceDoc.array('documents', 5), // Reduzido para 5 arquivos max
    validateUploadedFile('documents'),
    FileUploadController.uploadMaintenanceDocuments
);

/**
 * @route POST /api/upload/vehicle-image
 * @desc Upload de imagem de veículo COM SEGURANÇA
 * @access Private - Requer autenticação
 * @security Rate limited, image validation, size limits
 */
router.post(
    '/vehicle-image',
    authenticateToken,
    uploadVehicleImage.single('image'),
    validateUploadedFile('images'),
    FileUploadController.uploadVehicleImage
);

/**
 * @route POST /api/upload/single
 * @desc Upload de arquivo único COM SEGURANÇA
 * @access Private - Requer autenticação
 * @security Rate limited, file validation
 */
router.post(
    '/single',
    authenticateToken,
    uploadMaintenanceDoc.single('document'),
    validateUploadedFile('documents'),
    FileUploadController.uploadSingleFile
);

/**
 * @route DELETE /api/upload/file/:filename
 * @desc Deletar arquivo específico COM VALIDAÇÃO
 * @access Private - Requer autenticação
 * @security Path traversal protection, ownership validation
 */
router.delete(
    '/file/:filename',
    authenticateToken,
    FileUploadController.deleteFile
);

/**
 * @route GET /api/upload/files
 * @desc Listar arquivos do usuário autenticado
 * @access Private - Requer autenticação
 * @security User isolation, rate limited
 */
router.get(
    '/files',
    authenticateToken,
    FileUploadController.listFiles
);

export default router;