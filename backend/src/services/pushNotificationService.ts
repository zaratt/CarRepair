import { PrismaClient } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

export interface PushNotificationData {
    title: string;
    body: string;
    data?: any;
    sound?: 'default' | null;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
}

export interface PushNotificationTarget {
    userId: string;
    notificationType?: string;
}

class PushNotificationService {
    // ✅ ENVIAR PUSH NOTIFICATION PARA USUÁRIO ESPECÍFICO
    async sendToUser(target: PushNotificationTarget, notification: PushNotificationData): Promise<boolean> {
        try {
            console.log(`📱 Enviando push notification para usuário ${target.userId}`);

            // Buscar tokens ativos do usuário
            const tokens = await prisma.pushToken.findMany({
                where: {
                    userId: target.userId,
                    isActive: true
                }
            });

            if (tokens.length === 0) {
                console.log(`⚠️ Nenhum token ativo encontrado para usuário ${target.userId}`);
                return false;
            }

            // Verificar preferências do usuário
            const preferences = await prisma.notificationPreference.findUnique({
                where: { userId: target.userId }
            });

            if (!this.shouldSendNotification(preferences, target.notificationType)) {
                console.log(`🔕 Notificação bloqueada pelas preferências do usuário ${target.userId}`);
                return false;
            }

            // Preparar mensagens
            const messages = tokens
                .map(token => token.token)
                .filter(token => Expo.isExpoPushToken(token))
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
                console.log(`⚠️ Nenhum token válido encontrado para usuário ${target.userId}`);
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
                            console.error(`❌ Erro no envio:`, (ticket as any).message);
                            if ((ticket as any).details?.error === 'DeviceNotRegistered') {
                                // Desativar token inválido
                                const tokenToDisable = tokens.find(t => t.token === chunk[i]?.to);
                                if (tokenToDisable) {
                                    await this.disableToken(tokenToDisable.id);
                                }
                            }
                            success = false;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erro ao enviar lote:`, error);
                    success = false;
                }
            }

            // Atualizar timestamp dos tokens usados
            await this.updateTokensUsage(tokens.map(t => t.id));

            return success;
        } catch (error) {
            console.error('❌ Erro no serviço de push notification:', error);
            return false;
        }
    }

    // ✅ ENVIAR PARA MÚLTIPLOS USUÁRIOS
    async sendToMultipleUsers(userIds: string[], notification: PushNotificationData, notificationType?: string): Promise<void> {
        const promises = userIds.map(userId =>
            this.sendToUser({ userId, notificationType }, notification)
        );

        await Promise.allSettled(promises);
    }

    // ✅ VERIFICAR SE DEVE ENVIAR BASEADO NAS PREFERÊNCIAS
    private shouldSendNotification(preferences: any, notificationType?: string): boolean {
        if (!preferences) return true; // Default: enviar se não há preferências

        // Verificar se push notifications estão habilitadas
        if (!preferences.pushNotifications) return false;

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
    private isQuietHours(startTime?: string, endTime?: string): boolean {
        if (!startTime || !endTime) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const timeParts = startTime.split(':');
        const endParts = endTime.split(':');

        if (timeParts.length !== 2 || endParts.length !== 2) return false;

        const startHour = parseInt(timeParts[0] || '0', 10);
        const startMin = parseInt(timeParts[1] || '0', 10);
        const endHour = parseInt(endParts[0] || '0', 10);
        const endMin = parseInt(endParts[1] || '0', 10);

        if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) return false;

        const start = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;

        if (start <= end) {
            // Mesmo dia (ex: 08:00 - 22:00)
            return currentTime >= start && currentTime <= end;
        } else {
            // Atravessa meia-noite (ex: 22:00 - 08:00)
            return currentTime >= start || currentTime <= end;
        }
    }

    // ✅ DESATIVAR TOKEN INVÁLIDO
    private async disableToken(tokenId: string): Promise<void> {
        try {
            await prisma.pushToken.update({
                where: { id: tokenId },
                data: { isActive: false }
            });
            console.log(`🔴 Token ${tokenId} desativado (dispositivo não registrado)`);
        } catch (error) {
            console.error('❌ Erro ao desativar token:', error);
        }
    }

    // ✅ ATUALIZAR TIMESTAMP DOS TOKENS
    private async updateTokensUsage(tokenIds: string[]): Promise<void> {
        try {
            await prisma.pushToken.updateMany({
                where: {
                    id: { in: tokenIds }
                },
                data: {
                    lastUsed: new Date()
                }
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar timestamp dos tokens:', error);
        }
    }

    // ✅ ENVIAR NOTIFICAÇÃO DE EMERGÊNCIA (ignora preferências)
    async sendEmergencyNotification(userId: string, notification: PushNotificationData): Promise<boolean> {
        return this.sendToUser(
            { userId, notificationType: 'emergency' },
            { ...notification, priority: 'high' }
        );
    }

    // ✅ BROADCAST PARA TODOS OS USUÁRIOS ATIVOS
    async broadcastToAllUsers(notification: PushNotificationData, notificationType?: string): Promise<void> {
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

            console.log(`📢 Broadcast enviado para ${userIds.length} usuários`);
        } catch (error) {
            console.error('❌ Erro no broadcast:', error);
        }
    }

    // ✅ LIMPEZA DE TOKENS ANTIGOS (para uso em CRON jobs)
    async cleanupOldTokens(daysOld: number = 30): Promise<void> {
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

            console.log(`🧹 ${result.count} tokens antigos desativados`);
        } catch (error) {
            console.error('❌ Erro na limpeza de tokens:', error);
        }
    }
}

// ✅ EXPORTAR SINGLETON
export const pushNotificationService = new PushNotificationService();

// ✅ FUNÇÕES DE CONVENIÊNCIA PARA DIFERENTES TIPOS DE NOTIFICAÇÃO
export const pushNotifications = {
    // Lembrete de manutenção
    sendMaintenanceReminder: (userId: string, vehicleName: string, maintenanceType: string) => {
        return pushNotificationService.sendToUser(
            { userId, notificationType: 'maintenance_reminder' },
            {
                title: '🔧 Lembrete de Manutenção',
                body: `${vehicleName} precisa de ${maintenanceType}`,
                data: { type: 'maintenance_reminder', actionUrl: '/maintenances/new' },
                badge: 1
            }
        );
    },

    // Lembrete de inspeção
    sendInspectionReminder: (userId: string, vehicleName: string) => {
        return pushNotificationService.sendToUser(
            { userId, notificationType: 'inspection_reminder' },
            {
                title: '📋 Lembrete de Inspeção',
                body: `${vehicleName} precisa de inspeção`,
                data: { type: 'inspection_reminder', actionUrl: '/inspections/new' },
                badge: 1
            }
        );
    },

    // Notificação de pagamento
    sendPaymentReminder: (userId: string, amount: number, dueDate: string) => {
        return pushNotificationService.sendToUser(
            { userId, notificationType: 'payment_reminder' },
            {
                title: '💰 Lembrete de Pagamento',
                body: `Pagamento de R$ ${amount.toFixed(2)} vence em ${dueDate}`,
                data: { type: 'payment_reminder', actionUrl: '/payments' },
                badge: 1
            }
        );
    },

    // Promoção
    sendPromotionalOffer: (userId: string, title: string, description: string) => {
        return pushNotificationService.sendToUser(
            { userId, notificationType: 'promotional' },
            {
                title: `🎯 ${title}`,
                body: description,
                data: { type: 'promotional', actionUrl: '/promotions' }
            }
        );
    }
};