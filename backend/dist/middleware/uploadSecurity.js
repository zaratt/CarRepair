"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileOperationLimit = exports.cleanupOldFiles = exports.uploadMaintenanceDoc = exports.uploadVehicleImage = exports.validateUploadedFile = void 0;
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fileThrottler_1 = require("../utils/fileThrottler");
const securityLogger_1 = require("./securityLogger");
// ✅ Tipos de arquivo permitidos
const ALLOWED_MIME_TYPES = {
    images: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ],
    documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
};
// ✅ Extensões de arquivo permitidas
const ALLOWED_EXTENSIONS = {
    images: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']
};
// ✅ Limites de tamanho
const SIZE_LIMITS = {
    images: 10 * 1024 * 1024, // 10MB
    documents: 25 * 1024 * 1024 // 25MB
};
// ✅ Função para validar tipo de arquivo
const validateFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.mimetype.toLowerCase());
};
// ✅ Função para validar extensão de arquivo
const validateFileExtension = (filename, allowedExtensions) => {
    const ext = path_1.default.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
};
// ✅ Função para gerar nome seguro do arquivo
const generateSafeFilename = (originalname) => {
    const ext = path_1.default.extname(originalname);
    const timestamp = Date.now();
    const randomHash = crypto_1.default.randomBytes(16).toString('hex');
    return `${timestamp}_${randomHash}${ext}`;
};
// ✅ Função para verificar assinatura de arquivo (magic numbers)
const validateFileSignature = (buffer, mimetype) => {
    const signatures = {
        'image/jpeg': [
            Buffer.from([0xFF, 0xD8, 0xFF]),
        ],
        'image/png': [
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        ],
        'image/gif': [
            Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]),
            Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
        ],
        'image/webp': [
            Buffer.from([0x52, 0x49, 0x46, 0x46]),
        ],
        'application/pdf': [
            Buffer.from([0x25, 0x50, 0x44, 0x46]),
        ],
    };
    const fileSignatures = signatures[mimetype];
    if (!fileSignatures)
        return true; // Se não temos assinatura, permitir
    return fileSignatures.some(signature => buffer.subarray(0, signature.length).equals(signature));
};
// ✅ Configuração do storage com throttling
const createStorage = (uploadPath) => {
    return multer_1.default.diskStorage({
        destination: async (req, file, cb) => {
            try {
                const userIP = req.ip || 'unknown';
                // ✅ Verificar se diretório existe de forma assíncrona com throttling
                await fileThrottler_1.fileThrottler.safeAccess(userIP, uploadPath);
                cb(null, uploadPath);
            }
            catch (error) {
                try {
                    // ✅ Criar diretório se não existir com throttling
                    const userIP = req.ip || 'unknown';
                    await fileThrottler_1.fileThrottler.safeMkdir(userIP, uploadPath, { recursive: true });
                    cb(null, uploadPath);
                }
                catch (mkdirError) {
                    cb(mkdirError instanceof Error ? mkdirError : new Error('Erro ao criar diretório'), '');
                }
            }
        },
        filename: (req, file, cb) => {
            const safeFilename = generateSafeFilename(file.originalname);
            cb(null, safeFilename);
        }
    });
}; // ✅ Configuração de filtro de arquivos
const createFileFilter = (fileType) => {
    return (req, file, cb) => {
        const allowedMimes = ALLOWED_MIME_TYPES[fileType];
        const allowedExts = ALLOWED_EXTENSIONS[fileType];
        // Validar MIME type
        if (!validateFileType(file, allowedMimes)) {
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                payload: {
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    reason: 'Invalid MIME type'
                },
                success: false,
                message: `Upload rejeitado - MIME type inválido: ${file.mimetype}`,
                risk_level: 'MEDIUM'
            });
            return cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
        }
        // Validar extensão
        if (!validateFileExtension(file.originalname, allowedExts)) {
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                payload: {
                    filename: file.originalname,
                    extension: path_1.default.extname(file.originalname),
                    reason: 'Invalid file extension'
                },
                success: false,
                message: `Upload rejeitado - Extensão inválida: ${path_1.default.extname(file.originalname)}`,
                risk_level: 'MEDIUM'
            });
            return cb(new Error(`Extensão de arquivo não permitida: ${path_1.default.extname(file.originalname)}`));
        }
        cb(null, true);
    };
};
// ✅ Middleware para validação adicional após upload com throttling
const pathIsInside = (parent, child) => {
    const relative = path_1.default.relative(parent, child);
    return !!relative && !relative.startsWith('..') && !path_1.default.isAbsolute(relative);
};

