"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadController = exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// ✅ Configuração do multer para armazenamento de arquivos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/maintenance_docs');
        // Criar diretório se não existir
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gerar nome único: timestamp + random + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path_1.default.extname(file.originalname);
        const fileName = `maintenance_${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});
// ✅ Filtro de arquivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Tipos aceitos: JPEG, PNG, WebP, PDF`));
    }
};
// ✅ Configuração do middleware multer
exports.uploadMiddleware = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo por arquivo
        files: 10 // Máximo 10 arquivos por vez
    }
});
// ✅ Controller para upload de arquivos
class FileUploadController {
    /**
     * Upload de múltiplos arquivos de manutenção
     * POST /api/upload/maintenance-documents
     */
    static async uploadMaintenanceDocuments(req, res) {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo foi enviado'
                });
            }
            const files = req.files;
            const uploadedFiles = [];
            // Processar cada arquivo enviado
            for (const file of files) {
                // Gerar URL pública do arquivo
                const fileUrl = `/uploads/maintenance_docs/${file.filename}`;
                const fileInfo = {
                    id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: fileUrl,
                    mimeType: file.mimetype,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                };
                uploadedFiles.push(fileInfo);
            }
            return res.status(200).json({
                success: true,
                message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
                data: {
                    files: uploadedFiles,
                    totalFiles: uploadedFiles.length,
                    totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
                }
            });
        }
        catch (error) {
            console.error('Erro no upload de arquivos:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor durante o upload',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Upload de arquivo único
     * POST /api/upload/single
     */
    static async uploadSingleFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo foi enviado'
                });
            }
            const file = req.file;
            const fileUrl = `/uploads/maintenance_docs/${file.filename}`;
            const fileInfo = {
                id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                originalName: file.originalname,
                fileName: file.filename,
                url: fileUrl,
                mimeType: file.mimetype,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            return res.status(200).json({
                success: true,
                message: 'Arquivo enviado com sucesso',
                data: fileInfo
            });
        }
        catch (error) {
            console.error('Erro no upload de arquivo:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor durante o upload',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Deletar arquivo
     * DELETE /api/upload/file/:filename
     */
    static async deleteFile(req, res) {
        try {
            const { filename } = req.params;
            if (!filename) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome do arquivo é obrigatório'
                });
            }
            const filePath = path_1.default.join(__dirname, '../../uploads/maintenance_docs', filename);
            // Verificar se arquivo existe
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado'
                });
            }
            // Deletar arquivo
            fs_1.default.unlinkSync(filePath);
            return res.status(200).json({
                success: true,
                message: 'Arquivo deletado com sucesso',
                data: { filename }
            });
        }
        catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao deletar arquivo',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Upload de imagem de veículo
     * POST /api/upload/vehicle-image
     */
    static async uploadVehicleImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhuma imagem foi enviada'
                });
            }
            const file = req.file;
            // Criar objeto de arquivo de resposta
            const uploadedFile = {
                id: path_1.default.parse(file.filename).name,
                originalName: file.originalname,
                fileName: file.filename,
                url: `/uploads/vehicle_images/${file.filename}`,
                mimeType: file.mimetype,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            return res.status(200).json({
                success: true,
                message: 'Imagem do veículo enviada com sucesso',
                data: uploadedFile
            });
        }
        catch (error) {
            console.error('Erro no upload da imagem do veículo:', error);
            // Remover arquivo em caso de erro
            if (req.file?.path && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor durante o upload',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Listar arquivos disponíveis
     * GET /api/upload/files
     */
    static async listFiles(req, res) {
        try {
            const uploadDir = path_1.default.join(__dirname, '../../uploads/maintenance_docs');
            if (!fs_1.default.existsSync(uploadDir)) {
                return res.status(200).json({
                    success: true,
                    data: {
                        files: [],
                        totalFiles: 0
                    }
                });
            }
            const files = fs_1.default.readdirSync(uploadDir);
            const fileList = files.map(filename => {
                const filePath = path_1.default.join(uploadDir, filename);
                const stats = fs_1.default.statSync(filePath);
                return {
                    filename,
                    url: `/uploads/maintenance_docs/${filename}`,
                    size: stats.size,
                    createdAt: stats.birthtime.toISOString(),
                    modifiedAt: stats.mtime.toISOString()
                };
            });
            return res.status(200).json({
                success: true,
                data: {
                    files: fileList,
                    totalFiles: fileList.length
                }
            });
        }
        catch (error) {
            console.error('Erro ao listar arquivos:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao listar arquivos',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}
exports.FileUploadController = FileUploadController;
//# sourceMappingURL=fileUploadController.js.map