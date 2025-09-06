"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
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
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map