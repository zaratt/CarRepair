// Adicionar import do React se não estiver presente
import { useState } from 'react';

// ✅ Configuração da API (usando a mesma do projeto)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://automazo-production.up.railway.app/api';

// ✅ Tipos para o serviço de upload
export interface UploadedFile {
    id: string;
    originalName: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    data?: {
        files?: UploadedFile[];
        totalFiles?: number;
        totalSize?: number;
    } | UploadedFile;
    error?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface UploadOptions {
    onProgress?: (progress: UploadProgress) => void;
    timeout?: number;
}

// ✅ Serviço de upload de arquivos
export class UploadService {
    private static readonly BASE_URL = `${API_BASE_URL}/upload`;

    /**
     * Upload de múltiplos documentos de manutenção
     */
    static async uploadMaintenanceDocuments(
        files: File[],
        options: UploadOptions = {}
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();

            // Adicionar todos os arquivos ao FormData
            files.forEach((file, index) => {
                formData.append('documents', file);
            });

            // Configurar XMLHttpRequest para tracking de progresso
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Configurar timeout se especificado
                if (options.timeout) {
                    xhr.timeout = options.timeout;
                }

                // Tracking de progresso do upload
                if (options.onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100)
                            };
                            options.onProgress!(progress);
                        }
                    });
                }

                // Quando o upload completa
                xhr.addEventListener('load', () => {
                    try {
                        const response: UploadResponse = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(response.message || 'Erro no upload'));
                        }
                    } catch (error) {
                        reject(new Error('Erro ao processar resposta do servidor'));
                    }
                });

                // Tratamento de erros
                xhr.addEventListener('error', () => {
                    reject(new Error('Erro de rede durante o upload'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Timeout no upload. Tente novamente.'));
                });

                // Iniciar upload
                xhr.open('POST', `${this.BASE_URL}/maintenance-documents`);
                xhr.send(formData);
            });

        } catch (error) {
            console.error('Erro no upload de documentos:', error);
            throw error;
        }
    }

    /**
     * Upload de arquivo único
     */
    static async uploadSingleFile(
        file: File,
        options: UploadOptions = {}
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append('document', file);

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                if (options.timeout) {
                    xhr.timeout = options.timeout;
                }

                if (options.onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100)
                            };
                            options.onProgress!(progress);
                        }
                    });
                }

                xhr.addEventListener('load', () => {
                    try {
                        const response: UploadResponse = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(response.message || 'Erro no upload'));
                        }
                    } catch (error) {
                        reject(new Error('Erro ao processar resposta do servidor'));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Erro de rede durante o upload'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Timeout no upload. Tente novamente.'));
                });

                xhr.open('POST', `${this.BASE_URL}/single`);
                xhr.send(formData);
            });

        } catch (error) {
            console.error('Erro no upload de arquivo:', error);
            throw error;
        }
    }

    /**
     * Deletar arquivo do servidor
     */
    static async deleteFile(fileName: string): Promise<UploadResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/file/${fileName}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: UploadResponse = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao deletar arquivo');
            }

            return result;

        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            throw error;
        }
    }

    /**
     * Listar arquivos disponíveis
     */
    static async listFiles(): Promise<UploadResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/files`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result: UploadResponse = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao listar arquivos');
            }

            return result;

        } catch (error) {
            console.error('Erro ao listar arquivos:', error);
            throw error;
        }
    }

    /**
     * Validar arquivo antes do upload
     */
    static validateFile(file: File): { isValid: boolean; error?: string } {
        // Verificar tipos permitidos
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'application/pdf'
        ];

        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: JPEG, PNG, WebP, PDF`
            };
        }

        // Verificar tamanho máximo (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Tamanho máximo: 10MB`
            };
        }

        return { isValid: true };
    }

    /**
     * Converter File para formato esperado pelo DocumentUploader
     */
    static async fileToDocumentFile(file: File, category: string = 'outros'): Promise<any> {
        return {
            id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            uri: URL.createObjectURL(file), // URI temporária para preview
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'pdf',
            category: category,
            size: file.size,
            file: file, // Manter referência ao arquivo original para upload
        };
    }

    /**
     * Obter URL completa do arquivo
     */
    static getFileUrl(relativePath: string): string {
        if (relativePath.startsWith('http')) {
            return relativePath; // URL já é absoluta
        }

        // Remove leading slash se presente
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return `${API_BASE_URL.replace('/api', '')}/${cleanPath}`;
    }
}

// ✅ Hook personalizado para upload com estado
export const useUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
    const [error, setError] = useState<string | null>(null);

    const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
        setUploading(true);
        setError(null);
        setProgress({ loaded: 0, total: 0, percentage: 0 });

        try {
            const response = await UploadService.uploadMaintenanceDocuments(files, {
                onProgress: setProgress,
                timeout: 30000 // 30 segundos
            });

            if (response.success && response.data && 'files' in response.data) {
                return response.data.files || [];
            } else {
                throw new Error(response.message || 'Erro no upload');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no upload';
            setError(errorMessage);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const uploadSingleFile = async (file: File): Promise<UploadedFile> => {
        setUploading(true);
        setError(null);
        setProgress({ loaded: 0, total: 0, percentage: 0 });

        try {
            const response = await UploadService.uploadSingleFile(file, {
                onProgress: setProgress,
                timeout: 30000
            });

            if (response.success && response.data && !('files' in response.data)) {
                return response.data as UploadedFile;
            } else {
                throw new Error(response.message || 'Erro no upload');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no upload';
            setError(errorMessage);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        progress,
        error,
        uploadFiles,
        uploadSingleFile,
        validateFile: UploadService.validateFile,
        clearError: () => setError(null)
    };
};