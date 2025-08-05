import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    NotificationCategory,
    NotificationHistory,
    NotificationPriority,
    NotificationSettings,
    NotificationStats,
    NotificationStatus,
    NotificationType
} from '../types/notification.types';

// 📊 Dados Mock para Demonstração
export const mockNotificationHistory: NotificationHistory[] = [
    {
        id: 'notif_001',
        userId: 'user1',
        vehicleId: 'vehicle_001',
        type: NotificationType.MAINTENANCE_MILEAGE,
        category: NotificationCategory.MAINTENANCE,
        title: '🔧 Hora da troca de óleo!',
        message: 'Seu Honda Civic está próximo de 50.000km. Que tal agendar a troca de óleo?',
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        sentAt: new Date().toISOString(),
        status: NotificationStatus.DELIVERED,
        priority: NotificationPriority.HIGH,
        actionTaken: 'acted',
        relatedId: 'maintenance_001',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 dia atrás
    },
    {
        id: 'notif_002',
        userId: 'user1',
        vehicleId: 'vehicle_002',
        type: NotificationType.MAINTENANCE_TIME,
        category: NotificationCategory.MAINTENANCE,
        title: '⚙️ Revisão preventiva',
        message: 'Já faz 6 meses desde a última revisão do seu ABC-1234. Vamos cuidar bem dele?',
        scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias
        sentAt: new Date().toISOString(),
        status: NotificationStatus.DELIVERED,
        priority: NotificationPriority.MEDIUM,
        actionTaken: 'viewed',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 horas atrás
    },
    {
        id: 'notif_003',
        userId: 'user1',
        type: NotificationType.TIP_SEASONAL,
        category: NotificationCategory.TIPS,
        title: '☀️ Cuidados de verão',
        message: 'Verifique o ar condicionado e a pressão dos pneus. O calor pode afetar seu veículo!',
        scheduledFor: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        status: NotificationStatus.DELIVERED,
        priority: NotificationPriority.LOW,
        actionTaken: 'dismissed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias atrás
    },
    {
        id: 'notif_004',
        userId: 'user1',
        vehicleId: 'vehicle_001',
        type: NotificationType.MAINTENANCE_RECOMMENDATION,
        category: NotificationCategory.MAINTENANCE,
        title: '💡 Recomendação personalizada',
        message: 'Baseado no seu histórico, sugerimos verificar os freios no seu ABC-1234',
        scheduledFor: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
        status: NotificationStatus.SCHEDULED,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hora atrás
    },
    {
        id: 'notif_005',
        userId: 'user1',
        type: NotificationType.TIP_PERSONALIZED,
        category: NotificationCategory.TIPS,
        title: '📊 Análise do seu perfil',
        message: 'Você roda em média 1.200km/mês. Considere revisões a cada 8 meses.',
        scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: NotificationStatus.DELIVERED,
        priority: NotificationPriority.LOW,
        actionTaken: 'viewed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dias atrás
    }
];

