import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';

interface NotificationContextData {
    isInitialized: boolean;
    pushToken: string | null;
    initializeNotifications: () => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const { user } = useAuthContext();

    // ✅ VERSÃO SIMPLIFICADA PARA EXPO GO (SEM PUSH NOTIFICATIONS)
    useEffect(() => {
        if (user) {
            console.log('🔔 NotificationProvider: Usuário logado, inicializando versão Expo Go...');
            initializePushNotifications();
        }
    }, [user]);

    const initializePushNotifications = async () => {
        try {
            console.log('🔔 Inicializando sistema de notificações (Expo Go)...');

            // Solicitar permissões para notificações locais
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
                console.log('✅ Permissões de notificação concedidas');
                setIsInitialized(true);
                setPushToken('expo-go-simulation-token');
            } else {
                console.warn('⚠️ Permissões de notificação negadas');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar notificações:', error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await Notifications.dismissAllNotificationsAsync();
            await Notifications.setBadgeCountAsync(0);
            console.log('🧹 Notificações locais limpas');
        } catch (error) {
            console.error('❌ Erro ao limpar notificações:', error);
        }
    };

    const scheduleLocalNotification = async (title: string, body: string, data?: any) => {
        try {
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
            console.log('📅 Notificação local agendada:', title);
        } catch (error) {
            console.error('❌ Erro ao agendar notificação local:', error);
        }
    };

    const contextValue: NotificationContextData = {
        isInitialized,
        pushToken,
        initializeNotifications: initializePushNotifications,
        clearAllNotifications,
        scheduleLocalNotification,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};