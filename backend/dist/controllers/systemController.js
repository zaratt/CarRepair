"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemEndpoints = exports.systemEndpointsRateLimit = exports.getSystemHealth = exports.systemHealthRateLimit = exports.getSystemStats = exports.systemStatsRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fs_1 = __importDefault(require("fs")); // ✅ Apenas para existsSync
const promises_1 = __importDefault(require("fs/promises")); // ✅ Usar fs assíncrono para evitar bloqueio
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
// ✅ SEGURANÇA: Rate limiting para operações de sistema (CWE-770 Prevention)
exports.systemStatsRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // Máximo 10 requests por minuto por IP
    message: {
        success: false,
        message: 'Muitas solicitações de estatísticas do sistema. Tente novamente em 1 minuto.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// ✅ SEGURANÇA: Cache para uploads stats para evitar operações FS repetidas
let uploadStatsCache = null;
let uploadStatsCacheTime = 0;
const UPLOAD_STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
/**
 * ✅ SEGURANÇA: Função segura para obter estatísticas de upload (CWE-770 Prevention)
 * Implementa cache, timeout e operações assíncronas para evitar DoS via operações de sistema de arquivos
 */
async function getSafeUploadStats() {
    const now = Date.now();
    // ✅ Usar cache se disponível e válido
    if (uploadStatsCache && (now - uploadStatsCacheTime) < UPLOAD_STATS_CACHE_TTL) {
        return { ...uploadStatsCache, cached: true };
    }
    try {
        const uploadPath = config_1.config.upload.path;
        // ✅ SEGURANÇA: Verificar se o diretório existe antes de tentar ler
        if (!fs_1.default.existsSync(uploadPath)) {
            const result = { error: 'Upload directory not found', totalFiles: 0, totalSizeBytes: 0, totalSizeMB: 0 };
            uploadStatsCache = result;
            uploadStatsCacheTime = now;
            return result;
        }
        // ✅ SEGURANÇA: Implementar timeout rigoroso com Promise.race
        const uploadStatsPromise = getUploadStatsWithTimeout(uploadPath);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload stats timeout')), 3000); // 3 segundos timeout
        });
        const result = await Promise.race([uploadStatsPromise, timeoutPromise]);
        // ✅ Cachear resultado
        uploadStatsCache = result;
        uploadStatsCacheTime = now;
        return result;
    }
    catch (error) {
        const result = {
            error: 'Unable to read upload directory',
            reason: error instanceof Error ? error.message : 'Unknown error',
            totalFiles: 0,
            totalSizeBytes: 0,
            totalSizeMB: 0
        };
        uploadStatsCache = result;
        uploadStatsCacheTime = now;
        return result;
    }
}
/**
 * ✅ SEGURANÇA: Implementação assíncrona com limite de recursos (CWE-770 Prevention)
 */
async function getUploadStatsWithTimeout(uploadPath) {
    // ✅ SEGURANÇA: Usar operações assíncronas para não bloquear o event loop
    const files = await promises_1.default.readdir(uploadPath);
    // ✅ SEGURANÇA: Limitar número máximo de arquivos processados
    const MAX_FILES_TO_PROCESS = 500; // Reduzido para maior segurança
    const filesToProcess = files.slice(0, MAX_FILES_TO_PROCESS);
    let totalSize = 0;
    let processedFiles = 0;
    const MAX_CONCURRENT_OPERATIONS = 10; // ✅ Limite de operações concorrentes
    // ✅ SEGURANÇA: Processar arquivos em batches para controlar concorrência
    for (let i = 0; i < filesToProcess.length; i += MAX_CONCURRENT_OPERATIONS) {
        const batch = filesToProcess.slice(i, i + MAX_CONCURRENT_OPERATIONS);
        const batchPromises = batch.map(async (file) => {
            try {
                const filePath = path_1.default.join(uploadPath, file);
                const stats = await promises_1.default.stat(filePath);
                return { size: stats.size, processed: true };
            }
            catch (fileError) {
                return { size: 0, processed: false };
            }
        });
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
            if (result.processed) {
                totalSize += result.size;
                processedFiles++;
            }
        });
    }
    return {
        totalFiles: files.length,
        processedFiles,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        cached: false,
        ...(files.length > MAX_FILES_TO_PROCESS && {
            warning: `Apenas ${MAX_FILES_TO_PROCESS} arquivos processados de ${files.length} total`
        })
    };
}
/**
 * Estatísticas gerais do sistema
 */
