import * as fs from 'fs';
export declare const fsAsync: {
    unlink: typeof fs.unlink.__promisify__;
    readFile: typeof fs.readFile.__promisify__;
    stat: typeof fs.stat.__promisify__;
    readdir: typeof fs.readdir.__promisify__;
    mkdir: typeof fs.mkdir.__promisify__;
    access: typeof fs.access.__promisify__;
};
declare class FileOperationThrottler {
    private pendingOperations;
    private operationCounts;
    private lastResetTime;
    private readonly MAX_CONCURRENT_OPS;
    private readonly MAX_OPS_PER_MINUTE;
    private readonly RESET_INTERVAL;
    /**
     * Throttle de operações por IP
     */
    throttleByIP(ip: string, operation: () => Promise<any>): Promise<any>;
    /**
     * Operação segura de remoção de arquivo
     */
    safeUnlink(ip: string, filePath: string): Promise<void>;
    /**
     * Operação segura de leitura de arquivo
     */
    safeReadFile(ip: string, filePath: string): Promise<Buffer>;
    /**
     * Operação segura de listagem de diretório
     */
    safeReaddir(ip: string, dirPath: string): Promise<string[]>;
    /**
     * Operação segura de acesso a arquivo/diretório
     */
    safeAccess(ip: string, path: string): Promise<void>;
    /**
     * Operação segura de criação de diretório
     */
    safeMkdir(ip: string, path: string, options?: fs.MakeDirectoryOptions): Promise<void>;
    /**
     * Operação segura de stat
     */
    safeStat(ip: string, filePath: string): Promise<fs.Stats | null>;
    /**
     * Obter estatísticas do throttler
     */
    getStats(): {
        totalPendingOps: number;
        operationsByIP: Record<string, number>;
        activeConnections: number;
    };
}
export declare const fileThrottler: FileOperationThrottler;
export declare const fileOperationRateLimit: (maxOpsPerMinute?: number) => (req: any, res: any, next: any) => any;
export {};
//# sourceMappingURL=fileThrottler.d.ts.map