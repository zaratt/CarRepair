"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileOperationRateLimit = exports.fileThrottler = exports.fsAsync = void 0;
const fs = __importStar(require("fs"));
const util_1 = require("util");
// ✅ Conversão de operações síncronas para assíncronas
exports.fsAsync = {
    unlink: (0, util_1.promisify)(fs.unlink),
    readFile: (0, util_1.promisify)(fs.readFile),
    stat: (0, util_1.promisify)(fs.stat),
    readdir: (0, util_1.promisify)(fs.readdir),
    mkdir: (0, util_1.promisify)(fs.mkdir),
    access: (0, util_1.promisify)(fs.access)
};
// ✅ Sistema de throttling para operações de arquivo
class FileOperationThrottler {
    pendingOperations = new Map();
    operationCounts = new Map();
    lastResetTime = Date.now();
    MAX_CONCURRENT_OPS = 5;
    MAX_OPS_PER_MINUTE = 30;
    RESET_INTERVAL = 60 * 1000; // 1 minuto
    /**
     * Throttle de operações por IP
     */
    async throttleByIP(ip, operation) {
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
        }
        finally {
            this.pendingOperations.delete(operationKey);
        }
    }
    /**
     * Operação segura de remoção de arquivo
     */
    async safeUnlink(ip, filePath) {
        return this.throttleByIP(ip, async () => {
            try {
                await exports.fsAsync.access(filePath, fs.constants.F_OK);
                await exports.fsAsync.unlink(filePath);
            }
            catch (error) {
                // Arquivo já foi removido ou não existe, ignorar
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        });
    }
    /**
     * Operação segura de leitura de arquivo
     */
    async safeReadFile(ip, filePath) {
        return this.throttleByIP(ip, async () => {
            return exports.fsAsync.readFile(filePath);
        });
    }
    /**
     * Operação segura de listagem de diretório
     */
    async safeReaddir(ip, dirPath) {
        return this.throttleByIP(ip, async () => {
            try {
                return await exports.fsAsync.readdir(dirPath);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    return [];
                }
                throw error;
            }
        });
    }
    /**
     * Operação segura de acesso a arquivo/diretório
     */
    async safeAccess(ip, path) {
        return this.throttleByIP(ip, async () => {
            return exports.fsAsync.access(path, fs.constants.F_OK);
        });
    }
    /**
     * Operação segura de criação de diretório
     */
    async safeMkdir(ip, path, options) {
        return this.throttleByIP(ip, async () => {
            await exports.fsAsync.mkdir(path, options);
        });
    }
    /**
     * Operação segura de stat
     */
    async safeStat(ip, filePath) {
        return this.throttleByIP(ip, async () => {
            try {
                return await exports.fsAsync.stat(filePath);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    return null;
                }
                throw error;
            }
        });
    }
    /**
     * Obter estatísticas do throttler
     */
    getStats() {
        const operationsByIP = {};
        this.operationCounts.forEach((count, ip) => {
            operationsByIP[ip] = count;
        });
        return {
            totalPendingOps: this.pendingOperations.size,
            operationsByIP,
            activeConnections: new Set(Array.from(this.pendingOperations.keys()).map(key => key.split(':')[0])).size
        };
    }
}
// ✅ Instância singleton do throttler
exports.fileThrottler = new FileOperationThrottler();
// ✅ Rate limiting específico para operações de arquivo
const fileOperationRateLimit = (maxOpsPerMinute = 20) => {
    const ipOperations = new Map();
    return (req, res, next) => {
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
        req.fileThrottler = exports.fileThrottler;
        req.userIP = ip;
        next();
    };
};
exports.fileOperationRateLimit = fileOperationRateLimit;
//# sourceMappingURL=fileThrottler.js.map