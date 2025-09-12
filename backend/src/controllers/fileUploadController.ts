import { Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// ✅ Configuração do multer para armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/maintenance_docs');

        // Criar diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gerar nome único: timestamp + random + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `maintenance_${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

// ✅ Filtro de arquivos permitidos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Tipos aceitos: JPEG, PNG, WebP, PDF`));
    }
};

// ✅ Configuração do middleware multer
export const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo por arquivo
        files: 10 // Máximo 10 arquivos por vez
    }
});

// ✅ Controller para upload de arquivos
export class FileUploadController {

    /**
     * Upload de múltiplos arquivos de manutenção
     * POST /api/upload/maintenance-documents
     */
    static async uploadMaintenanceDocuments(req: Request, res: Response) {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo foi enviado'
                });
            }

            const files = req.files as Express.Multer.File[];
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

        } catch (error) {
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
    static async uploadSingleFile(req: Request, res: Response) {
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

        } catch (error) {
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
    static async deleteFile(req: Request, res: Response) {
        try {
            const { filename } = req.params;

            if (!filename) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome do arquivo é obrigatório'
                });
            }

            const filePath = path.join(__dirname, '../../uploads/maintenance_docs', filename);

            // Verificar se arquivo existe
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado'
                });
            }

            // Deletar arquivo
            fs.unlinkSync(filePath);

            return res.status(200).json({
                success: true,
                message: 'Arquivo deletado com sucesso',
                data: { filename }
            });

        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);

            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao deletar arquivo',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }

    /**
     * Listar arquivos disponíveis
     * GET /api/upload/files
     */
    static async listFiles(req: Request, res: Response) {
        try {
            const uploadDir = path.join(__dirname, '../../uploads/maintenance_docs');

            if (!fs.existsSync(uploadDir)) {
                return res.status(200).json({
                    success: true,
                    data: {
                        files: [],
                        totalFiles: 0
                    }
                });
            }

            const files = fs.readdirSync(uploadDir);
            const fileList = files.map(filename => {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);

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

        } catch (error) {
            console.error('Erro ao listar arquivos:', error);

            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao listar arquivos',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}

// ✅ Tipos para TypeScript
export interface UploadedFile {
    id: string;
    originalName: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
}

export interface FileUploadResponse {
    success: boolean;
    message: string;
    data?: {
        files?: UploadedFile[];
        totalFiles?: number;
        totalSize?: number;
    } | UploadedFile;
    error?: string;
}