const validateUploadedFile = (fileType) => {
    return async (req, res, next) => {
        if (!req.file) {
            return next();
        }
        const userIP = req.ip || 'unknown';
        try {
            const file = req.file;
            const filePath = file.path;
            const sizeLimit = SIZE_LIMITS[fileType];

            // Only allow file operations inside the intended upload directory
            const allowedDir = fileType === 'images'
                ? path_1.default.join(process.cwd(), 'uploads', 'vehicle_images')
                : path_1.default.join(process.cwd(), 'uploads', 'maintenance_docs');
            if (!pathIsInside(allowedDir, filePath)) {
                (0, securityLogger_1.logSecurityEvent)({
                    type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                    ip: userIP,
                    userAgent: req.get('User-Agent') || 'unknown',
                    endpoint: req.originalUrl,
                    method: req.method,
                    payload: {
                        filename: file.originalname,
                        reason: 'Path traversal detected'
                    },
                    success: false,
                    message: `Upload rejeitado - Path traversal detectado: ${filePath}`,
                    risk_level: 'HIGH'
                });
                return res.status(400).json({
                    success: false,
                    message: 'Caminho de arquivo inválido detectado'
                });
            }

            // Verificar tamanho
            if (file.size > sizeLimit) {
                // Remover arquivo com throttling
                await fileThrottler_1.fileThrottler.safeUnlink(userIP, filePath);
                (0, securityLogger_1.logSecurityEvent)({
                    type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                    ip: userIP,
                    userAgent: req.get('User-Agent') || 'unknown',
                    endpoint: req.originalUrl,
                    method: req.method,
                    payload: {
                        filename: file.originalname,
                        size: file.size,
                        limit: sizeLimit,
                        reason: 'File too large'
                    },
                    success: false,
                    message: `Upload rejeitado - Arquivo muito grande: ${file.size} bytes`,
                    risk_level: 'MEDIUM'
                });
                return res.status(413).json({
                    success: false,
                    message: `Arquivo muito grande. Limite: ${Math.round(sizeLimit / 1024 / 1024)}MB`
                });
            }
            // Ler buffer do arquivo com throttling
            const fileBuffer = await fileThrottler_1.fileThrottler.safeReadFile(userIP, filePath);
            // Validar assinatura do arquivo
            if (!validateFileSignature(fileBuffer, file.mimetype)) {
                // Remover arquivo com throttling
                await fileThrottler_1.fileThrottler.safeUnlink(userIP, filePath);
                (0, securityLogger_1.logSecurityEvent)({
                    type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                    ip: userIP,
                    userAgent: req.get('User-Agent') || 'unknown',
                    endpoint: req.originalUrl,
                    method: req.method,
                    payload: {
                        filename: file.originalname,
                        mimetype: file.mimetype,
                        reason: 'Invalid file signature'
                    },
                    success: false,
                    message: `Upload rejeitado - Assinatura de arquivo inválida`,
                    risk_level: 'HIGH'
                });
                return res.status(400).json({
                    success: false,
                    message: 'Arquivo corrompido ou tipo inválido'
                });
            }
            // Verificar nomes de arquivo maliciosos
            const maliciousPatterns = [
                /\.\./, // Directory traversal
                /[<>:"|?*]/, // Windows invalid chars
                /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
            ];
            if (maliciousPatterns.some(pattern => pattern.test(file.originalname))) {
                // Remover arquivo com throttling
                await fileThrottler_1.fileThrottler.safeUnlink(userIP, filePath);
                (0, securityLogger_1.logSecurityEvent)({
                    type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                    ip: userIP,
                    userAgent: req.get('User-Agent') || 'unknown',
                    endpoint: req.originalUrl,
                    method: req.method,
                    payload: {
                        filename: file.originalname,
                        reason: 'Malicious filename pattern'
                    },
                    success: false,
                    message: `Upload rejeitado - Nome de arquivo malicioso: ${file.originalname}`,
                    risk_level: 'HIGH'
                });
                return res.status(400).json({
                    success: false,
                    message: 'Nome de arquivo inválido'
                });
            }
            // Log upload bem-sucedido
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.FILE_UPLOAD,
                ip: userIP,
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                payload: {
                    filename: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    savedAs: file.filename
                },
                success: true,
                message: `Upload bem-sucedido: ${file.originalname}`,
                risk_level: 'LOW'
            });
            next();
        }
        catch (error) {
            // Remover arquivo em caso de erro com throttling
            if (req.file?.path) {
                try {
                    // Only allow unlink if path is inside allowed directory
                    const allowedDir = fileType === 'images'
                        ? path_1.default.join(process.cwd(), 'uploads', 'vehicle_images')
                        : path_1.default.join(process.cwd(), 'uploads', 'maintenance_docs');
                    if (pathIsInside(allowedDir, req.file.path)) {
                        await fileThrottler_1.fileThrottler.safeUnlink(userIP, req.file.path);
                    }
                }
                catch (unlinkError) {
                    // Ignorar erro de remoção
                }
            }
            (0, securityLogger_1.logSecurityEvent)({
                type: securityLogger_1.SecurityEventType.MALICIOUS_UPLOAD,
                ip: userIP,
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                payload: {
                    filename: req.file?.originalname,
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                success: false,
                message: `Erro na validação de upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
                risk_level: 'MEDIUM'
            });
            res.status(500).json({
                success: false,
                message: 'Erro interno na validação do arquivo'
            });
        }
    };
};
exports.validateUploadedFile = validateUploadedFile;
// ✅ Configurações de upload para imagens de veículos
exports.uploadVehicleImage = (0, multer_1.default)({
    storage: createStorage(path_1.default.join(process.cwd(), 'uploads', 'vehicle_images')),
    fileFilter: createFileFilter('images'),
    limits: {
        fileSize: SIZE_LIMITS.images,
        files: 1
    }
});
// ✅ Configurações de upload para documentos de manutenção
exports.uploadMaintenanceDoc = (0, multer_1.default)({
    storage: createStorage(path_1.default.join(process.cwd(), 'uploads', 'maintenance_docs')),
    fileFilter: createFileFilter('documents'),
    limits: {
        fileSize: SIZE_LIMITS.documents,
        files: 1
    }
});
// ✅ Middleware para limpeza de arquivos antigos com throttling
const cleanupOldFiles = (directory, maxAgeHours = 24) => {
    return async (req, res, next) => {
        try {
            const userIP = req.ip || 'system';
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;
            // ✅ Verificar se diretório existe com throttling
            await fileThrottler_1.fileThrottler.safeAccess(userIP, directory);
            // ✅ Ler diretório com throttling
            const files = await fileThrottler_1.fileThrottler.safeReaddir(userIP, directory);
            // Processar arquivos sequencialmente para evitar sobrecarga
            for (const file of files) {
                const filePath = path_1.default.join(directory, file);
                try {
                    // ✅ Verificar estatísticas do arquivo com throttling
                    const stats = await fileThrottler_1.fileThrottler.safeStat(userIP, filePath);
                    if (stats && now - stats.mtime.getTime() > maxAge) {
                        // ✅ Remover arquivo antigo com throttling
                        await fileThrottler_1.fileThrottler.safeUnlink(userIP, filePath);
                        (0, securityLogger_1.logSecurityEvent)({
                            type: securityLogger_1.SecurityEventType.FILE_UPLOAD,
                            ip: userIP,
                            userAgent: 'cleanup-service',
                            endpoint: 'cleanup',
                            method: 'DELETE',
                            payload: { filename: file, age: now - stats.mtime.getTime() },
                            success: true,
                            message: `Arquivo antigo removido: ${file}`,
                            risk_level: 'LOW'
                        });
                    }
                }
                catch (fileError) {
                    // Continuar com o próximo arquivo se houver erro
                    console.warn(`Erro ao processar arquivo ${file}:`, fileError);
                }
            }
        }
        catch (error) {
            // Se o diretório não existir ou houver outro erro, apenas log
            console.info('Diretório de limpeza não encontrado ou inacessível:', directory);
        }
        next();
    };
};
exports.cleanupOldFiles = cleanupOldFiles;
// ✅ Middleware de rate limiting para operações de arquivo
exports.fileOperationLimit = (0, fileThrottler_1.fileOperationRateLimit)();
//# sourceMappingURL=uploadSecurity.js.map