// 🔔 Configurações padrão para demonstração
export const mockNotificationSettings: NotificationSettings = {
    id: 'settings_user1',
    userId: 'user1',
    maintenanceNotifications: {
        enabled: true,
        byMileage: true,
        byTime: true,
        recommendations: true,
        advanceNotice: 15
    },
    inspectionNotifications: {
        enabled: false, // Desabilitado por padrão conforme discussão
        sellingReminder: false,
        buyingReminder: false,
        annualSuggestion: false
    },
    tipsNotifications: {
        enabled: true,
        seasonal: true,
        personalized: true,
        performance: false
    },
    general: {
        preferredTime: '09:00',
        maxFrequency: 'weekly',
        sound: true,
        vibration: true,
        pushEnabled: true
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 semana atrás
    updatedAt: new Date().toISOString()
};

// 📈 Funções para manipular dados mock
class MockNotificationData {
    // Obter configurações do usuário
    static async getSettings(userId: string): Promise<NotificationSettings | null> {
        try {
            const data = await AsyncStorage.getItem(`notification_settings_${userId}`);
            if (data) {
                return JSON.parse(data);
            }

            // Se não existe, retornar configurações padrão
            const defaultSettings = {
                ...mockNotificationSettings,
                id: `settings_${userId}`,
                userId
            };
            await this.saveSettings(defaultSettings);
            return defaultSettings;
        } catch (error) {
            console.error('Erro ao carregar configurações mock:', error);
            return mockNotificationSettings;
        }
    }

    // Salvar configurações
    static async saveSettings(settings: NotificationSettings): Promise<void> {
        try {
            settings.updatedAt = new Date().toISOString();
            await AsyncStorage.setItem(`notification_settings_${settings.userId}`, JSON.stringify(settings));
        } catch (error) {
            console.error('Erro ao salvar configurações mock:', error);
        }
    }

    // Obter histórico de notificações
    static async getHistory(userId: string, limit: number = 50): Promise<NotificationHistory[]> {
        try {
            const data = await AsyncStorage.getItem(`notification_history_${userId}`);
            if (data) {
                const history: NotificationHistory[] = JSON.parse(data);
                return history
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, limit);
            }

            // Se não existe, usar dados mock
            const mockHistory = mockNotificationHistory.filter(n => n.userId === userId);
            await this.saveHistory(userId, mockHistory);
            return mockHistory;
        } catch (error) {
            console.error('Erro ao carregar histórico mock:', error);
            return mockNotificationHistory.filter(n => n.userId === userId);
        }
    }

    // Salvar histórico
    static async saveHistory(userId: string, history: NotificationHistory[]): Promise<void> {
        try {
            await AsyncStorage.setItem(`notification_history_${userId}`, JSON.stringify(history));
        } catch (error) {
            console.error('Erro ao salvar histórico mock:', error);
        }
    }

    // Adicionar nova notificação ao histórico
    static async addToHistory(notification: NotificationHistory): Promise<void> {
        try {
            const existing = await this.getHistory(notification.userId, 100);
            const updated = [notification, ...existing].slice(0, 100); // Manter apenas 100 últimas
            await this.saveHistory(notification.userId, updated);
        } catch (error) {
            console.error('Erro ao adicionar ao histórico mock:', error);
        }
    }

    // Marcar notificação como lida/ação tomada
    static async markNotificationAction(
        userId: string,
        notificationId: string,
        action: 'viewed' | 'dismissed' | 'acted' | 'scheduled_maintenance'
    ): Promise<void> {
        try {
            const history = await this.getHistory(userId, 100);
            const updated = history.map(notification =>
                notification.id === notificationId
                    ? { ...notification, actionTaken: action }
                    : notification
            );
            await this.saveHistory(userId, updated);
        } catch (error) {
            console.error('Erro ao marcar ação da notificação:', error);
        }
    }

    // Obter estatísticas
    static async getStats(userId: string): Promise<NotificationStats> {
        try {
            const history = await this.getHistory(userId);

            const stats: NotificationStats = {
                total: history.length,
                sent: history.filter(n => n.sentAt).length,
                delivered: history.filter(n => n.status === NotificationStatus.DELIVERED).length,
                actionTaken: history.filter(n => n.actionTaken && n.actionTaken !== 'dismissed').length,
                byCategory: {
                    [NotificationCategory.MAINTENANCE]: history.filter(n => n.category === NotificationCategory.MAINTENANCE).length,
                    [NotificationCategory.INSPECTION]: history.filter(n => n.category === NotificationCategory.INSPECTION).length,
                    [NotificationCategory.TIPS]: history.filter(n => n.category === NotificationCategory.TIPS).length,
                    [NotificationCategory.DOCUMENTS]: history.filter(n => n.category === NotificationCategory.DOCUMENTS).length
                },
                byType: {} as Record<NotificationType, number>,
                effectiveness: 0
            };

            // Calcular por tipo
            Object.values(NotificationType).forEach(type => {
                stats.byType[type] = history.filter(n => n.type === type).length;
            });

            // Calcular efetividade
            const delivered = stats.delivered;
            const acted = stats.actionTaken;
            stats.effectiveness = delivered > 0 ? Math.round((acted / delivered) * 100) : 0;

            return stats;
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
            return {
                total: 0,
                sent: 0,
                delivered: 0,
                actionTaken: 0,
                byCategory: {
                    [NotificationCategory.MAINTENANCE]: 0,
                    [NotificationCategory.INSPECTION]: 0,
                    [NotificationCategory.TIPS]: 0,
                    [NotificationCategory.DOCUMENTS]: 0
                },
                byType: {} as Record<NotificationType, number>,
                effectiveness: 0
            };
        }
    }

    // Simular criação de notificação agendada
    static async createScheduledNotification(
        userId: string,
        vehicleId: string | undefined,
        type: NotificationType,
        title: string,
        message: string,
        scheduledFor: Date,
        priority: NotificationPriority = NotificationPriority.MEDIUM
    ): Promise<string> {
        const notification: NotificationHistory = {
            id: `notif_${Date.now()}`,
            userId,
            vehicleId,
            type,
            category: this.getCategoryFromType(type),
            title,
            message,
            scheduledFor: scheduledFor.toISOString(),
            status: NotificationStatus.SCHEDULED,
            priority,
            createdAt: new Date().toISOString()
        };

        await this.addToHistory(notification);
        return notification.id;
    }

    // Obter categoria baseado no tipo
    private static getCategoryFromType(type: NotificationType): NotificationCategory {
        if (type.startsWith('maintenance')) return NotificationCategory.MAINTENANCE;
        if (type.startsWith('inspection')) return NotificationCategory.INSPECTION;
        if (type.startsWith('tip')) return NotificationCategory.TIPS;
        return NotificationCategory.DOCUMENTS;
    }

    // Simular próximas notificações agendadas
    static async getUpcomingNotifications(userId: string, days: number = 30): Promise<NotificationHistory[]> {
        const history = await this.getHistory(userId);
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return history.filter(notification => {
            const scheduledDate = new Date(notification.scheduledFor);
            return scheduledDate >= now &&
                scheduledDate <= futureDate &&
                notification.status === NotificationStatus.SCHEDULED;
        }).sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    }

    // Cancelar notificação agendada
    static async cancelNotification(userId: string, notificationId: string): Promise<void> {
        try {
            const history = await this.getHistory(userId);
            const updated = history.map(notification =>
                notification.id === notificationId
                    ? { ...notification, status: NotificationStatus.CANCELLED }
                    : notification
            );
            await this.saveHistory(userId, updated);
        } catch (error) {
            console.error('Erro ao cancelar notificação:', error);
        }
    }
}

export default MockNotificationData;
