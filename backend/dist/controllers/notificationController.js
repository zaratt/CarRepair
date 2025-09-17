"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTokenUsage = exports.removePushToken = exports.getUserPushTokens = exports.registerPushToken = exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.getNotificationStats = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const prisma = new client_1.PrismaClient();
// ✅ CRUD REAL - Obter notificações do usuário
exports.getUserNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user; // Do middleware de autenticação
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const where = {
        userId,
        ...(unreadOnly === 'true' && { isRead: false })
    };
    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        }),
        prisma.notification.count({ where })
    ]);
    const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
    });
    const response = {
        success: true,
        message: 'User notifications retrieved successfully',
        data: {
            notifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            },
            stats: {
                total,
                unread: unreadCount,
                read: total - unreadCount
            }
        }
    };
    res.json(response);
});
// ✅ CRUD REAL - Marcar notificação como lida
exports.markNotificationAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const { notificationId } = req.params;
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
    });
    if (!notification) {
        const errorResponse = {
            success: false,
            message: 'Notification not found'
        };
        res.status(404).json(errorResponse);
        return;
    }
    const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });
    const response = {
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification
    };
    res.json(response);
});
// ✅ CRUD REAL - Marcar todas as notificações como lidas
exports.markAllNotificationsAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });
    const response = {
        success: true,
        message: 'All notifications marked as read',
        data: {
            userId,
            markedCount: result.count,
            readAt: new Date().toISOString()
        }
    };
    res.json(response);
});
// ✅ CRUD REAL - Deletar notificação
exports.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const { notificationId } = req.params;
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
    });
    if (!notification) {
        const errorResponse = {
            success: false,
            message: 'Notification not found'
        };
        res.status(404).json(errorResponse);
        return;
    }
    await prisma.notification.delete({
        where: { id: notificationId }
    });
    const response = {
        success: true,
        message: 'Notification deleted successfully',
        data: {
            notificationId,
            deletedAt: new Date().toISOString()
        }
    };
    res.json(response);
});
// ✅ CRUD REAL - Obter estatísticas de notificações
exports.getNotificationStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const [total, unread, byType, byPriority, thisWeek, thisMonth] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
        prisma.notification.groupBy({
            by: ['type'],
            where: { userId },
            _count: { type: true }
        }),
        prisma.notification.groupBy({
            by: ['priority'],
            where: { userId },
            _count: { priority: true }
        }),
        prisma.notification.count({
            where: {
                userId,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.notification.count({
            where: {
                userId,
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
        })
    ]);
    const lastNotification = await prisma.notification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
    });
    const stats = {
        userId,
        total,
        unread,
        byType: byType.reduce((acc, item) => ({
            ...acc,
            [item.type]: item._count.type
        }), {}),
        byPriority: byPriority.reduce((acc, item) => ({
            ...acc,
            [item.priority]: item._count.priority
        }), {}),
        thisWeek,
        thisMonth,
        lastActivity: lastNotification?.createdAt
    };
    const response = {
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: stats
    };
    res.json(response);
});
// ✅ CRUD REAL - Obter preferências de notificação do usuário
exports.getNotificationPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    let preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
    });
    // Se não existir, criar com valores padrão
    if (!preferences) {
        preferences = await prisma.notificationPreference.create({
            data: { userId }
        });
    }
    const response = {
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences
    };
    res.json(response);
});
// ✅ CRUD REAL - Atualizar preferências de notificação
exports.updateNotificationPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const preferences = req.body;
    const updatedPreferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
            userId,
            ...preferences
        }
    });
    const response = {
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences
    };
    res.json(response);
});
// ✅ NOVO: Registrar Push Token
exports.registerPushToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const { pushToken, deviceInfo } = req.body;
    if (!pushToken) {
        res.status(400).json({
            success: false,
            message: 'Push token is required'
        });
        return;
    }
    try {
        // Desativar tokens antigos deste usuário no mesmo dispositivo
        await prisma.pushToken.updateMany({
            where: {
                userId,
                platform: deviceInfo?.platform || 'unknown'
            },
            data: {
                isActive: false
            }
        });
        // Criar ou atualizar o token
        const token = await prisma.pushToken.upsert({
            where: {
                token: pushToken
            },
            update: {
                isActive: true,
                lastUsed: new Date(),
                deviceName: deviceInfo?.deviceName,
                osVersion: deviceInfo?.osVersion,
                modelName: deviceInfo?.modelName,
                platform: deviceInfo?.platform || 'unknown'
            },
            create: {
                userId,
                token: pushToken,
                platform: deviceInfo?.platform || 'unknown',
                deviceName: deviceInfo?.deviceName,
                osVersion: deviceInfo?.osVersion,
                modelName: deviceInfo?.modelName,
                isActive: true
            }
        });
        const response = {
            success: true,
            message: 'Push token registered successfully',
            data: { tokenId: token.id }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register push token'
        });
    }
});
// ✅ NOVO: Listar Push Tokens do Usuário
exports.getUserPushTokens = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const tokens = await prisma.pushToken.findMany({
        where: {
            userId,
            isActive: true
        },
        select: {
            id: true,
            platform: true,
            deviceName: true,
            osVersion: true,
            modelName: true,
            lastUsed: true,
            createdAt: true
        },
        orderBy: {
            lastUsed: 'desc'
        }
    });
    const response = {
        success: true,
        message: 'Push tokens retrieved successfully',
        data: tokens
    };
    res.json(response);
});
// ✅ NOVO: Remover Push Token
exports.removePushToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.user;
    const { tokenId } = req.params;
    const token = await prisma.pushToken.findFirst({
        where: {
            id: tokenId,
            userId
        }
    });
    if (!token) {
        res.status(404).json({
            success: false,
            message: 'Push token not found'
        });
        return;
    }
    await prisma.pushToken.update({
        where: {
            id: tokenId
        },
        data: {
            isActive: false
        }
    });
    const response = {
        success: true,
        message: 'Push token removed successfully'
    };
    res.json(response);
});
// ✅ NOVO: Atualizar timestamp do token (usado quando enviamos push)
const updateTokenUsage = async (tokenId) => {
    try {
        await prisma.pushToken.update({
            where: {
                id: tokenId
            },
            data: {
                lastUsed: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error updating token usage:', error);
    }
};
exports.updateTokenUsage = updateTokenUsage;
//# sourceMappingURL=notificationController.js.map