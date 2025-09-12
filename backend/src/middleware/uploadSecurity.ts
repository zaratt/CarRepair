import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { logSecurityEvent, SecurityEventType } from './securityLogger';

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
const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.mimetype.toLowerCase());
};

// ✅ Função para validar extensão de arquivo
const validateFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
};

// ✅ Função para gerar nome seguro do arquivo
const generateSafeFilename = (originalname: string): string => {
    const ext = path.extname(originalname);
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(16).toString('hex');
    return `${timestamp}_${randomHash}${ext}`;
};

// ✅ Função para verificar assinatura de arquivo (magic numbers)
const validateFileSignature = (buffer: Buffer, mimetype: string): boolean => {
    const signatures: { [key: string]: Buffer[] } = {
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
    if (!fileSignatures) return true; // Se não temos assinatura, permitir

    return fileSignatures.some(signature =>
        buffer.subarray(0, signature.length).equals(signature)
    );
};

// ✅ Configuração do storage
const createStorage = (uploadPath: string) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            // Criar diretório se não existir
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const safeFilename = generateSafeFilename(file.originalname);
            cb(null, safeFilename);
        }
    });
};

// ✅ Configuração de filtro de arquivos
const createFileFilter = (fileType: 'images' | 'documents') => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedMimes = ALLOWED_MIME_TYPES[fileType];
        const allowedExts = ALLOWED_EXTENSIONS[fileType];

        // Validar MIME type
        if (!validateFileType(file, allowedMimes)) {
            logSecurityEvent({
                type: SecurityEventType.MALICIOUS_UPLOAD,
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
            logSecurityEvent({
                type: SecurityEventType.MALICIOUS_UPLOAD,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                endpoint: req.originalUrl,
                method: req.method,
                payload: {
                    filename: file.originalname,
                    extension: path.extname(file.originalname),
                    reason: 'Invalid file extension'
                },
                success: false,
                message: `Upload rejeitado - Extensão inválida: ${path.extname(file.originalname)}`,
                risk_level: 'MEDIUM'
            });

            return cb(new Error(`Extensão de arquivo não permitida: ${path.extname(file.originalname)}`));
        }

        cb(null, true);
    };
};

// ✅ Middleware para validação adicional após upload
export const validateUploadedFile = (fileType: 'images' | 'documents') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            return next();
        }

        try {
            const file = req.file;
            const filePath = file.path;
            const sizeLimit = SIZE_LIMITS[fileType];

            // Verificar tamanho
            if (file.size > sizeLimit) {
                // Remover arquivo
                fs.unlinkSync(filePath);

                logSecurityEvent({
                    type: SecurityEventType.MALICIOUS_UPLOAD,
                    ip: req.ip || 'unknown',
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

            // Ler buffer do arquivo para validação de assinatura
            const fileBuffer = fs.readFileSync(filePath);

            // Validar assinatura do arquivo
            if (!validateFileSignature(fileBuffer, file.mimetype)) {
                // Remover arquivo
                fs.unlinkSync(filePath);

                logSecurityEvent({
                    type: SecurityEventType.MALICIOUS_UPLOAD,
                    ip: req.ip || 'unknown',
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
                /\.\./,  // Directory traversal
                /[<>:"|?*]/,  // Windows invalid chars
                /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
            ];

            if (maliciousPatterns.some(pattern => pattern.test(file.originalname))) {
                // Remover arquivo
                fs.unlinkSync(filePath);

                logSecurityEvent({
                    type: SecurityEventType.MALICIOUS_UPLOAD,
                    ip: req.ip || 'unknown',
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
            logSecurityEvent({
                type: SecurityEventType.FILE_UPLOAD,
                ip: req.ip || 'unknown',
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

        } catch (error) {
            // Remover arquivo em caso de erro
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            logSecurityEvent({
                type: SecurityEventType.MALICIOUS_UPLOAD,
                ip: req.ip || 'unknown',
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

// ✅ Configurações de upload para imagens de veículos
export const uploadVehicleImage = multer({
    storage: createStorage(path.join(process.cwd(), 'uploads', 'vehicle_images')),
    fileFilter: createFileFilter('images'),
    limits: {
        fileSize: SIZE_LIMITS.images,
        files: 1
    }
});

// ✅ Configurações de upload para documentos de manutenção
export const uploadMaintenanceDoc = multer({
    storage: createStorage(path.join(process.cwd(), 'uploads', 'maintenance_docs')),
    fileFilter: createFileFilter('documents'),
    limits: {
        fileSize: SIZE_LIMITS.documents,
        files: 1
    }
});

// ✅ Middleware para limpeza de arquivos antigos
export const cleanupOldFiles = (directory: string, maxAgeHours: number = 24) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;

            if (fs.existsSync(directory)) {
                const files = fs.readdirSync(directory);

                files.forEach(file => {
                    const filePath = path.join(directory, file);
                    const stats = fs.statSync(filePath);

                    if (now - stats.mtime.getTime() > maxAge) {
                        fs.unlinkSync(filePath);

                        logSecurityEvent({
                            type: SecurityEventType.FILE_UPLOAD,
                            ip: 'system',
                            userAgent: 'cleanup-service',
                            endpoint: 'cleanup',
                            method: 'DELETE',
                            payload: { filename: file, age: now - stats.mtime.getTime() },
                            success: true,
                            message: `Arquivo antigo removido: ${file}`,
                            risk_level: 'LOW'
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Erro na limpeza de arquivos:', error);
        }

        next();
    };
};