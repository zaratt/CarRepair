"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotifications = exports.pushNotificationService = void 0;
const client_1 = require("@prisma/client");
const expo_server_sdk_1 = require("expo-server-sdk");
const prisma = new client_1.PrismaClient();
const expo = new expo_server_sdk_1.Expo();
class PushNotificationService {
    // ✅ ENVIAR PUSH NOTIFICATION PARA USUÁRIO ESPECÍFICO
    async sendToUser(target, notification) {
        try {
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('📱 Enviando push notification para usuário', target.userId);
            // Buscar tokens ativos do usuário
            const tokens = await prisma.pushToken.findMany({
                where: {
                    userId: target.userId,
                    isActive: true
                }
            });
            if (tokens.length === 0) {
                // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
                console.log('⚠️ Nenhum token ativo encontrado para usuário', target.userId);
                return false;
            }
            // Verificar preferências do usuário
            const preferences = await prisma.notificationPreference.findUnique({
                where: { userId: target.userId }
            });
            if (!this.shouldSendNotification(preferences, target.notificationType)) {
                // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
                console.log('🔕 Notificação bloqueada pelas preferências do usuário', target.userId);
                return false;
            }
            // Preparar mensagens
            const messages = tokens
                .map(token => token.token)
                .filter(token => expo_server_sdk_1.Expo.isExpoPushToken(token))
                .map(token => ({
                to: token,
                sound: notification.sound || 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                badge: notification.badge,
                priority: notification.priority || 'high',
                channelId: notification.channelId || 'default',
            }));
            if (messages.length === 0) {
                // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
                console.log('⚠️ Nenhum token válido encontrado para usuário', target.userId);
                return false;
            }
            // Enviar em lotes
            const chunks = expo.chunkPushNotifications(messages);
            let success = true;
            for (const chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log(`✅ Lote enviado:`, ticketChunk);
                    // Verificar tickets para erros
                    for (let i = 0; i < ticketChunk.length; i++) {
                        const ticket = ticketChunk[i];
                        if (ticket && ticket.status === 'error') {
                            console.error(`❌ Erro no envio:`, ticket.message);
                            if (ticket.details?.error === 'DeviceNotRegistered') {
                                // Desativar token inválido
                                const tokenToDisable = tokens.find(t => t.token === chunk[i]?.to);
                                if (tokenToDisable) {
                                    await this.disableToken(tokenToDisable.id);
                                }
                            }
                            success = false;
                        }
                    }
                }
                catch (error) {
                    console.error(`❌ Erro ao enviar lote:`, error);
                    success = false;
                }
            }
            // Atualizar timestamp dos tokens usados
            await this.updateTokensUsage(tokens.map(t => t.id));
            return success;
        }
        catch (error) {
            console.error('❌ Erro no serviço de push notification:', error);
            return false;
        }
    }
    // ✅ ENVIAR PARA MÚLTIPLOS USUÁRIOS
    async sendToMultipleUsers(userIds, notification, notificationType) {
        const promises = userIds.map(userId => this.sendToUser({ userId, notificationType }, notification));
        await Promise.allSettled(promises);
    }
    // ✅ VERIFICAR SE DEVE ENVIAR BASEADO NAS PREFERÊNCIAS
    shouldSendNotification(preferences, notificationType) {
        if (!preferences)
            return true; // Default: enviar se não há preferências
        // Verificar se push notifications estão habilitadas
        if (!preferences.pushNotifications)
            return false;
        // Verificar quiet hours
        if (this.isQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
            return false;
        }
        // Verificar tipo específico de notificação
        switch (notificationType) {
            case 'maintenance_reminder':
                return preferences.maintenanceReminders;
            case 'inspection_reminder':
                return preferences.inspectionReminders;
            case 'payment_reminder':
                return preferences.paymentReminders;
            case 'promotional':
                return preferences.promotions;
            case 'system_update':
                return preferences.systemUpdates;
            case 'emergency':
                return preferences.emergencyAlerts;
            default:
                return true;
        }
    }
    // ✅ VERIFICAR QUIET HOURS
    isQuietHours(startTime, endTime) {
        if (!startTime || !endTime)
            return false;
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const timeParts = startTime.split(':');
        const endParts = endTime.split(':');
        if (timeParts.length !== 2 || endParts.length !== 2)
            return false;
        const startHour = parseInt(timeParts[0] || '0', 10);
        const startMin = parseInt(timeParts[1] || '0', 10);
        const endHour = parseInt(endParts[0] || '0', 10);
        const endMin = parseInt(endParts[1] || '0', 10);
        if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin))
            return false;
        const start = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;
        if (start <= end) {
            // Mesmo dia (ex: 08:00 - 22:00)
            return currentTime >= start && currentTime <= end;
        }
        else {
            // Atravessa meia-noite (ex: 22:00 - 08:00)
            return currentTime >= start || currentTime <= end;
        }
    }
    // ✅ DESATIVAR TOKEN INVÁLIDO
    async disableToken(tokenId) {
        try {
            await prisma.pushToken.update({
                where: { id: tokenId },
                data: { isActive: false }
            });
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('🔴 Token desativado (dispositivo não registrado):', tokenId);
        }
        catch (error) {
            console.error('❌ Erro ao desativar token:', error);
        }
    }
    // ✅ ATUALIZAR TIMESTAMP DOS TOKENS
    async updateTokensUsage(tokenIds) {
        try {
            await prisma.pushToken.updateMany({
                where: {
                    id: { in: tokenIds }
                },
                data: {
                    lastUsed: new Date()
                }
            });
        }
        catch (error) {
            console.error('❌ Erro ao atualizar timestamp dos tokens:', error);
        }
    }
    // ✅ ENVIAR NOTIFICAÇÃO DE EMERGÊNCIA (ignora preferências)
    async sendEmergencyNotification(userId, notification) {
        return this.sendToUser({ userId, notificationType: 'emergency' }, { ...notification, priority: 'high' });
    }
    // ✅ BROADCAST PARA TODOS OS USUÁRIOS ATIVOS
    async broadcastToAllUsers(notification, notificationType) {
        try {
            const activeUsers = await prisma.user.findMany({
                where: {
                    pushTokens: {
                        some: {
                            isActive: true
                        }
                    }
                },
                select: { id: true }
            });
            const userIds = activeUsers.map(user => user.id);
            await this.sendToMultipleUsers(userIds, notification, notificationType);
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('📢 Broadcast enviado para', userIds.length, 'usuários');
        }
        catch (error) {
            console.error('❌ Erro no broadcast:', error);
        }
    }
    // ✅ LIMPEZA DE TOKENS ANTIGOS (para uso em CRON jobs)
    async cleanupOldTokens(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const result = await prisma.pushToken.updateMany({
                where: {
                    lastUsed: {
                        lt: cutoffDate
                    },
                    isActive: true
                },
                data: {
                    isActive: false
                }
            });
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('🧹', result.count, 'tokens antigos desativados');
        }
        catch (error) {
            console.error('❌ Erro na limpeza de tokens:', error);
        }
    }
}
// ✅ EXPORTAR SINGLETON
exports.pushNotificationService = new PushNotificationService();
// ✅ FUNÇÕES DE CONVENIÊNCIA PARA DIFERENTES TIPOS DE NOTIFICAÇÃO
exports.pushNotifications = {
    // Lembrete de manutenção
    sendMaintenanceReminder: (userId, vehicleName, maintenanceType) => {
        return exports.pushNotificationService.sendToUser({ userId, notificationType: 'maintenance_reminder' }, {
            title: '🔧 Lembrete de Manutenção',
            body: `${vehicleName} precisa de ${maintenanceType}`,
            data: { type: 'maintenance_reminder', actionUrl: '/maintenances/new' },
            badge: 1
        });
    },
    // Lembrete de inspeção
    sendInspectionReminder: (userId, vehicleName) => {
        return exports.pushNotificationService.sendToUser({ userId, notificationType: 'inspection_reminder' }, {
            title: '📋 Lembrete de Inspeção',
            body: `${vehicleName} precisa de inspeção`,
            data: { type: 'inspection_reminder', actionUrl: '/inspections/new' },
            badge: 1
        });
    },
    // Notificação de pagamento
    sendPaymentReminder: (userId, amount, dueDate) => {
        return exports.pushNotificationService.sendToUser({ userId, notificationType: 'payment_reminder' }, {
            title: '💰 Lembrete de Pagamento',
            body: `Pagamento de R$ ${amount.toFixed(2)} vence em ${dueDate}`,
            data: { type: 'payment_reminder', actionUrl: '/payments' },
            badge: 1
        });
    },
    // Promoção
    sendPromotionalOffer: (userId, title, description) => {
        return exports.pushNotificationService.sendToUser({ userId, notificationType: 'promotional' }, {
            title: `🎯 ${title}`,
            body: description,
            data: { type: 'promotional', actionUrl: '/promotions' }
        });
    }
};
//# sourceMappingURL=pushNotificationService.js.map