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

// Preferências de notificação
router.get('/preferences', getNotificationPreferences);
router.get('/preferences/:userId', getNotificationPreferences);
router.put('/preferences/:userId', updateNotificationPreferences);

// Notificações do usuário
router.get('/user/:userId', getUserNotifications);

// Marcar como lida
router.patch('/:notificationId/read', markNotificationAsRead);

// Marcar todas como lidas
router.patch('/user/:userId/read-all', markAllNotificationsAsRead);

// Deletar notificação
router.delete('/:notificationId', deleteNotification);

// Estatísticas de notificações
router.get('/stats/:userId', getNotificationStats);

export default router;
