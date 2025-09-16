import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePushNotifications } from '../services/pushNotificationService';
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
    const navigation = useNavigation();
    const { initializeNotifications, clearNotifications, scheduleLocal } = usePushNotifications();

    useEffect(() => {
        if (user) {
            initializePushNotifications();
        }
    }, [user]);

    const initializePushNotifications = async () => {
        try {
            console.log('🔔 Inicializando sistema de push notifications...');

            const token = await initializeNotifications();
            if (token) {
                setPushToken(token);
                setIsInitialized(true);
                console.log('✅ Push notifications inicializadas com sucesso');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar push notifications:', error);
        }
    };

    // ✅ CONFIGURAR LISTENERS DE NAVEGAÇÃO
    useEffect(() => {
        if (!isInitialized) return;

        // Listener para notificações recebidas enquanto app está aberto
        const notificationListener = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('📨 Notificação recebida (app aberto):', notification.request.content.title);

                // Atualizar badge
                Notifications.setBadgeCountAsync(notification.request.content.badge || 0);

                // Aqui você pode adicionar lógica adicional, como:
                // - Mostrar um toast personalizado
                // - Atualizar cache do React Query
                // - Etc.
            }
        );

        // Listener para cliques em notificações
        const responseListener = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                console.log('👆 Notificação clicada:', data);

                // Navegar baseado nos dados da notificação
                handleNotificationNavigation(data);
            }
        );

        // Cleanup
        return () => {
            Notifications.removeNotificationSubscription(notificationListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, [isInitialized, navigation]);

    // ✅ NAVEGAÇÃO BASEADA EM DEEP LINKS
    const handleNotificationNavigation = (data: any) => {
        if (!data || !data.actionUrl) return;

        try {
            const actionUrl = data.actionUrl as string;

            if (actionUrl.includes('/inspections/')) {
                const inspectionId = actionUrl.split('/').pop();
                if (inspectionId && inspectionId !== 'new') {
                    (navigation as any).navigate('InspectionDetail', { inspectionId });
                } else {
                    (navigation as any).navigate('InspectionForm', {});
                }
            } else if (actionUrl.includes('/maintenances/')) {
                const maintenanceId = actionUrl.split('/').pop();
                if (maintenanceId && maintenanceId !== 'new') {
                    (navigation as any).navigate('MaintenanceDetail', { maintenanceId });
                } else {
                    (navigation as any).navigate('MaintenanceForm', {});
                }
            } else if (actionUrl.includes('/notifications')) {
                (navigation as any).navigate('Notifications');
            } else if (actionUrl.includes('/profile')) {
                (navigation as any).navigate('ProfileMain');
            }
        } catch (error) {
            console.error('❌ Erro na navegação por notificação:', error);
        }
    };

    // ✅ HANDLER PARA NOTIFICAÇÕES EM BACKGROUND
    useEffect(() => {
        if (!isInitialized) return;

        // Quando o app é aberto via notificação (estava fechado)
        const getInitialNotification = async () => {
            const initialNotification = await Notifications.getLastNotificationResponseAsync();
            if (initialNotification) {
                console.log('🚀 App aberto via notificação:', initialNotification.notification.request.content.data);
                handleNotificationNavigation(initialNotification.notification.request.content.data);
            }
        };

        getInitialNotification();
    }, [isInitialized]);

    const clearAllNotifications = async () => {
        try {
            await clearNotifications();
            console.log('🧹 Todas as notificações foram limpas');
        } catch (error) {
            console.error('❌ Erro ao limpar notificações:', error);
        }
    };

    const scheduleLocalNotification = async (title: string, body: string, data?: any) => {
        try {
            await scheduleLocal(title, body, data);
            console.log('📅 Notificação local agendada');
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