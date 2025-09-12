import { Request, Response } from 'express';
import multer from 'multer';
export declare const uploadMiddleware: multer.Multer;
export declare class FileUploadController {
    /**
     * Upload de múltiplos arquivos de manutenção
     * POST /api/upload/maintenance-documents
     */
    static uploadMaintenanceDocuments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Upload de arquivo único
     * POST /api/upload/single
     */
    static uploadSingleFile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Deletar arquivo
     * DELETE /api/upload/file/:filename
     */
    static deleteFile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Upload de imagem de veículo
     * POST /api/upload/vehicle-image
     */
    static uploadVehicleImage(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Listar arquivos disponíveis
     * GET /api/upload/files
     */
    static listFiles(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
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
//# sourceMappingURL=fileUploadController.d.ts.map