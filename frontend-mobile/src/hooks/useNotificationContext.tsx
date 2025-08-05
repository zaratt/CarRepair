import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
    CreateNotificationRequest,
    DeviceToken,
    NotificationFilters,
    NotificationPreferences,
    UpdateNotificationRequest
} from '../api/notification.api';
import {
    useDeviceTokens as useDeviceTokensApi,
    useNotificationHelpers as useNotificationHelpersApi,
    useNotificationPreferences as useNotificationPreferencesApi,
    useNotifications as useNotificationsApi
} from './useNotifications';

// 🔔 Interface unificada do contexto de notificações
interface NotificationContextData {
    // 📊 Dados
    notifications: any[];
    notificationsCount: number;
    unreadCount: number;
    stats?: {
        total: number;
        unread: number;
        read: number;
        scheduled: number;
        sent: number;
        failed: number;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
    };
    preferences?: NotificationPreferences;
    deviceTokens: DeviceToken[];

    // 🔄 Estados de loading
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isMarkingAsRead: boolean;
    isMarkingAllAsRead: boolean;
    isSendingImmediate: boolean;
    isScheduling: boolean;
    isUpdatingPreferences: boolean;
    isRegisteringToken: boolean;

    // ❌ Erros
    error?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
    markAsReadError?: string;
    sendImmediateError?: string;
    scheduleError?: string;
    preferencesError?: string;
    tokenError?: string;

    // ✅ Estados de sucesso
    createSuccess: boolean;
    updateSuccess: boolean;
    deleteSuccess: boolean;
    markAsReadSuccess: boolean;
    markAllAsReadSuccess: boolean;
    sendImmediateSuccess: boolean;
    scheduleSuccess: boolean;
    preferencesUpdateSuccess: boolean;
    tokenRegisterSuccess: boolean;

    // 🎯 Ações principais
    createNotification: (notificationData: CreateNotificationRequest) => void;
    updateNotification: (notificationId: string, updateData: UpdateNotificationRequest) => void;
    deleteNotification: (notificationId: string) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    sendImmediate: (notificationData: Omit<CreateNotificationRequest, 'scheduledFor'>) => void;
    scheduleNotification: (notificationData: CreateNotificationRequest) => void;

    // ⚙️ Ações de preferências
    updatePreferences: (preferences: Partial<NotificationPreferences>) => void;

    // 📱 Ações de device tokens
    registerDeviceToken: (deviceToken: Omit<DeviceToken, 'isActive'>) => void;

    // 🔔 Helpers para lembretes
    createMaintenanceReminder: (data: any) => void;
    createInspectionReminder: (data: any) => void;
    testNotification: (data: any) => void;

    // 🔄 Utilitários
    refetch: () => void;
    clearErrors: () => void;

    // 🔧 Sistema ativo
    isUsingRealAPI: boolean;
}

// 🎛️ Flag para controlar qual sistema usar
const USE_REAL_API = false; // 🚧 Alterar para true quando backend estiver pronto

// 🔔 Contexto principal
const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

