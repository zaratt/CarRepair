import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const prisma = new PrismaClient();

// ✅ CRUD REAL - Obter notificações do usuário
export const getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any; // Do middleware de autenticação
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

    const response: ApiResponse = {
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
export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
    });

    if (!notification) {
        const errorResponse: ApiResponse = {
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

    const response: ApiResponse = {
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification
    };

    res.json(response);
});

// ✅ CRUD REAL - Marcar todas as notificações como lidas
export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any;

    const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });

    const response: ApiResponse = {
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
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
    });

    if (!notification) {
        const errorResponse: ApiResponse = {
            success: false,
            message: 'Notification not found'
        };
        res.status(404).json(errorResponse);
        return;
    }

    await prisma.notification.delete({
        where: { id: notificationId }
    });

    const response: ApiResponse = {
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
export const getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any;

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

    const response: ApiResponse = {
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: stats
    };

    res.json(response);
});

// ✅ CRUD REAL - Obter preferências de notificação do usuário
export const getNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any;

    let preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
    });

    // Se não existir, criar com valores padrão
    if (!preferences) {
        preferences = await prisma.notificationPreference.create({
            data: { userId }
        });
    }

    const response: ApiResponse = {
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences
    };

    res.json(response);
});

// ✅ CRUD REAL - Atualizar preferências de notificação
export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.user as any;
    const preferences = req.body;

    const updatedPreferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
            userId,
            ...preferences
        }
    });

    const response: ApiResponse = {
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences
    };

    res.json(response);
});
