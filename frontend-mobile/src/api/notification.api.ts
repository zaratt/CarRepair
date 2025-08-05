import apiClient from './client';

// 🔔 Interfaces para Notification API
export interface NotificationPreferences {
    maintenance: boolean;
    inspection: boolean;
    reminders: boolean;
    promotions: boolean;
    security: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    remindersDaysBefore: number;
    quietHoursStart?: string; // HH:MM formato
    quietHoursEnd?: string; // HH:MM formato
}

export interface CreateNotificationRequest {
    userId: string;
    title: string;
    message: string;
    type: 'maintenance' | 'inspection' | 'reminder' | 'promotion' | 'security' | 'general';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    scheduledFor?: string; // ISO date para agendamento
    data?: Record<string, any>; // Dados extras para deep linking
    channels: ('push' | 'email' | 'sms')[];
    expiresAt?: string; // ISO date
}

export interface UpdateNotificationRequest {
    title?: string;
    message?: string;
    scheduledFor?: string;
    isRead?: boolean;
    data?: Record<string, any>;
}

export interface NotificationFilters {
    type?: string;
    priority?: string;
    isRead?: boolean;
    dateFrom?: string;
    dateTo?: string;
    channel?: string;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'priority' | 'type';
    sortOrder?: 'asc' | 'desc';
}

export interface NotificationStats {
    total: number;
    unread: number;
    read: number;
    scheduled: number;
    sent: number;
    failed: number;
    byType: {
        maintenance: number;
        inspection: number;
        reminder: number;
        promotion: number;
        security: number;
        general: number;
    };
    byPriority: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
        URGENT: number;
    };
}

export interface DeviceToken {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
    isActive: boolean;
}

// 🔔 API Class
class NotificationAPI {
    private basePath = '/notifications';

    // 📋 Listar notificações do usuário
    async getNotifications(filters?: NotificationFilters) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

