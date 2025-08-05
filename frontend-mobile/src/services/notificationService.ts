import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Vehicle } from '../types';
import {
    NOTIFICATION_MESSAGES,
    NotificationCategory,
    NotificationContext,
    NotificationHistory,
    NotificationPriority,
    NotificationRule,
    NotificationSettings,
    NotificationStatus,
    NotificationType,
    ScheduledNotification
} from '../types/notification.types';

// Configuração inicial do Expo Notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    private static instance: NotificationService;
    private initialized = false;

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    // 🚀 Inicialização do serviço
    async initialize(userId: string): Promise<void> {
        if (this.initialized) return;

        try {
            // Solicitar permissões
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Permissão de notificação negada');
                return;
            }

            // Configurar canal no Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('maintenance', {
                    name: 'Manutenções',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#F7C910',
                });

                await Notifications.setNotificationChannelAsync('tips', {
                    name: 'Dicas e Cuidados',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 250],
                    lightColor: '#F7C910',
                });
            }

            // Inicializar configurações padrão se não existirem
            await this.initializeDefaultSettings(userId);

            this.initialized = true;
            console.log('NotificationService inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar NotificationService:', error);
        }
    }

    // ⚙️ Configurações padrão
    private async initializeDefaultSettings(userId: string): Promise<void> {
        const existingSettings = await this.getSettings(userId);
        if (existingSettings) return;

        const defaultSettings: NotificationSettings = {
            id: `settings_${userId}`,
            userId,
            maintenanceNotifications: {
                enabled: true,
                byMileage: true,
                byTime: true,
                recommendations: true,
                advanceNotice: 15
            },
            inspectionNotifications: {
                enabled: false, // Desabilitado por padrão (opcional)
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.saveSettings(defaultSettings);
    }

    // 📊 Análise Inteligente - Baseada em dados do usuário
    async analyzeMaintenancePattern(userId: string, vehicles: Vehicle[]): Promise<NotificationContext[]> {
        const contexts: NotificationContext[] = [];

        for (const vehicle of vehicles) {
            // Simular análise baseada em dados reais que viriam do histórico
            const context: NotificationContext = {
                userId,
                vehicleId: vehicle.id,
                currentMileage: 0, // Será obtido do histórico de manutenções
                vehicleAge: new Date().getFullYear() - (vehicle.modelYear || 2020),
                monthlyMileage: this.estimateMonthlyMileage(vehicle),
                maintenancePattern: this.analyzePattern(vehicle),
                seasonalContext: this.getCurrentSeason()
            };

            contexts.push(context);
        }

        return contexts;
    }

    // 🔍 Estimativa de quilometragem mensal
    private estimateMonthlyMileage(vehicle: Vehicle): number {
        // Lógica simplificada - em produção, seria baseada em histórico real
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - (vehicle.modelYear || currentYear);

        if (vehicleAge > 0) {
            // Estimativa baseada na idade do veículo (média brasileira: 15k km/ano)
            return Math.round(15000 / 12);
        }
        return 1000; // Padrão para veículos novos
    }

    // 📈 Análise de padrão de manutenção
    private analyzePattern(vehicle: Vehicle): 'regular' | 'irregular' | 'delayed' {
        // Em produção, analisaria o histórico de manutenções
        // Por enquanto, simulamos baseado na idade do veículo
        const age = new Date().getFullYear() - (vehicle.modelYear || 2020);

        // Lógica simplificada baseada na idade
        if (age > 10) return 'irregular'; // Veículos mais antigos tendem a ter mais problemas
        if (age < 3) return 'regular';    // Veículos novos geralmente seguem revisões
        return 'regular';
    }

    // 🌍 Contexto sazonal
    private getCurrentSeason(): 'summer' | 'winter' | 'rainy' | 'dry' {
        const month = new Date().getMonth() + 1; // 1-12
        if (month >= 12 || month <= 2) return 'summer'; // Verão no Brasil
        if (month >= 6 && month <= 8) return 'winter';  // Inverno no Brasil
        if (month >= 10 && month <= 4) return 'rainy';  // Época de chuvas
        return 'dry';
    }

    // 🔔 Gerar notificações inteligentes
    async generateSmartNotifications(userId: string, vehicles: Vehicle[]): Promise<ScheduledNotification[]> {
        const settings = await this.getSettings(userId);
        if (!settings?.general.pushEnabled) return [];

        const contexts = await this.analyzeMaintenancePattern(userId, vehicles);
        const notifications: ScheduledNotification[] = [];

        for (const context of contexts) {
            // Notificações de manutenção por quilometragem
            if (settings.maintenanceNotifications.enabled && settings.maintenanceNotifications.byMileage) {
                notifications.push(...await this.generateMileageNotifications(context, settings));
            }

            // Notificações de manutenção por tempo
            if (settings.maintenanceNotifications.enabled && settings.maintenanceNotifications.byTime) {
                notifications.push(...await this.generateTimeBasedNotifications(context, settings));
            }

            // Dicas sazonais
            if (settings.tipsNotifications.enabled && settings.tipsNotifications.seasonal) {
                notifications.push(...await this.generateSeasonalTips(context, settings));
            }
        }

        return notifications;
    }

    // 📏 Notificações baseadas em quilometragem
    private async generateMileageNotifications(
        context: NotificationContext,
        settings: NotificationSettings
    ): Promise<ScheduledNotification[]> {
        const notifications: ScheduledNotification[] = [];
        const currentMileage = context.currentMileage || 0;

        // Verificar próxima troca de óleo
        const nextOilChange = Math.ceil(currentMileage / 10000) * 10000;
        const mileageUntilOil = nextOilChange - currentMileage;

        if (mileageUntilOil <= 1000 && mileageUntilOil > 0) {
            const scheduledFor = new Date();
            scheduledFor.setDate(scheduledFor.getDate() + 7); // Agendar para 1 semana

            const rule: NotificationRule = {
                id: `oil_change_${context.vehicleId}`,
                type: NotificationType.MAINTENANCE_MILEAGE,
                category: NotificationCategory.MAINTENANCE,
                trigger: { type: 'mileage', value: nextOilChange, unit: 'km' },
                title: NOTIFICATION_MESSAGES.MAINTENANCE.OIL_CHANGE.title,
                message: NOTIFICATION_MESSAGES.MAINTENANCE.OIL_CHANGE.message,
                priority: NotificationPriority.HIGH,
                enabled: true
            };

            notifications.push({
                id: `scheduled_${rule.id}_${Date.now()}`,
                userId: context.userId,
                vehicleId: context.vehicleId,
                rule,
                scheduledFor: scheduledFor.toISOString(),
                data: { currentMileage, nextMileage: nextOilChange },
                created: new Date().toISOString()
            });
        }

        return notifications;
    }

    // ⏰ Notificações baseadas em tempo
    private async generateTimeBasedNotifications(
        context: NotificationContext,
        settings: NotificationSettings
    ): Promise<ScheduledNotification[]> {
        const notifications: ScheduledNotification[] = [];

        // Lembrete de revisão semestral
        const scheduledFor = new Date();
        scheduledFor.setMonth(scheduledFor.getMonth() + 6);

        const rule: NotificationRule = {
            id: `maintenance_time_${context.vehicleId}`,
            type: NotificationType.MAINTENANCE_TIME,
            category: NotificationCategory.MAINTENANCE,
            trigger: { type: 'time', value: 6, unit: 'months' },
            title: NOTIFICATION_MESSAGES.MAINTENANCE.GENERAL_MAINTENANCE.title,
            message: NOTIFICATION_MESSAGES.MAINTENANCE.GENERAL_MAINTENANCE.message,
            priority: NotificationPriority.MEDIUM,
            enabled: true
        };

        notifications.push({
            id: `scheduled_${rule.id}_${Date.now()}`,
            userId: context.userId,
            vehicleId: context.vehicleId,
            rule,
            scheduledFor: scheduledFor.toISOString(),
            data: { months: 6 },
            created: new Date().toISOString()
        });

        return notifications;
    }

    // 🌱 Dicas sazonais
    private async generateSeasonalTips(
        context: NotificationContext,
        settings: NotificationSettings
    ): Promise<ScheduledNotification[]> {
        const notifications: ScheduledNotification[] = [];
        const season = context.seasonalContext || this.getCurrentSeason();

        const seasonalMessage = NOTIFICATION_MESSAGES.TIPS.SEASONAL[season.toUpperCase() as keyof typeof NOTIFICATION_MESSAGES.TIPS.SEASONAL];

        if (seasonalMessage) {
            const scheduledFor = new Date();
            scheduledFor.setDate(scheduledFor.getDate() + 30); // Próximo mês

            const rule: NotificationRule = {
                id: `tip_seasonal_${season}_${context.vehicleId}`,
                type: NotificationType.TIP_SEASONAL,
                category: NotificationCategory.TIPS,
                trigger: { type: 'condition' },
                title: seasonalMessage.title,
                message: seasonalMessage.message,
                priority: NotificationPriority.LOW,
                enabled: true
            };

            notifications.push({
                id: `scheduled_${rule.id}_${Date.now()}`,
                userId: context.userId,
                vehicleId: context.vehicleId,
                rule,
                scheduledFor: scheduledFor.toISOString(),
                data: { season },
                created: new Date().toISOString()
            });
        }

        return notifications;
    }

    // 📱 Agendar notificação push
    async scheduleNotification(notification: ScheduledNotification): Promise<string> {
        const settings = await this.getSettings(notification.userId);
        if (!settings?.general.pushEnabled) return '';

        const trigger = new Date(notification.scheduledFor);

        // Ajustar para horário preferido do usuário
        const [hours, minutes] = settings.general.preferredTime.split(':');
        trigger.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Calcular segundos até a data agendada
        const now = new Date();
        const secondsUntilTrigger = Math.max(0, Math.floor((trigger.getTime() - now.getTime()) / 1000));

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.rule.title,
                body: this.replacePlaceholders(notification.rule.message, notification),
                sound: settings.general.sound,
                priority: this.getPlatformPriority(notification.rule.priority),
                categoryIdentifier: notification.rule.category,
                data: {
                    notificationId: notification.id,
                    vehicleId: notification.vehicleId,
                    type: notification.rule.type,
                    ...notification.data
                }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsUntilTrigger
            }
        });

        // Salvar no histórico
        await this.saveToHistory({
            id: notification.id,
            userId: notification.userId,
            vehicleId: notification.vehicleId,
            type: notification.rule.type,
            category: notification.rule.category,
            title: notification.rule.title,
            message: this.replacePlaceholders(notification.rule.message, notification),
            scheduledFor: notification.scheduledFor,
            status: NotificationStatus.SCHEDULED,
            priority: notification.rule.priority,
            relatedId: notification.data?.maintenanceId,
            createdAt: notification.created
        });

        return identifier;
    }

    // 🔄 Substituir placeholders na mensagem
    private replacePlaceholders(message: string, notification: ScheduledNotification): string {
        let result = message;

        // Placeholders básicos
        if (notification.data) {
            Object.keys(notification.data).forEach(key => {
                result = result.replace(`{${key}}`, notification.data[key]);
            });
        }

        return result;
    }

    // 📊 Obter prioridade para a plataforma
    private getPlatformPriority(priority: NotificationPriority): Notifications.AndroidNotificationPriority {
        switch (priority) {
            case NotificationPriority.CRITICAL: return Notifications.AndroidNotificationPriority.MAX;
            case NotificationPriority.HIGH: return Notifications.AndroidNotificationPriority.HIGH;
            case NotificationPriority.MEDIUM: return Notifications.AndroidNotificationPriority.DEFAULT;
            case NotificationPriority.LOW: return Notifications.AndroidNotificationPriority.LOW;
            default: return Notifications.AndroidNotificationPriority.DEFAULT;
        }
    }

    // 💾 Gerenciamento de configurações
    async getSettings(userId: string): Promise<NotificationSettings | null> {
        try {
            const data = await AsyncStorage.getItem(`notification_settings_${userId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erro ao carregar configurações de notificação:', error);
            return null;
        }
    }

    async saveSettings(settings: NotificationSettings): Promise<void> {
        try {
            settings.updatedAt = new Date().toISOString();
            await AsyncStorage.setItem(`notification_settings_${settings.userId}`, JSON.stringify(settings));
        } catch (error) {
            console.error('Erro ao salvar configurações de notificação:', error);
        }
    }

    // 📚 Gerenciamento de histórico
    async getHistory(userId: string, limit: number = 50): Promise<NotificationHistory[]> {
        try {
            const data = await AsyncStorage.getItem(`notification_history_${userId}`);
            const history: NotificationHistory[] = data ? JSON.parse(data) : [];
            return history
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit);
        } catch (error) {
            console.error('Erro ao carregar histórico de notificações:', error);
            return [];
        }
    }

    async saveToHistory(notification: NotificationHistory): Promise<void> {
        try {
            const existing = await this.getHistory(notification.userId, 100);
            const updated = [notification, ...existing].slice(0, 100); // Manter apenas 100 últimas
            await AsyncStorage.setItem(`notification_history_${notification.userId}`, JSON.stringify(updated));
        } catch (error) {
            console.error('Erro ao salvar no histórico:', error);
        }
    }

    // 🧹 Cancelar notificações
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    async cancelNotification(identifier: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }
}

// Platform import para detectar sistema operacional
import { Platform } from 'react-native';

export default NotificationService;
