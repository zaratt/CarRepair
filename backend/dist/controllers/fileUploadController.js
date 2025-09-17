"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadController = exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fileThrottler_1 = require("../utils/fileThrottler");
// ✅ SEGURANÇA: Função para validar filename e prevenir Path Traversal
const validateFilename = (filename) => {
    // 1. Verificar se filename existe e é string
    if (!filename || typeof filename !== 'string') {
        return { isValid: false, error: 'Nome do arquivo inválido' };
    }
    // 2. Verificar comprimento máximo
    if (filename.length > 255) {
        return { isValid: false, error: 'Nome do arquivo muito longo' };
    }
    // 3. Padrões maliciosos de Path Traversal
    const maliciousPatterns = [
        /\.\./, // Directory traversal (..)
        /\//, // Forward slash
        /\\/, // Backslash
        /:/, // Colon (Windows drives)
        /\*/, // Wildcard
        /\?/, // Question mark
        /"/, // Quote
        /</, // Less than
        />/, // Greater than
        /\|/, // Pipe
        /\0/, // Null byte
        /[\x00-\x1F]/, // Control characters
        /[\x7F-\x9F]/, // Extended control characters
    ];
    for (const pattern of maliciousPatterns) {
        if (pattern.test(filename)) {
            return { isValid: false, error: 'Nome do arquivo contém caracteres não permitidos' };
        }
    }
    // 4. Verificar se começa com caracteres válidos
    if (!/^[a-zA-Z0-9]/.test(filename)) {
        return { isValid: false, error: 'Nome do arquivo deve começar com caractere alfanumérico' };
    }
    // 5. Verificar extensões permitidas
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const extension = path_1.default.extname(filename).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
        return { isValid: false, error: 'Extensão de arquivo não permitida' };
    }
    return { isValid: true };
};
// ✅ SEGURANÇA: Função para validar path seguro
const getSafeFilePath = (filename, baseDir) => {
    try {
        // Construir path absoluto
        const filePath = path_1.default.resolve(baseDir, filename);
        const resolvedBaseDir = path_1.default.resolve(baseDir);
        // Verificar se o path está dentro do diretório base (prevenção de Path Traversal)
        if (!filePath.startsWith(resolvedBaseDir + path_1.default.sep)) {
            return { error: 'Caminho do arquivo fora do diretório permitido' };
        }
        return { path: filePath };
    }
    catch (error) {
        return { error: 'Erro ao resolver caminho do arquivo' };
    }
};
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
            // ✅ SEGURANÇA: Obter IP do cliente para rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo foi enviado'
                });
            }
            const files = req.files;
            const uploadedFiles = [];
            // ✅ SEGURANÇA: Processar cada arquivo com validação
            for (const file of files) {
                // ✅ SEGURANÇA: Validar filename para prevenir Path Traversal
                const filenameValidation = validateFilename(file.filename);
                if (!filenameValidation.isValid) {
                    // Remover arquivo inválido usando throttling
                    try {
                        const safePathResult = getSafeFilePath(file.filename, path_1.default.dirname(file.path));
                        if (safePathResult.path) {
                            await fileThrottler_1.fileThrottler.safeUnlink(clientIP, safePathResult.path);
                        }
                    }
                    catch (unlinkError) {
                        console.warn('Erro ao remover arquivo inválido:', unlinkError);
                    }
                    return res.status(400).json({
                        success: false,
                        message: `Arquivo rejeitado - ${filenameValidation.error}: ${file.originalname}`,
                        error: 'Invalid filename'
                    });
                }
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
            // ✅ SEGURANÇA: Limpar arquivos em caso de erro
            if (req.files && Array.isArray(req.files)) {
                const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
                for (const file of req.files) {
                    try {
                        const safePathResult = getSafeFilePath(file.filename, path_1.default.dirname(file.path));
                        if (safePathResult.path) {
                            const fileExists = await fileThrottler_1.fileThrottler.safeStat(clientIP, safePathResult.path);
                            if (fileExists) {
                                await fileThrottler_1.fileThrottler.safeUnlink(clientIP, safePathResult.path);
                            }
                        }
                    }
                    catch (unlinkError) {
                        console.warn('Erro ao limpar arquivo:', unlinkError);
                    }
                }
            }
            // ✅ SEGURANÇA: Tratar erros de rate limiting
            if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações de arquivo. Tente novamente em alguns minutos.',
                    error: 'Rate limit exceeded'
                });
            }
            if (error instanceof Error && error.message.includes('Concurrent operation limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações simultâneas. Tente novamente em alguns segundos.',
                    error: 'Concurrent limit exceeded'
                });
            }
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
            // ✅ SEGURANÇA: Obter IP do cliente para rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo foi enviado'
                });
            }
            const file = req.file;
            // ✅ SEGURANÇA: Validar filename para prevenir Path Traversal
            const filenameValidation = validateFilename(file.filename);
            if (!filenameValidation.isValid) {
                // Remover arquivo inválido usando throttling
                try {
                    const safePathResult = getSafeFilePath(file.filename, path_1.default.dirname(file.path));
                    if (safePathResult.path) {
                        await fileThrottler_1.fileThrottler.safeUnlink(clientIP, safePathResult.path);
                    }
                }
                catch (unlinkError) {
                    console.warn('Erro ao remover arquivo inválido:', unlinkError);
                }
                return res.status(400).json({
                    success: false,
                    message: `Arquivo rejeitado - ${filenameValidation.error}: ${file.originalname}`,
                    error: 'Invalid filename'
                });
            }
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
            // ✅ SEGURANÇA: Remover arquivo em caso de erro usando throttling
            if (req.file?.path) {
                try {
                    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
                    const safePathResult = getSafeFilePath(req.file.filename, path_1.default.dirname(req.file.path));
                    if (safePathResult.path) {
                        const fileExists = await fileThrottler_1.fileThrottler.safeStat(clientIP, safePathResult.path);
                        if (fileExists) {
                            await fileThrottler_1.fileThrottler.safeUnlink(clientIP, safePathResult.path);
                        }
                    }
                }
                catch (unlinkError) {
                    console.warn('Erro ao remover arquivo temporário:', unlinkError);
                }
            }
            // ✅ SEGURANÇA: Tratar erros de rate limiting
            if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações de arquivo. Tente novamente em alguns minutos.',
                    error: 'Rate limit exceeded'
                });
            }
            if (error instanceof Error && error.message.includes('Concurrent operation limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações simultâneas. Tente novamente em alguns segundos.',
                    error: 'Concurrent limit exceeded'
                });
            }
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
            // ✅ SEGURANÇA: Validar entrada
            if (!filename) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome do arquivo é obrigatório'
                });
            }
            // ✅ SEGURANÇA: Validar filename para prevenir Path Traversal
            const filenameValidation = validateFilename(filename);
            if (!filenameValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: filenameValidation.error,
                    error: 'Invalid filename'
                });
            }
            // ✅ SEGURANÇA: Construir path seguro
            const baseDir = path_1.default.join(__dirname, '../../uploads/maintenance_docs');
            const safePathResult = getSafeFilePath(filename, baseDir);
            if (safePathResult.error || !safePathResult.path) {
                return res.status(400).json({
                    success: false,
                    message: safePathResult.error || 'Caminho de arquivo inválido',
                    error: 'Path traversal attempt detected'
                });
            }
            const filePath = safePathResult.path;
            // ✅ SEGURANÇA: Obter IP do cliente para rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            // ✅ SEGURANÇA: Verificar se arquivo existe (async + throttling)
            const fileStats = await fileThrottler_1.fileThrottler.safeStat(clientIP, filePath);
            if (!fileStats) {
                return res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado'
                });
            }
            // ✅ SEGURANÇA: Deletar arquivo (async + throttling)
            await fileThrottler_1.fileThrottler.safeUnlink(clientIP, filePath);
            return res.status(200).json({
                success: true,
                message: 'Arquivo deletado com sucesso',
                data: { filename }
            });
        }
        catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            // ✅ SEGURANÇA: Tratar erros de rate limiting
            if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações de arquivo. Tente novamente em alguns minutos.',
                    error: 'Rate limit exceeded'
                });
            }
            if (error instanceof Error && error.message.includes('Concurrent operation limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações simultâneas. Tente novamente em alguns segundos.',
                    error: 'Concurrent limit exceeded'
                });
            }
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
            // ✅ SEGURANÇA: Obter IP do cliente para rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
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
            // ✅ SEGURANÇA: Remover arquivo em caso de erro usando throttling
            if (req.file?.path) {
                try {
                    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
                    // ✅ SEGURANÇA: Validar que o path está seguro antes da remoção
                    const safePath = getSafeFilePath(path_1.default.basename(req.file.path), path_1.default.dirname(req.file.path));
                    if (safePath.path) {
                        // ✅ SEGURANÇA: Verificar se arquivo existe antes de remover (async + throttling)
                        const fileExists = await fileThrottler_1.fileThrottler.safeStat(clientIP, safePath.path);
                        if (fileExists) {
                            // ✅ SEGURANÇA: Remover arquivo de forma segura (async + throttling)
                            await fileThrottler_1.fileThrottler.safeUnlink(clientIP, safePath.path);
                        }
                    }
                }
                catch (unlinkError) {
                    // ✅ SEGURANÇA: Log do erro mas não expor detalhes
                    console.warn('Erro ao remover arquivo temporário:', unlinkError);
                }
            }
            // ✅ SEGURANÇA: Tratar erros de rate limiting
            if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações de arquivo. Tente novamente em alguns minutos.',
                    error: 'Rate limit exceeded'
                });
            }
            if (error instanceof Error && error.message.includes('Concurrent operation limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações simultâneas. Tente novamente em alguns segundos.',
                    error: 'Concurrent limit exceeded'
                });
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
            // ✅ SEGURANÇA: Obter IP do cliente para rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            const uploadDir = path_1.default.join(__dirname, '../../uploads/maintenance_docs');
            // ✅ SEGURANÇA: Verificar se diretório existe (async + throttling)
            const dirStats = await fileThrottler_1.fileThrottler.safeStat(clientIP, uploadDir);
            if (!dirStats) {
                return res.status(200).json({
                    success: true,
                    data: {
                        files: [],
                        totalFiles: 0
                    }
                });
            }
            // ✅ SEGURANÇA: Ler diretório (async + throttling)
            const files = await fileThrottler_1.fileThrottler.safeReaddir(clientIP, uploadDir);
            const fileList = [];
            // Processar arquivos sequencialmente para evitar sobrecarga
            for (const filename of files) {
                try {
                    // ✅ SEGURANÇA: Validar filename para prevenir directory traversal
                    const filenameValidation = validateFilename(filename);
                    if (!filenameValidation.isValid) {
                        continue; // Pular arquivos com nomes suspeitos
                    }
                    // ✅ SEGURANÇA: Construir path seguro
                    const safePathResult = getSafeFilePath(filename, uploadDir);
                    if (safePathResult.error || !safePathResult.path) {
                        continue; // Pular paths inseguros
                    }
                    const filePath = safePathResult.path;
                    // ✅ SEGURANÇA: Obter estatísticas do arquivo (async + throttling)
                    const stats = await fileThrottler_1.fileThrottler.safeStat(clientIP, filePath);
                    if (stats) {
                        fileList.push({
                            filename,
                            url: `/uploads/maintenance_docs/${filename}`,
                            size: stats.size,
                            createdAt: stats.birthtime.toISOString(),
                            modifiedAt: stats.mtime.toISOString()
                        });
                    }
                }
                catch (fileError) {
                    // Continuar com próximo arquivo se houver erro
                    // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
                    console.warn('Erro ao processar arquivo:', filename, fileError);
                }
            }
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
            // ✅ SEGURANÇA: Tratar erros de rate limiting
            if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações de arquivo. Tente novamente em alguns minutos.',
                    error: 'Rate limit exceeded'
                });
            }
            if (error instanceof Error && error.message.includes('Concurrent operation limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas operações simultâneas. Tente novamente em alguns segundos.',
                    error: 'Concurrent limit exceeded'
                });
            }
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