        const response = await apiClient.get(url);
        return response.data;
    }

    // 📋 Obter notificação específica
    async getNotification(notificationId: string) {
        const response = await apiClient.get(`${this.basePath}/${notificationId}`);
        return response.data;
    }

    // ➕ Criar nova notificação
    async createNotification(notificationData: CreateNotificationRequest) {
        const response = await apiClient.post(this.basePath, notificationData);
        return response.data;
    }

    // ✏️ Atualizar notificação
    async updateNotification(notificationId: string, updateData: UpdateNotificationRequest) {
        const response = await apiClient.put(`${this.basePath}/${notificationId}`, updateData);
        return response.data;
    }

    // 🗑️ Excluir notificação
    async deleteNotification(notificationId: string) {
        const response = await apiClient.delete(`${this.basePath}/${notificationId}`);
        return response.data;
    }

    // ✅ Marcar como lida
    async markAsRead(notificationId: string) {
        const response = await apiClient.patch(`${this.basePath}/${notificationId}/read`);
        return response.data;
    }

    // ✅ Marcar como não lida
    async markAsUnread(notificationId: string) {
        const response = await apiClient.patch(`${this.basePath}/${notificationId}/unread`);
        return response.data;
    }

    // ✅ Marcar todas como lidas
    async markAllAsRead() {
        const response = await apiClient.patch(`${this.basePath}/mark-all-read`);
        return response.data;
    }

    // 📊 Obter estatísticas de notificações
    async getNotificationStats(filters?: Pick<NotificationFilters, 'dateFrom' | 'dateTo' | 'type'>) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}/stats?${queryString}` : `${this.basePath}/stats`;

        const response = await apiClient.get(url);
        return response.data;
    }

    // ⚙️ Obter preferências de notificação
    async getNotificationPreferences() {
        const response = await apiClient.get(`${this.basePath}/preferences`);
        return response.data;
    }

    // ⚙️ Atualizar preferências de notificação
    async updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
        const response = await apiClient.put(`${this.basePath}/preferences`, preferences);
        return response.data;
    }

    // 📱 Registrar token de dispositivo
    async registerDeviceToken(deviceToken: Omit<DeviceToken, 'isActive'>) {
        const response = await apiClient.post(`${this.basePath}/device-tokens`, deviceToken);
        return response.data;
    }

    // 📱 Atualizar token de dispositivo
    async updateDeviceToken(tokenId: string, updates: Partial<DeviceToken>) {
        const response = await apiClient.put(`${this.basePath}/device-tokens/${tokenId}`, updates);
        return response.data;
    }

    // 📱 Remover token de dispositivo
    async removeDeviceToken(tokenId: string) {
        const response = await apiClient.delete(`${this.basePath}/device-tokens/${tokenId}`);
        return response.data;
    }

    // 📱 Listar tokens de dispositivo
    async getDeviceTokens() {
        const response = await apiClient.get(`${this.basePath}/device-tokens`);
        return response.data;
    }

    // 🔔 Enviar notificação imediata
    async sendImmediateNotification(notificationData: Omit<CreateNotificationRequest, 'scheduledFor'>) {
        const response = await apiClient.post(`${this.basePath}/send-immediate`, notificationData);
        return response.data;
    }

    // 📅 Agendar notificação
    async scheduleNotification(notificationData: CreateNotificationRequest) {
        const response = await apiClient.post(`${this.basePath}/schedule`, notificationData);
        return response.data;
    }

    // ❌ Cancelar notificação agendada
    async cancelScheduledNotification(notificationId: string) {
        const response = await apiClient.patch(`${this.basePath}/${notificationId}/cancel`);
        return response.data;
    }

    // 🔄 Reagendar notificação
    async rescheduleNotification(notificationId: string, newScheduleDate: string) {
        const response = await apiClient.patch(`${this.basePath}/${notificationId}/reschedule`, {
            scheduledFor: newScheduleDate,
        });
        return response.data;
    }

    // 📋 Obter notificações agendadas
    async getScheduledNotifications() {
        const response = await apiClient.get(`${this.basePath}/scheduled`);
        return response.data;
    }

    // 📋 Obter histórico de envios
    async getNotificationHistory(filters?: NotificationFilters) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}/history?${queryString}` : `${this.basePath}/history`;

        const response = await apiClient.get(url);
        return response.data;
    }

    // 🧪 Testar notificação
    async testNotification(testData: {
        type: CreateNotificationRequest['type'];
        title: string;
        message: string;
        channels: CreateNotificationRequest['channels'];
        data?: Record<string, any>;
    }) {
        const response = await apiClient.post(`${this.basePath}/test`, testData);
        return response.data;
    }

    // 📊 Obter métricas de entrega
    async getDeliveryMetrics(dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}/metrics?${queryString}` : `${this.basePath}/metrics`;

        const response = await apiClient.get(url);
        return response.data;
    }

    // 🎯 Criar notificação de lembrete de manutenção
    async createMaintenanceReminder(data: {
        vehicleId: string;
        maintenanceType: string;
        dueDate: string;
        currentKm: number;
        estimatedKm?: number;
        daysBefore: number;
    }) {
        const notificationData: CreateNotificationRequest = {
            userId: 'current-user', // Será obtido do contexto de auth
            title: `Lembrete de Manutenção - ${data.maintenanceType}`,
            message: `Sua ${data.maintenanceType} está próxima do vencimento. Agende já!`,
            type: 'maintenance',
            priority: 'MEDIUM',
            scheduledFor: new Date(new Date(data.dueDate).getTime() - (data.daysBefore * 24 * 60 * 60 * 1000)).toISOString(),
            data: {
                vehicleId: data.vehicleId,
                maintenanceType: data.maintenanceType,
                dueDate: data.dueDate,
                deepLink: `/maintenance/schedule?vehicleId=${data.vehicleId}&type=${data.maintenanceType}`,
            },
            channels: ['push', 'email'],
        };

        return this.scheduleNotification(notificationData);
    }

    // 🔍 Criar notificação de lembrete de inspeção
    async createInspectionReminder(data: {
        vehicleId: string;
        inspectionType: string;
        dueDate: string;
        daysBefore: number;
    }) {
        const notificationData: CreateNotificationRequest = {
            userId: 'current-user',
            title: `Lembrete de Inspeção - ${data.inspectionType}`,
            message: `Sua ${data.inspectionType} está próxima do vencimento. Não esqueça!`,
            type: 'inspection',
            priority: 'HIGH',
            scheduledFor: new Date(new Date(data.dueDate).getTime() - (data.daysBefore * 24 * 60 * 60 * 1000)).toISOString(),
            data: {
                vehicleId: data.vehicleId,
                inspectionType: data.inspectionType,
                dueDate: data.dueDate,
                deepLink: `/inspection/schedule?vehicleId=${data.vehicleId}&type=${data.inspectionType}`,
            },
            channels: ['push', 'email'],
        };

        return this.scheduleNotification(notificationData);
    }
}

// 🔔 Instância singleton
const notificationAPI = new NotificationAPI();
export default notificationAPI;
