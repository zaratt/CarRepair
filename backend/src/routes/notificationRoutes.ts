import { Router } from 'express';
import {
    deleteNotification,
    getNotificationPreferences,
    getNotificationStats,
    getUserNotifications,
    getUserPushTokens,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    registerPushToken,
    removePushToken,
    updateNotificationPreferences
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ✅ Aplicar middleware de autenticação para todas as rotas
router.use(authenticateToken);

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

// ✅ NOVO: Rotas para Push Tokens
router.post('/register-token', registerPushToken);
router.get('/tokens', getUserPushTokens);
router.delete('/tokens/:tokenId', removePushToken);

// ✅ TESTE: Endpoint para testar push notifications
router.post('/test-push', async (req, res) => {
    try {
        const { userId } = req.user as any;
        const { pushNotificationService } = require('../services/pushNotificationService');

        const success = await pushNotificationService.sendToUser(
            { userId, notificationType: 'system_update' },
            {
                title: '🧪 Teste de Push Notification',
                body: 'Sistema de notificações funcionando perfeitamente!',
                data: {
                    test: true,
                    timestamp: new Date().toISOString(),
                    actionUrl: '/notifications'
                },
                priority: 'high'
            }
        );

        res.json({
            success,
            message: success
                ? 'Push notification de teste enviado com sucesso!'
                : 'Falha ao enviar push notification de teste'
        });
    } catch (error) {
        console.error('Erro no teste de push:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno no teste de push notification'
        });
    }
});

export default router;