exports.getSystemStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Buscar estatísticas do banco de dados
    const [totalUsers, totalVehicles, totalWorkshops, totalMaintenances, recentUsers, recentVehicles, recentMaintenances] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.vehicle.count(),
        prisma_1.prisma.workshop.count(),
        prisma_1.prisma.maintenance.count(),
        prisma_1.prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
                }
            }
        }),
        prisma_1.prisma.vehicle.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        }),
        prisma_1.prisma.maintenance.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        })
    ]);
    // Estatísticas de manutenção por status de validação
    const maintenancesByStatus = await prisma_1.prisma.maintenance.groupBy({
        by: ['validationStatus'],
        _count: {
            id: true
        }
    });
    // Usuários por perfil
    const usersByProfile = await prisma_1.prisma.user.groupBy({
        by: ['profile'],
        _count: {
            id: true
        }
    });
    // ✅ SEGURANÇA: Verificar espaço em disco usando função segura (CWE-770 Prevention)
    const uploadStats = await getSafeUploadStats();
    const response = {
        success: true,
        message: 'System statistics retrieved',
        data: {
            totals: {
                users: totalUsers,
                vehicles: totalVehicles,
                workshops: totalWorkshops,
                maintenances: totalMaintenances
            },
            recent: {
                users: recentUsers,
                vehicles: recentVehicles,
                maintenances: recentMaintenances
            },
            breakdowns: {
                maintenancesByStatus: maintenancesByStatus.map(item => ({
                    status: item.validationStatus,
                    count: item._count.id
                })),
                usersByProfile: usersByProfile.map(item => ({
                    profile: item.profile,
                    count: item._count.id
                }))
            },
            uploads: uploadStats,
            timestamp: new Date().toISOString()
        }
    };
    res.json(response);
});
// ✅ SEGURANÇA: Rate limiting para health check (CWE-770 Prevention)
exports.systemHealthRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 30 * 1000, // 30 segundos
    max: 20, // Máximo 20 requests por 30 segundos por IP
    message: {
        success: false,
        message: 'Muitas solicitações de health check. Tente novamente em 30 segundos.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Status detalhado do sistema
 */
exports.getSystemHealth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Testar conexão com banco de dados
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
        const startTime = Date.now();
        await prisma_1.prisma.user.count();
        dbLatency = Date.now() - startTime;
    }
    catch (error) {
        dbStatus = 'unhealthy';
    }
    // Verificar memória
    const memoryUsage = process.memoryUsage();
    const memoryStats = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
    };
    // Tempo de atividade
    const uptime = {
        seconds: Math.floor(process.uptime()),
        readable: formatUptime(process.uptime())
    };
    // Status geral
    const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'degraded';
    const response = {
        success: true,
        message: 'System health check completed',
        data: {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            environment: config_1.config.nodeEnv,
            components: {
                database: {
                    status: dbStatus,
                    latencyMs: dbLatency
                },
                memory: {
                    status: memoryStats.heapUsed < 500 ? 'healthy' : 'warning',
                    usage: memoryStats
                },
                uptime
            }
        }
    };
    res.json(response);
});
// ✅ SEGURANÇA: Rate limiting para endpoints listing (CWE-770 Prevention)
exports.systemEndpointsRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // Máximo 5 requests por minuto por IP
    message: {
        success: false,
        message: 'Muitas solicitações de listagem de endpoints. Tente novamente em 1 minuto.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Endpoints de sistema disponíveis
 */
exports.getSystemEndpoints = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const endpoints = {
        auth: [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            'GET /api/auth/profile',
            'PUT /api/auth/profile'
        ],
        users: [
            'GET /api/users',
            'POST /api/users',
            'GET /api/users/:id',
            'PUT /api/users/:id',
            'DELETE /api/users/:id',
            'GET /api/users/search'
        ],
        vehicles: [
            'GET /api/vehicles',
            'POST /api/vehicles',
            'GET /api/vehicles/:id',
            'PUT /api/vehicles/:id',
            'DELETE /api/vehicles/:id',
            'GET /api/vehicles/user/:userId',
            'GET /api/vehicles/fipe/brands',
            'GET /api/vehicles/fipe/models/:brandId',
            'GET /api/vehicles/fipe/years/:brandId/:modelId',
            'GET /api/vehicles/fipe/value/:brandId/:modelId/:year'
        ],
        workshops: [
            'GET /api/workshops',
            'POST /api/workshops',
            'GET /api/workshops/:id',
            'PUT /api/workshops/:id',
            'DELETE /api/workshops/:id',
            'GET /api/workshops/search',
            'GET /api/workshops/stats'
        ],
        maintenances: [
            'GET /api/maintenances',
            'POST /api/maintenances',
            'GET /api/maintenances/:id',
            'PUT /api/maintenances/:id',
            'DELETE /api/maintenances/:id',
            'GET /api/maintenances/vehicle/:vehicleId',
            'GET /api/maintenances/workshop/:workshopId',
            'POST /api/maintenances/:id/upload',
            'GET /api/maintenances/:id/documents'
        ],
        system: [
            'GET /health',
            'GET /api/system/stats',
            'GET /api/system/health',
            'GET /api/system/endpoints'
        ]
    };
    const response = {
        success: true,
        message: 'System endpoints retrieved',
        data: {
            totalEndpoints: Object.values(endpoints).flat().length,
            endpoints,
            baseUrl: req.protocol + '://' + req.get('host'),
            timestamp: new Date().toISOString()
        }
    };
    res.json(response);
});
/**
 * Formatar tempo de atividade em formato legível
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (secs > 0)
        parts.push(`${secs}s`);
    return parts.join(' ') || '0s';
}
//# sourceMappingURL=systemController.js.map