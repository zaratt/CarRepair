import { Router } from 'express';
import {
    deleteNotification,
    getNotificationPreferences,
    getNotificationStats,
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    updateNotificationPreferences
} from '../controllers/notificationController';

const router = Router();

// Lista de notificações (rota principal)
router.get('/', getUserNotifications);

// Estatísticas de notificações
router.get('/stats', getNotificationStats);

// Device tokens (para push notifications)
router.get('/device-tokens', (req, res) => {
    res.json({
        success: true,
        message: 'Device tokens retrieved successfully',
        data: {
            tokens: [],
            count: 0,
            lastUpdated: new Date().toISOString()
        }
    });
});

// Preferências de notificação
router.get('/preferences', getNotificationPreferences);
router.get('/preferences/:userId', getNotificationPreferences);
router.put('/preferences/:userId', updateNotificationPreferences);

// Notificações do usuário
router.get('/user/:userId', getUserNotifications);

// Marcar todas as notificações como lidas (rota global)
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Marcar como lida
router.patch('/:notificationId/read', markNotificationAsRead);

// Marcar todas como lidas
router.patch('/user/:userId/read-all', markAllNotificationsAsRead);

// Deletar notificação
router.delete('/:notificationId', deleteNotification);

// Estatísticas de notificações
router.get('/stats/:userId', getNotificationStats);

export default router;
