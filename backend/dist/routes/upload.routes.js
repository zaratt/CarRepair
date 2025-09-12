"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileUploadController_1 = require("../controllers/fileUploadController");
const auth_1 = require("../middleware/auth");
const uploadSecurity_1 = require("../middleware/uploadSecurity");
const router = (0, express_1.Router)();
/**
 * @route POST /api/upload/maintenance-documents
 * @desc Upload múltiplos documentos de manutenção COM SEGURANÇA
 * @access Private - Requer autenticação
 * @security Rate limited, file validation, virus scanning
 */
router.post('/maintenance-documents', auth_1.authenticateToken, uploadSecurity_1.uploadMaintenanceDoc.array('documents', 5), // Reduzido para 5 arquivos max
(0, uploadSecurity_1.validateUploadedFile)('documents'), fileUploadController_1.FileUploadController.uploadMaintenanceDocuments);
/**
 * @route POST /api/upload/vehicle-image
 * @desc Upload de imagem de veículo COM SEGURANÇA
 * @access Private - Requer autenticação
 * @security Rate limited, image validation, size limits
 */
router.post('/vehicle-image', auth_1.authenticateToken, uploadSecurity_1.uploadVehicleImage.single('image'), (0, uploadSecurity_1.validateUploadedFile)('images'), fileUploadController_1.FileUploadController.uploadVehicleImage);
/**
 * @route POST /api/upload/single
 * @desc Upload de arquivo único COM SEGURANÇA
 * @access Private - Requer autenticação
 * @security Rate limited, file validation
 */
router.post('/single', auth_1.authenticateToken, uploadSecurity_1.uploadMaintenanceDoc.single('document'), (0, uploadSecurity_1.validateUploadedFile)('documents'), fileUploadController_1.FileUploadController.uploadSingleFile);
/**
 * @route DELETE /api/upload/file/:filename
 * @desc Deletar arquivo específico COM VALIDAÇÃO
 * @access Private - Requer autenticação
 * @security Path traversal protection, ownership validation
 */
router.delete('/file/:filename', auth_1.authenticateToken, fileUploadController_1.FileUploadController.deleteFile);
/**
 * @route GET /api/upload/files
 * @desc Listar arquivos do usuário autenticado
 * @access Private - Requer autenticação
 * @security User isolation, rate limited
 */
router.get('/files', auth_1.authenticateToken, fileUploadController_1.FileUploadController.listFiles);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map