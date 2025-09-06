"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationStats = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.updateNotificationPreferences = exports.getNotificationPreferences = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
// Obter preferências de notificação do usuário
exports.getNotificationPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Mock data para desenvolvimento
    const preferences = {
        userId: req.params.userId || 'current_user',
        emailNotifications: {
            maintenanceReminders: true,
            inspectionReminders: true,
            paymentDue: true,
            promotions: false,
            systemUpdates: true
        },
        pushNotifications: {
            maintenanceReminders: true,
            inspectionReminders: true,
            paymentDue: true,
            promotions: false,
            systemUpdates: false,
            emergencyAlerts: true
        },
        smsNotifications: {
            maintenanceReminders: false,
            inspectionReminders: true,
            paymentDue: true,
            promotions: false,
            emergencyAlerts: true
        },
        frequency: {
            maintenanceReminders: 7, // dias antes
            inspectionReminders: 15, // dias antes
            paymentReminders: 3 // dias antes
        },
        quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00'
        }
    };
    const response = {
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences
    };
    res.json(response);
});
// Atualizar preferências de notificação
exports.updateNotificationPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId;
    const preferences = req.body;
    // Mock response - em produção, salvaria no banco
    const updatedPreferences = {
        userId,
        ...preferences,
        updatedAt: new Date().toISOString()
    };
    const response = {
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences
    };
    res.json(response);
});
// Obter notificações do usuário
exports.getUserNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId || 'default_user'; // Para quando não há userId na rota
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    // Mock data
    const notifications = [
        {
            id: 'notif_001',
            userId,
            type: 'maintenance_reminder',
            title: 'Lembrete de Manutenção',
            message: 'Seu Honda Civic está próximo da revisão dos 10.000 km',
            isRead: false,
            priority: 'medium',
            actionUrl: '/maintenances/schedule',
            actionText: 'Agendar Revisão',
            createdAt: '2025-09-01T10:00:00Z',
            vehicleInfo: {
                id: 'vh_001',
                model: 'Honda Civic 2020',
                plate: 'ABC1234'
            }
        },
        {
            id: 'notif_002',
            userId,
            type: 'inspection_reminder',
            title: 'Vistoria Agendada',
            message: 'Sua vistoria está agendada para amanhã às 14:30',
            isRead: true,
            priority: 'high',
            actionUrl: '/inspections/details/insp_002',
            actionText: 'Ver Detalhes',
            createdAt: '2025-08-31T15:30:00Z',
            vehicleInfo: {
                id: 'vh_002',
                model: 'Toyota Corolla 2019',
                plate: 'DEF5678'
            }
        },
        {
            id: 'notif_003',
            userId,
            type: 'payment_reminder',
            title: 'Pagamento Pendente',
            message: 'Você tem um pagamento de R$ 350,00 vencendo em 2 dias',
            isRead: false,
            priority: 'high',
            actionUrl: '/payments/pending',
            actionText: 'Pagar Agora',
            createdAt: '2025-08-30T09:15:00Z'
        },
        {
            id: 'notif_004',
            userId,
            type: 'system_update',
            title: 'Nova Funcionalidade',
            message: 'Agora você pode agendar vistorias diretamente pelo app!',
            isRead: true,
            priority: 'low',
            actionUrl: '/inspections/schedule',
            actionText: 'Experimentar',
            createdAt: '2025-08-28T12:00:00Z'
        }
    ];
    // Filtrar apenas não lidas se solicitado
    const filteredNotifications = unreadOnly === 'true'
        ? notifications.filter(n => !n.isRead)
        : notifications;
    // Simular paginação
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    const response = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
            notifications: paginatedNotifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: filteredNotifications.length,
                totalPages: Math.ceil(filteredNotifications.length / Number(limit))
            },
            unreadCount: notifications.filter(n => !n.isRead).length
        }
    };
    res.json(response);
});
// Marcar notificação como lida
exports.markNotificationAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notificationId = req.params.notificationId;
    // Mock response
    const response = {
        success: true,
        message: 'Notification marked as read',
        data: {
            notificationId,
            isRead: true,
            readAt: new Date().toISOString()
        }
    };
    res.json(response);
});
// Marcar todas as notificações como lidas
exports.markAllNotificationsAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId || req.body.userId || 'default_user'; // Aceitar userId do body ou params
    // Mock response
    const response = {
        success: true,
        message: 'All notifications marked as read',
        data: {
            userId,
            markedCount: 5,
            readAt: new Date().toISOString()
        }
    };
    res.json(response);
});
// Deletar notificação
exports.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notificationId = req.params.notificationId;
    // Mock response
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
// Obter estatísticas de notificações
exports.getNotificationStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId || 'default_user'; // Para quando não há userId na rota
    // Mock data
    const stats = {
        userId,
        total: 24,
        unread: 3,
        byType: {
            maintenance_reminder: 8,
            inspection_reminder: 6,
            payment_reminder: 4,
            system_update: 3,
            promotional: 2,
            emergency: 1
        },
        byPriority: {
            high: 5,
            medium: 12,
            low: 7
        },
        thisWeek: 8,
        thisMonth: 15,
        lastActivity: '2025-09-01T10:00:00Z'
    };
    const response = {
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: stats
    };
    res.json(response);
});
//# sourceMappingURL=notificationController.js.map