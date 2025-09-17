"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ✅ Aplicar middleware de autenticação para todas as rotas
router.use(auth_1.authenticateToken);
// Lista de notificações (rota principal)
router.get('/', notificationController_1.getUserNotifications);
// Estatísticas de notificações
router.get('/stats', notificationController_1.getNotificationStats);
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
router.get('/preferences', notificationController_1.getNotificationPreferences);
router.get('/preferences/:userId', notificationController_1.getNotificationPreferences);
router.put('/preferences/:userId', notificationController_1.updateNotificationPreferences);
// Notificações do usuário
router.get('/user/:userId', notificationController_1.getUserNotifications);
// Marcar todas as notificações como lidas (rota global)
router.patch('/mark-all-read', notificationController_1.markAllNotificationsAsRead);
// Marcar como lida
router.patch('/:notificationId/read', notificationController_1.markNotificationAsRead);
// Marcar todas como lidas
router.patch('/user/:userId/read-all', notificationController_1.markAllNotificationsAsRead);
// Deletar notificação
router.delete('/:notificationId', notificationController_1.deleteNotification);
// Estatísticas de notificações
router.get('/stats/:userId', notificationController_1.getNotificationStats);
// ✅ NOVO: Rotas para Push Tokens
router.post('/register-token', notificationController_1.registerPushToken);
router.get('/tokens', notificationController_1.getUserPushTokens);
router.delete('/tokens/:tokenId', notificationController_1.removePushToken);
// ✅ TESTE: Endpoint para testar push notifications
router.post('/test-push', async (req, res) => {
    try {
        const { userId } = req.user;
        const { pushNotificationService } = require('../services/pushNotificationService');
        const success = await pushNotificationService.sendToUser({ userId, notificationType: 'system_update' }, {
            title: '🧪 Teste de Push Notification',
            body: 'Sistema de notificações funcionando perfeitamente!',
            data: {
                test: true,
                timestamp: new Date().toISOString(),
                actionUrl: '/notifications'
            },
            priority: 'high'
        });
        res.json({
            success,
            message: success
                ? 'Push notification de teste enviado com sucesso!'
                : 'Falha ao enviar push notification de teste'
        });
    }
    catch (error) {
        console.error('Erro no teste de push:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno no teste de push notification'
        });
    }
});
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map