import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const prisma = new PrismaClient();

/**
 * Estatísticas gerais do sistema
 */
export const getSystemStats = asyncHandler(async (req: Request, res: Response) => {
    // Buscar estatísticas do banco de dados
    const [
        totalUsers,
        totalVehicles,
        totalWorkshops,
        totalMaintenances,
        recentUsers,
        recentVehicles,
        recentMaintenances
    ] = await Promise.all([
        prisma.user.count(),
        prisma.vehicle.count(),
        prisma.workshop.count(),
        prisma.maintenance.count(),
        prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
                }
            }
        }),
        prisma.vehicle.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        }),
        prisma.maintenance.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        })
    ]);

    // Estatísticas de manutenção por status de validação
    const maintenancesByStatus = await prisma.maintenance.groupBy({
        by: ['validationStatus'],
        _count: {
            id: true
        }
    });

    // Usuários por perfil
    const usersByProfile = await prisma.user.groupBy({
        by: ['profile'],
        _count: {
            id: true
        }
    });

    // Verificar espaço em disco (uploads)
    let uploadStats = null;
    try {
        const uploadPath = config.upload.path;
        const files = fs.readdirSync(uploadPath);
        const totalFiles = files.length;

        let totalSize = 0;
        files.forEach(file => {
            const filePath = path.join(uploadPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        });

        uploadStats = {
            totalFiles,
            totalSizeBytes: totalSize,
            totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
        };
    } catch (error) {
        uploadStats = { error: 'Unable to read upload directory' };
    }

    const response: ApiResponse = {
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

/**
 * Status detalhado do sistema
 */
export const getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    // Testar conexão com banco de dados
    let dbStatus = 'healthy';
    let dbLatency = 0;

    try {
        const startTime = Date.now();
        await prisma.user.count();
        dbLatency = Date.now() - startTime;
    } catch (error) {
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

    const response: ApiResponse = {
        success: true,
        message: 'System health check completed',
        data: {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            environment: config.nodeEnv,
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

/**
 * Endpoints de sistema disponíveis
 */
export const getSystemEndpoints = asyncHandler(async (req: Request, res: Response) => {
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

    const response: ApiResponse = {
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
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
}