// 🔄 Provider híbrido de notificações
interface NotificationProviderProps {
    children: React.ReactNode;
    filters?: NotificationFilters;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, filters }) => {
    // 🎯 Hooks do sistema real (API)
    const apiHooks = useNotificationsApi(filters);
    const preferencesHooks = useNotificationPreferencesApi();
    const deviceTokensHooks = useDeviceTokensApi();
    const helpersHooks = useNotificationHelpersApi();

    // 🎯 Seleção do sistema ativo
    const contextValue: NotificationContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                notifications: apiHooks.notifications,
                notificationsCount: apiHooks.notificationsCount,
                unreadCount: apiHooks.unreadCount,
                stats: apiHooks.stats ? {
                    total: apiHooks.stats.total || 0,
                    unread: apiHooks.stats.unread || 0,
                    read: apiHooks.stats.read || 0,
                    scheduled: apiHooks.stats.scheduled || 0,
                    sent: apiHooks.stats.sent || 0,
                    failed: apiHooks.stats.failed || 0,
                    byType: apiHooks.stats.byType || {},
                    byPriority: apiHooks.stats.byPriority || {},
                } : undefined,
                preferences: preferencesHooks.preferences,
                deviceTokens: deviceTokensHooks.deviceTokens,
                isLoading: apiHooks.isLoading || preferencesHooks.isLoading || deviceTokensHooks.isLoading,
                isCreating: apiHooks.isCreating,
                isUpdating: apiHooks.isUpdating,
                isDeleting: apiHooks.isDeleting,
                isMarkingAsRead: apiHooks.isMarkingAsRead,
                isMarkingAllAsRead: apiHooks.isMarkingAllAsRead,
                isSendingImmediate: apiHooks.isSendingImmediate,
                isScheduling: apiHooks.isScheduling,
                isUpdatingPreferences: preferencesHooks.isUpdating,
                isRegisteringToken: deviceTokensHooks.isRegistering,
                error: apiHooks.error,
                createError: apiHooks.createError,
                updateError: apiHooks.updateError,
                deleteError: apiHooks.deleteError,
                markAsReadError: apiHooks.markAsReadError,
                sendImmediateError: apiHooks.sendImmediateError,
                scheduleError: apiHooks.scheduleError,
                preferencesError: preferencesHooks.error || preferencesHooks.updateError,
                tokenError: deviceTokensHooks.error || deviceTokensHooks.registerError,
                createSuccess: apiHooks.createSuccess,
                updateSuccess: apiHooks.updateSuccess,
                deleteSuccess: apiHooks.deleteSuccess,
                markAsReadSuccess: apiHooks.markAsReadSuccess,
                markAllAsReadSuccess: apiHooks.markAllAsReadSuccess,
                sendImmediateSuccess: apiHooks.sendImmediateSuccess,
                scheduleSuccess: apiHooks.scheduleSuccess,
                preferencesUpdateSuccess: preferencesHooks.updateSuccess,
                tokenRegisterSuccess: deviceTokensHooks.registerSuccess,
                createNotification: apiHooks.createNotification,
                updateNotification: (notificationId: string, updateData: UpdateNotificationRequest) => {
                    apiHooks.updateNotification({ notificationId, updateData });
                },
                deleteNotification: apiHooks.deleteNotification,
                markAsRead: apiHooks.markAsRead,
                markAllAsRead: apiHooks.markAllAsRead,
                sendImmediate: apiHooks.sendImmediate,
                scheduleNotification: apiHooks.scheduleNotification,
                updatePreferences: preferencesHooks.updatePreferences,
                registerDeviceToken: deviceTokensHooks.registerToken,
                createMaintenanceReminder: helpersHooks.createMaintenanceReminder,
                createInspectionReminder: helpersHooks.createInspectionReminder,
                testNotification: helpersHooks.testNotification,
                refetch: () => {
                    apiHooks.refetch();
                    preferencesHooks.refetch();
                    deviceTokensHooks.refetch();
                },
                clearErrors: () => {
                    apiHooks.clearErrors();
                },
                isUsingRealAPI: true,
            };
        } else {
            // 🎯 Sistema mock simplificado
            return {
                notifications: [
                    {
                        id: '1',
                        title: 'Lembrete de Manutenção',
                        message: 'Sua troca de óleo está próxima',
                        type: 'maintenance',
                        priority: 'MEDIUM',
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        data: { vehicleId: 'vehicle1' },
                    },
                    {
                        id: '2',
                        title: 'Inspeção Vencida',
                        message: 'Sua inspeção anual venceu há 3 dias',
                        type: 'inspection',
                        priority: 'HIGH',
                        isRead: true,
                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        data: { vehicleId: 'vehicle1' },
                    },
                ],
                notificationsCount: 2,
                unreadCount: 1,
                stats: {
                    total: 2,
                    unread: 1,
                    read: 1,
                    scheduled: 0,
                    sent: 2,
                    failed: 0,
                    byType: {
                        maintenance: 1,
                        inspection: 1,
                        reminder: 0,
                        promotion: 0,
                        security: 0,
                        general: 0,
                    },
                    byPriority: {
                        LOW: 0,
                        MEDIUM: 1,
                        HIGH: 1,
                        URGENT: 0,
                    },
                },
                preferences: {
                    maintenance: true,
                    inspection: true,
                    reminders: true,
                    promotions: false,
                    security: true,
                    pushEnabled: true,
                    emailEnabled: true,
                    smsEnabled: false,
                    remindersDaysBefore: 7,
                    quietHoursStart: '22:00',
                    quietHoursEnd: '08:00',
                },
                deviceTokens: [],
                isLoading: false,
                isCreating: false,
                isUpdating: false,
                isDeleting: false,
                isMarkingAsRead: false,
                isMarkingAllAsRead: false,
                isSendingImmediate: false,
                isScheduling: false,
                isUpdatingPreferences: false,
                isRegisteringToken: false,
                error: undefined,
                createError: undefined,
                updateError: undefined,
                deleteError: undefined,
                markAsReadError: undefined,
                sendImmediateError: undefined,
                scheduleError: undefined,
                preferencesError: undefined,
                tokenError: undefined,
                createSuccess: false,
                updateSuccess: false,
                deleteSuccess: false,
                markAsReadSuccess: false,
                markAllAsReadSuccess: false,
                sendImmediateSuccess: false,
                scheduleSuccess: false,
                preferencesUpdateSuccess: false,
                tokenRegisterSuccess: false,
                createNotification: (notificationData: CreateNotificationRequest) => {
                    console.log('🔔 Criar notificação (mock):', notificationData);
                },
                updateNotification: (notificationId: string, updateData: UpdateNotificationRequest) => {
                    console.log('✏️ Atualizar notificação (mock):', notificationId, updateData);
                },
                deleteNotification: (notificationId: string) => {
                    console.log('🗑️ Excluir notificação (mock):', notificationId);
                },
                markAsRead: (notificationId: string) => {
                    console.log('✅ Marcar como lida (mock):', notificationId);
                },
                markAllAsRead: () => {
                    console.log('✅ Marcar todas como lidas (mock)');
                },
                sendImmediate: (notificationData: Omit<CreateNotificationRequest, 'scheduledFor'>) => {
                    console.log('🔔 Enviar imediato (mock):', notificationData);
                },
                scheduleNotification: (notificationData: CreateNotificationRequest) => {
                    console.log('📅 Agendar notificação (mock):', notificationData);
                },
                updatePreferences: (preferences: Partial<NotificationPreferences>) => {
                    console.log('⚙️ Atualizar preferências (mock):', preferences);
                },
                registerDeviceToken: (deviceToken: Omit<DeviceToken, 'isActive'>) => {
                    console.log('📱 Registrar token (mock):', deviceToken);
                },
                createMaintenanceReminder: (data: any) => {
                    console.log('🔧 Criar lembrete de manutenção (mock):', data);
                },
                createInspectionReminder: (data: any) => {
                    console.log('🔍 Criar lembrete de inspeção (mock):', data);
                },
                testNotification: (data: any) => {
                    console.log('🧪 Testar notificação (mock):', data);
                },
                refetch: () => {
                    console.log('🔄 Refetch (mock)');
                },
                clearErrors: () => {
                    console.log('🧹 Clear errors (mock)');
                },
                isUsingRealAPI: false,
            };
        }
    }, [USE_REAL_API, apiHooks, preferencesHooks, deviceTokensHooks, helpersHooks]);

    // 📊 Log do sistema ativo
    useEffect(() => {
        console.log(`🔔 Sistema de notificações ativo: ${USE_REAL_API ? 'API Real' : 'Mock'}`);
    }, []);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

// 🪝 Hook para usar o contexto de notificações
export const useNotificationContext = (): NotificationContextData => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext deve ser usado dentro de NotificationProvider');
    }
    return context;
};

export default NotificationContext;
