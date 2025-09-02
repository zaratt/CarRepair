import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import notificationAPI, {
    CreateNotificationRequest,
    DeviceToken,
    NotificationFilters,
    NotificationPreferences,
    UpdateNotificationRequest
} from '../api/notification.api';

// 🔑 Query Keys
export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (filters?: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
    details: () => [...notificationKeys.all, 'detail'] as const,
    detail: (id: string) => [...notificationKeys.details(), id] as const,
    stats: (filters?: any) => [...notificationKeys.all, 'stats', filters] as const,
    preferences: () => [...notificationKeys.all, 'preferences'] as const,
    deviceTokens: () => [...notificationKeys.all, 'device-tokens'] as const,
    scheduled: () => [...notificationKeys.all, 'scheduled'] as const,
    history: (filters?: NotificationFilters) => [...notificationKeys.all, 'history', filters] as const,
    metrics: (dateFrom?: string, dateTo?: string) => [...notificationKeys.all, 'metrics', dateFrom, dateTo] as const,
};

// 🪝 Hook principal para listar notificações
export const useNotifications = (filters?: NotificationFilters) => {
    const queryClient = useQueryClient();

    // 📋 Query para listar notificações
    const {
        data: notificationsResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.list(filters),
        queryFn: () => notificationAPI.getNotifications(filters),
        staleTime: 2 * 60 * 1000, // 2 minutos
    });

    // 📊 Query para estatísticas
    const {
        data: stats,
        isLoading: isLoadingStats,
    } = useQuery({
        queryKey: notificationKeys.stats(filters),
        queryFn: () => notificationAPI.getNotificationStats(filters),
        staleTime: 5 * 60 * 1000,
    });

    // ➕ Mutation para criar notificação
    const createMutation = useMutation({
        mutationFn: (notificationData: CreateNotificationRequest) =>
            notificationAPI.createNotification(notificationData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // ✏️ Mutation para atualizar notificação
    const updateMutation = useMutation({
        mutationFn: ({ notificationId, updateData }: {
            notificationId: string;
            updateData: UpdateNotificationRequest
        }) => notificationAPI.updateNotification(notificationId, updateData),
        onSuccess: (_, { notificationId }) => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // 🗑️ Mutation para excluir notificação
    const deleteMutation = useMutation({
        mutationFn: (notificationId: string) =>
            notificationAPI.deleteNotification(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // ✅ Mutation para marcar como lida
    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: string) =>
            notificationAPI.markAsRead(notificationId),
        onSuccess: (_, notificationId) => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // ✅ Mutation para marcar como não lida
    const markAsUnreadMutation = useMutation({
        mutationFn: (notificationId: string) =>
            notificationAPI.markAsUnread(notificationId),
        onSuccess: (_, notificationId) => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // ✅ Mutation para marcar todas como lidas
    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationAPI.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // 🔔 Mutation para envio imediato
    const sendImmediateMutation = useMutation({
        mutationFn: (notificationData: Omit<CreateNotificationRequest, 'scheduledFor'>) =>
            notificationAPI.sendImmediateNotification(notificationData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // 📅 Mutation para agendar
    const scheduleMutation = useMutation({
        mutationFn: (notificationData: CreateNotificationRequest) =>
            notificationAPI.scheduleNotification(notificationData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.scheduled() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
        },
    });

    // ❌ Mutation para cancelar agendamento
    const cancelScheduledMutation = useMutation({
        mutationFn: (notificationId: string) =>
            notificationAPI.cancelScheduledNotification(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.scheduled() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        },
    });

    // 🔄 Mutation para reagendar
    const rescheduleMutation = useMutation({
        mutationFn: ({ notificationId, newScheduleDate }: {
            notificationId: string;
            newScheduleDate: string
        }) => notificationAPI.rescheduleNotification(notificationId, newScheduleDate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.scheduled() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        },
    });

    // 🧹 Função para limpar erros
    const clearErrors = () => {
        createMutation.reset();
        updateMutation.reset();
        deleteMutation.reset();
        markAsReadMutation.reset();
        markAsUnreadMutation.reset();
        markAllAsReadMutation.reset();
        sendImmediateMutation.reset();
        scheduleMutation.reset();
        cancelScheduledMutation.reset();
        rescheduleMutation.reset();
    };

    return {
        // 📊 Dados
        notifications: notificationsResponse?.data?.notifications || [],
        notificationsCount: notificationsResponse?.data?.pagination?.total || 0,
        unreadCount: notificationsResponse?.data?.unreadCount || 0,
        stats,

        // 🔄 Estados de loading
        isLoading: isLoading || isLoadingStats,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isMarkingAsRead: markAsReadMutation.isPending,
        isMarkingAsUnread: markAsUnreadMutation.isPending,
        isMarkingAllAsRead: markAllAsReadMutation.isPending,
        isSendingImmediate: sendImmediateMutation.isPending,
        isScheduling: scheduleMutation.isPending,
        isCancelingScheduled: cancelScheduledMutation.isPending,
        isRescheduling: rescheduleMutation.isPending,

        // ❌ Erros
        error: error?.message,
        createError: createMutation.error?.message,
        updateError: updateMutation.error?.message,
        deleteError: deleteMutation.error?.message,
        markAsReadError: markAsReadMutation.error?.message,
        markAsUnreadError: markAsUnreadMutation.error?.message,
        markAllAsReadError: markAllAsReadMutation.error?.message,
        sendImmediateError: sendImmediateMutation.error?.message,
        scheduleError: scheduleMutation.error?.message,
        cancelScheduledError: cancelScheduledMutation.error?.message,
        rescheduleError: rescheduleMutation.error?.message,

        // ✅ Estados de sucesso
        createSuccess: createMutation.isSuccess,
        updateSuccess: updateMutation.isSuccess,
        deleteSuccess: deleteMutation.isSuccess,
        markAsReadSuccess: markAsReadMutation.isSuccess,
        markAsUnreadSuccess: markAsUnreadMutation.isSuccess,
        markAllAsReadSuccess: markAllAsReadMutation.isSuccess,
        sendImmediateSuccess: sendImmediateMutation.isSuccess,
        scheduleSuccess: scheduleMutation.isSuccess,
        cancelScheduledSuccess: cancelScheduledMutation.isSuccess,
        rescheduleSuccess: rescheduleMutation.isSuccess,

        // 🎯 Ações
        createNotification: createMutation.mutate,
        updateNotification: updateMutation.mutate,
        deleteNotification: deleteMutation.mutate,
        markAsRead: markAsReadMutation.mutate,
        markAsUnread: markAsUnreadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        sendImmediate: sendImmediateMutation.mutate,
        scheduleNotification: scheduleMutation.mutate,
        cancelScheduled: cancelScheduledMutation.mutate,
        reschedule: rescheduleMutation.mutate,
        refetch,
        clearErrors,
    };
};

// 🪝 Hook para notificação específica
export const useNotification = (notificationId: string) => {
    const {
        data: notification,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.detail(notificationId),
        queryFn: () => notificationAPI.getNotification(notificationId),
        enabled: !!notificationId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        notification,
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para preferências de notificação
export const useNotificationPreferences = () => {
    const queryClient = useQueryClient();

    const {
        data: preferences,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.preferences(),
        queryFn: () => notificationAPI.getNotificationPreferences(),
        staleTime: 10 * 60 * 1000,
    });

    const updateMutation = useMutation({
        mutationFn: (preferences: Partial<NotificationPreferences>) =>
            notificationAPI.updateNotificationPreferences(preferences),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
        },
    });

    return {
        preferences,
        isLoading,
        isUpdating: updateMutation.isPending,
        error: error?.message,
        updateError: updateMutation.error?.message,
        updateSuccess: updateMutation.isSuccess,
        updatePreferences: updateMutation.mutate,
        refetch,
    };
};

// 🪝 Hook para tokens de dispositivo
export const useDeviceTokens = () => {
    const queryClient = useQueryClient();

    const {
        data: deviceTokens,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.deviceTokens(),
        queryFn: () => notificationAPI.getDeviceTokens(),
        staleTime: 15 * 60 * 1000,
    });

    const registerMutation = useMutation({
        mutationFn: (deviceToken: Omit<DeviceToken, 'isActive'>) =>
            notificationAPI.registerDeviceToken(deviceToken),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.deviceTokens() });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ tokenId, updates }: {
            tokenId: string;
            updates: Partial<DeviceToken>
        }) => notificationAPI.updateDeviceToken(tokenId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.deviceTokens() });
        },
    });

    const removeMutation = useMutation({
        mutationFn: (tokenId: string) =>
            notificationAPI.removeDeviceToken(tokenId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.deviceTokens() });
        },
    });

    return {
        deviceTokens: deviceTokens || [],
        isLoading,
        isRegistering: registerMutation.isPending,
        isUpdating: updateMutation.isPending,
        isRemoving: removeMutation.isPending,
        error: error?.message,
        registerError: registerMutation.error?.message,
        updateError: updateMutation.error?.message,
        removeError: removeMutation.error?.message,
        registerSuccess: registerMutation.isSuccess,
        updateSuccess: updateMutation.isSuccess,
        removeSuccess: removeMutation.isSuccess,
        registerToken: registerMutation.mutate,
        updateToken: updateMutation.mutate,
        removeToken: removeMutation.mutate,
        refetch,
    };
};

// 🪝 Hook para notificações agendadas
export const useScheduledNotifications = () => {
    const {
        data: scheduledNotifications,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.scheduled(),
        queryFn: () => notificationAPI.getScheduledNotifications(),
        staleTime: 5 * 60 * 1000,
    });

    return {
        scheduledNotifications: scheduledNotifications || [],
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para histórico de notificações
export const useNotificationHistory = (filters?: NotificationFilters) => {
    const {
        data: historyResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.history(filters),
        queryFn: () => notificationAPI.getNotificationHistory(filters),
        staleTime: 10 * 60 * 1000,
    });

    return {
        history: historyResponse?.data || [],
        historyCount: historyResponse?.total || 0,
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para métricas de entrega
export const useDeliveryMetrics = (dateFrom?: string, dateTo?: string) => {
    const {
        data: metrics,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationKeys.metrics(dateFrom, dateTo),
        queryFn: () => notificationAPI.getDeliveryMetrics(dateFrom, dateTo),
        staleTime: 15 * 60 * 1000,
    });

    return {
        metrics,
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para helpers de criação de lembretes
export const useNotificationHelpers = () => {
    const queryClient = useQueryClient();

    const createMaintenanceReminderMutation = useMutation({
        mutationFn: (data: Parameters<typeof notificationAPI.createMaintenanceReminder>[0]) =>
            notificationAPI.createMaintenanceReminder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.scheduled() });
        },
    });

    const createInspectionReminderMutation = useMutation({
        mutationFn: (data: Parameters<typeof notificationAPI.createInspectionReminder>[0]) =>
            notificationAPI.createInspectionReminder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.scheduled() });
        },
    });

    const testNotificationMutation = useMutation({
        mutationFn: (data: Parameters<typeof notificationAPI.testNotification>[0]) =>
            notificationAPI.testNotification(data),
    });

    return {
        isCreatingMaintenanceReminder: createMaintenanceReminderMutation.isPending,
        isCreatingInspectionReminder: createInspectionReminderMutation.isPending,
        isTesting: testNotificationMutation.isPending,

        createMaintenanceReminderError: createMaintenanceReminderMutation.error?.message,
        createInspectionReminderError: createInspectionReminderMutation.error?.message,
        testError: testNotificationMutation.error?.message,

        createMaintenanceReminderSuccess: createMaintenanceReminderMutation.isSuccess,
        createInspectionReminderSuccess: createInspectionReminderMutation.isSuccess,
        testSuccess: testNotificationMutation.isSuccess,

        createMaintenanceReminder: createMaintenanceReminderMutation.mutate,
        createInspectionReminder: createInspectionReminderMutation.mutate,
        testNotification: testNotificationMutation.mutate,
    };
};
