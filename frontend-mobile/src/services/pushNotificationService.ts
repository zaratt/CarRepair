import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://automazo-production.up.railway.app/api';

// ✅ CONFIGURAÇÃO PADRÃO EXPO NOTIFICATIONS
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushNotificationService {
    initializePushNotifications(): Promise<string | null>;
    registerForPushNotifications(): Promise<string | null>;
    handleNotificationReceived(notification: Notifications.Notification): void;
    handleNotificationResponse(response: Notifications.NotificationResponse): void;
    setupNotificationListeners(): void;
    clearAllNotifications(): Promise<void>;
    scheduleLocalNotification(title: string, body: string, data?: any): Promise<void>;
}

class PushNotificationServiceImpl implements PushNotificationService {
    private notificationListener: Notifications.Subscription | null = null;
    private responseListener: Notifications.Subscription | null = null;
    private currentToken: string | null = null;

    // ✅ INICIALIZAÇÃO COMPLETA
    async initializePushNotifications(): Promise<string | null> {
        console.log('🔔 Inicializando sistema de push notifications...');

        if (!Device.isDevice) {
            console.warn('⚠️ Push notifications não funcionam no simulador');
            return null;
        }

        // Verificar permissões
        const permission = await this.requestPermissions();
        if (!permission) {
            console.error('❌ Permissões de notificação negadas');
            return null;
        }

        // Registrar para push notifications
        const token = await this.registerForPushNotifications();
        if (token) {
            this.currentToken = token;
            await this.savePushToken(token);
            console.log('✅ Push token registrado:', token.substring(0, 20) + '...');
        }

        // Configurar listeners
        this.setupNotificationListeners();

        return token;
    }

    // ✅ SOLICITAR PERMISSÕES
    private async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.error('❌ Permissão de notificação não concedida');
            return false;
        }

        // Configurações específicas do Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'CarRepair Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#1976d2',
                sound: 'default',
                enableVibrate: true,
                enableLights: true,
            });
        }

        return true;
    }

    // ✅ REGISTRAR PUSH TOKEN
    async registerForPushNotifications(): Promise<string | null> {
        try {
            let token: string;

            if (Device.isDevice) {
                const { data } = await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
                });
                token = data;
            } else {
                console.warn('⚠️ Deve usar dispositivo físico para push notifications');
                return null;
            }

            console.log('📱 Push token gerado:', token.substring(0, 20) + '...');
            return token;
        } catch (error) {
            console.error('❌ Erro ao registrar push token:', error);
            return null;
        }
    }

    // ✅ SALVAR TOKEN NO BACKEND
    private async savePushToken(token: string): Promise<void> {
        try {
            // Verificar se o token mudou
            const storedToken = await AsyncStorage.getItem('pushToken');
            if (storedToken === token) {
                console.log('🔄 Push token já está atualizado');
                return;
            }

            // Salvar no backend
            await axios.post(`${API_URL}/notifications/register-token`, {
                pushToken: token,
                deviceInfo: {
                    platform: Platform.OS,
                    deviceName: Device.deviceName,
                    osVersion: Device.osVersion,
                    modelName: Device.modelName,
                }
            });

            // Salvar localmente
            await AsyncStorage.setItem('pushToken', token);
            console.log('✅ Push token salvo no backend');

        } catch (error) {
            console.error('❌ Erro ao salvar push token:', error);
        }
    }

    // ✅ CONFIGURAR LISTENERS DE NOTIFICAÇÃO
    setupNotificationListeners(): void {
        // Listener para notificações recebidas (app aberto)
        this.notificationListener = Notifications.addNotificationReceivedListener(
            this.handleNotificationReceived.bind(this)
        );

        // Listener para cliques em notificações
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            this.handleNotificationResponse.bind(this)
        );

        console.log('✅ Listeners de notificação configurados');
    }

    // ✅ TRATAR NOTIFICAÇÃO RECEBIDA
    handleNotificationReceived(notification: Notifications.Notification): void {
        console.log('📨 Notificação recebida:', notification.request.content.title);

        // Atualizar badge do app
        Notifications.setBadgeCountAsync(notification.request.content.badge || 0);

        // Você pode adicionar lógica adicional aqui
        // Por exemplo, atualizar state global, cache, etc.
    }

    // ✅ TRATAR CLIQUE EM NOTIFICAÇÃO
    handleNotificationResponse(response: Notifications.NotificationResponse): void {
        const data = response.notification.request.content.data;
        console.log('👆 Notificação clicada:', data);

        // Navegação baseada nos dados da notificação
        if (data && typeof data === 'object' && 'actionUrl' in data && typeof data.actionUrl === 'string') {
            this.handleDeepLink(data.actionUrl);
        }
    }

    // ✅ DEEP LINKING VIA NOTIFICAÇÕES
    private handleDeepLink(actionUrl: string): void {
        // Esta função será implementada quando integrarmos com a navegação
        console.log('🔗 Deep link:', actionUrl);

        // Exemplos de navegação que serão implementados:
        // if (actionUrl.includes('/inspections/')) { ... }
        // if (actionUrl.includes('/maintenances/')) { ... }
    }

    // ✅ LIMPAR TODAS AS NOTIFICAÇÕES
    async clearAllNotifications(): Promise<void> {
        await Notifications.dismissAllNotificationsAsync();
        await Notifications.setBadgeCountAsync(0);
        console.log('🧹 Todas as notificações foram limpas');
    }

    // ✅ AGENDAR NOTIFICAÇÃO LOCAL
    async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: {
                seconds: 1,
            } as Notifications.TimeIntervalTriggerInput,
        });
    }

    // ✅ CLEANUP
    cleanup(): void {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }

    // ✅ GETTER PARA TOKEN ATUAL
    getCurrentToken(): string | null {
        return this.currentToken;
    }
}

// ✅ EXPORTAR SINGLETON
export const pushNotificationService = new PushNotificationServiceImpl();

// ✅ HOOKS PARA REACT
export const usePushNotifications = () => {
    const initializeNotifications = async () => {
        return await pushNotificationService.initializePushNotifications();
    };

    const clearNotifications = async () => {
        await pushNotificationService.clearAllNotifications();
    };

    const scheduleLocal = async (title: string, body: string, data?: any) => {
        await pushNotificationService.scheduleLocalNotification(title, body, data);
    };

    return {
        initializeNotifications,
        clearNotifications,
        scheduleLocal,
        getCurrentToken: () => pushNotificationService.getCurrentToken(),
    };
};