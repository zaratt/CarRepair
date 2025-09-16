import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationData {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority?: 'high' | 'medium' | 'low';
    data?: any;
    actionUrl?: string;
    expiresAt?: Date;
}

// ✅ Função principal para criar notificação
export const createNotification = async (notificationData: NotificationData) => {
    try {
        // Verificar se o usuário tem preferências configuradas
        const preferences = await prisma.notificationPreference.findUnique({
            where: { userId: notificationData.userId }
        });

        // Se o usuário desabilitou este tipo de notificação, não criar
        if (preferences && !shouldSendNotification(notificationData.type, preferences)) {
            return null;
        }

        const notification = await prisma.notification.create({
            data: {
                userId: notificationData.userId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                priority: notificationData.priority || 'medium',
                data: notificationData.data || {},
                actionUrl: notificationData.actionUrl,
                expiresAt: notificationData.expiresAt
            }
        });

        console.log(`✅ Notificação criada: ${notification.type} para usuário ${notification.userId}`);
        return notification;
    } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        return null;
    }
};

// ✅ Verificar se deve enviar notificação baseado nas preferências
const shouldSendNotification = (type: string, preferences: any): boolean => {
    switch (type) {
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
};

// ✅ EVENTOS AUTOMÁTICOS DE NOTIFICAÇÃO

// 1. Notificação para nova inspeção criada
export const notifyInspectionCreated = async (inspectionId: string, userId: string, vehiclePlate: string) => {
    await createNotification({
        userId,
        type: 'inspection_reminder',
        title: '🔍 Nova Inspeção Registrada',
        message: `Inspeção registrada para o veículo ${vehiclePlate}. Acompanhe o status.`,
        priority: 'medium',
        data: { inspectionId, vehiclePlate },
        actionUrl: `/inspections/${inspectionId}`
    });
};

// 2. Notificação para inspeção aprovada
export const notifyInspectionApproved = async (inspectionId: string, userId: string, vehiclePlate: string) => {
    await createNotification({
        userId,
        type: 'inspection_reminder',
        title: '✅ Inspeção Aprovada',
        message: `Inspeção do veículo ${vehiclePlate} foi aprovada com sucesso!`,
        priority: 'high',
        data: { inspectionId, vehiclePlate, status: 'approved' },
        actionUrl: `/inspections/${inspectionId}`
    });
};

// 3. Notificação para inspeção não conforme
export const notifyInspectionRejected = async (inspectionId: string, userId: string, vehiclePlate: string) => {
    await createNotification({
        userId,
        type: 'inspection_reminder',
        title: '❌ Inspeção Não Conforme',
        message: `Inspeção do veículo ${vehiclePlate} foi rejeitada. Verifique os detalhes.`,
        priority: 'high',
        data: { inspectionId, vehiclePlate, status: 'rejected' },
        actionUrl: `/inspections/${inspectionId}`
    });
};

// 4. Notificação para nova manutenção
export const notifyMaintenanceCreated = async (maintenanceId: string, userId: string, vehiclePlate: string, service: string) => {
    await createNotification({
        userId,
        type: 'maintenance_reminder',
        title: '🔧 Nova Manutenção Agendada',
        message: `Manutenção "${service}" agendada para o veículo ${vehiclePlate}.`,
        priority: 'medium',
        data: { maintenanceId, vehiclePlate, service },
        actionUrl: `/maintenances/${maintenanceId}`
    });
};

// 5. Notificação para manutenção concluída
export const notifyMaintenanceCompleted = async (maintenanceId: string, userId: string, vehiclePlate: string, service: string) => {
    await createNotification({
        userId,
        type: 'maintenance_reminder',
        title: '✅ Manutenção Concluída',
        message: `Manutenção "${service}" do veículo ${vehiclePlate} foi concluída.`,
        priority: 'medium',
        data: { maintenanceId, vehiclePlate, service, status: 'completed' },
        actionUrl: `/maintenances/${maintenanceId}`
    });
};

// 6. Lembrete de manutenção preventiva (baseado em quilometragem)
export const notifyMaintenanceReminder = async (userId: string, vehiclePlate: string, service: string, currentKm: number) => {
    await createNotification({
        userId,
        type: 'maintenance_reminder',
        title: '⚠️ Lembrete de Manutenção',
        message: `Veículo ${vehiclePlate} precisa de ${service}. Km atual: ${currentKm.toLocaleString()}`,
        priority: 'high',
        data: { vehiclePlate, service, currentKm },
        actionUrl: '/maintenances/new',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expira em 30 dias
    });
};

// 7. Lembrete de inspeção anual
export const notifyInspectionReminder = async (userId: string, vehiclePlate: string, daysUntilExpiration: number) => {
    const urgency = daysUntilExpiration <= 7 ? 'high' : daysUntilExpiration <= 30 ? 'medium' : 'low';
    const icon = daysUntilExpiration <= 7 ? '🚨' : '📋';

    await createNotification({
        userId,
        type: 'inspection_reminder',
        title: `${icon} Lembrete de Inspeção`,
        message: `Inspeção do veículo ${vehiclePlate} vence em ${daysUntilExpiration} dias.`,
        priority: urgency,
        data: { vehiclePlate, daysUntilExpiration },
        actionUrl: '/inspections/new',
        expiresAt: new Date(Date.now() + daysUntilExpiration * 24 * 60 * 60 * 1000)
    });
};

// 8. Notificação de sistema
export const notifySystemUpdate = async (userId: string, title: string, message: string) => {
    await createNotification({
        userId,
        type: 'system_update',
        title: `📱 ${title}`,
        message,
        priority: 'low',
        data: { type: 'system_update' },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira em 7 dias
    });
};

// ✅ FUNÇÃO UTILITÁRIA PARA LIMPAR NOTIFICAÇÕES EXPIRADAS
export const cleanupExpiredNotifications = async () => {
    try {
        const result = await prisma.notification.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        console.log(`🧹 Limpeza automática: ${result.count} notificações expiradas removidas`);
        return result.count;
    } catch (error) {
        console.error('❌ Erro na limpeza de notificações:', error);
        return 0;
    }
};

// ✅ FUNÇÃO PARA MARCAR NOTIFICAÇÕES ANTIGAS COMO LIDAS (15 dias)
export const markOldNotificationsAsRead = async () => {
    try {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        const result = await prisma.notification.updateMany({
            where: {
                createdAt: { lt: fifteenDaysAgo },
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        console.log(`📖 Marcação automática: ${result.count} notificações antigas marcadas como lidas`);
        return result.count;
    } catch (error) {
        console.error('❌ Erro na marcação automática:', error);
        return 0;
    }
};