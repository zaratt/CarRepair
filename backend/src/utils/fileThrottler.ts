import * as fs from 'fs';
import { promisify } from 'util';

// ✅ Conversão de operações síncronas para assíncronas
export const fsAsync = {
    unlink: promisify(fs.unlink),
    readFile: promisify(fs.readFile),
    stat: promisify(fs.stat),
    readdir: promisify(fs.readdir),
    mkdir: promisify(fs.mkdir),
    access: promisify(fs.access)
};

// ✅ Sistema de throttling para operações de arquivo
class FileOperationThrottler {
    private pendingOperations: Map<string, Promise<any>> = new Map();
    private operationCounts: Map<string, number> = new Map();
    private lastResetTime: number = Date.now();

    private readonly MAX_CONCURRENT_OPS = 5;
    private readonly MAX_OPS_PER_MINUTE = 30;
    private readonly RESET_INTERVAL = 60 * 1000; // 1 minuto

    /**
     * Throttle de operações por IP
     */
    public async throttleByIP(ip: string, operation: () => Promise<any>): Promise<any> {
        // Reset contador se passou do intervalo
        const now = Date.now();
        if (now - this.lastResetTime > this.RESET_INTERVAL) {
            this.operationCounts.clear();
            this.lastResetTime = now;
        }

        const currentCount = this.operationCounts.get(ip) || 0;

        // Verificar limite por minuto
        if (currentCount >= this.MAX_OPS_PER_MINUTE) {
            throw new Error(`Rate limit exceeded: ${this.MAX_OPS_PER_MINUTE} file operations per minute`);
        }

        // Verificar operações concorrentes
        const activeOps = Array.from(this.pendingOperations.keys())
            .filter(key => key.startsWith(`${ip}:`)).length;

        if (activeOps >= this.MAX_CONCURRENT_OPS) {
            throw new Error(`Concurrent operation limit exceeded: ${this.MAX_CONCURRENT_OPS} operations`);
        }

        // Executar operação com throttling
        const operationKey = `${ip}:${Date.now()}:${Math.random()}`;

        try {
            const operationPromise = operation();
            this.pendingOperations.set(operationKey, operationPromise);

            const result = await operationPromise;

            // Incrementar contador
            this.operationCounts.set(ip, currentCount + 1);

            return result;
        } finally {
            this.pendingOperations.delete(operationKey);
        }
    }

    /**
     * Operação segura de remoção de arquivo
     */
    public async safeUnlink(ip: string, filePath: string): Promise<void> {
        return this.throttleByIP(ip, async () => {
            try {
                await fsAsync.access(filePath, fs.constants.F_OK);
                await fsAsync.unlink(filePath);
            } catch (error) {
                // Arquivo já foi removido ou não existe, ignorar
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    throw error;
                }
            }
        });
    }

    /**
     * Operação segura de leitura de arquivo
     */
    public async safeReadFile(ip: string, filePath: string): Promise<Buffer> {
        return this.throttleByIP(ip, async () => {
            return fsAsync.readFile(filePath);
        });
    }

    /**
     * Operação segura de listagem de diretório
     */
    public async safeReaddir(ip: string, dirPath: string): Promise<string[]> {
        return this.throttleByIP(ip, async () => {
            try {
                return await fsAsync.readdir(dirPath);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    return [];
                }
                throw error;
            }
        });
    }

    /**
     * Operação segura de acesso a arquivo/diretório
     */
    public async safeAccess(ip: string, path: string): Promise<void> {
        return this.throttleByIP(ip, async () => {
            return fsAsync.access(path, fs.constants.F_OK);
        });
    }

    /**
     * Operação segura de criação de diretório
     */
    public async safeMkdir(ip: string, path: string, options?: fs.MakeDirectoryOptions): Promise<void> {
        return this.throttleByIP(ip, async () => {
            return fsAsync.mkdir(path, options) as Promise<void>;
        });
    }

    /**
     * Operação segura de stat
     */
    public async safeStat(ip: string, filePath: string): Promise<fs.Stats | null> {
        return this.throttleByIP(ip, async () => {
            try {
                return await fsAsync.stat(filePath);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    return null;
                }
                throw error;
            }
        });
    }

    /**
     * Obter estatísticas do throttler
     */
    public getStats(): {
        totalPendingOps: number;
        operationsByIP: Record<string, number>;
        activeConnections: number;
    } {
        const operationsByIP: Record<string, number> = {};
        this.operationCounts.forEach((count, ip) => {
            operationsByIP[ip] = count;
        });

        return {
            totalPendingOps: this.pendingOperations.size,
            operationsByIP,
            activeConnections: new Set(
                Array.from(this.pendingOperations.keys()).map(key => key.split(':')[0])
            ).size
        };
    }
}

// ✅ Instância singleton do throttler
export const fileThrottler = new FileOperationThrottler();

// ✅ Rate limiting específico para operações de arquivo
export const fileOperationRateLimit = (maxOpsPerMinute: number = 20) => {
    const ipOperations = new Map<string, { count: number; resetTime: number }>();

    return (req: any, res: any, next: any) => {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const resetInterval = 60 * 1000; // 1 minuto

        let ipData = ipOperations.get(ip);

        // Reset se passou do intervalo
        if (!ipData || now - ipData.resetTime > resetInterval) {
            ipData = { count: 0, resetTime: now };
        }

        // Verificar limite
        if (ipData.count >= maxOpsPerMinute) {
            return res.status(429).json({
                success: false,
                message: `File operation rate limit exceeded. Max ${maxOpsPerMinute} operations per minute.`,
                retryAfter: Math.ceil((resetInterval - (now - ipData.resetTime)) / 1000)
            });
        }

        // Incrementar contador
        ipData.count++;
        ipOperations.set(ip, ipData);

        // Adicionar throttler ao request
        req.fileThrottler = fileThrottler;
        req.userIP = ip;

        next();
    };
};