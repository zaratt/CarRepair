"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markOldNotificationsAsRead = exports.cleanupExpiredNotifications = exports.notifySystemUpdate = exports.notifyInspectionReminder = exports.notifyMaintenanceReminder = exports.notifyMaintenanceCompleted = exports.notifyMaintenanceCreated = exports.notifyInspectionRejected = exports.notifyInspectionApproved = exports.notifyInspectionCreated = exports.createNotification = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ✅ Função principal para criar notificação
const createNotification = async (notificationData) => {
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
    }
    catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        return null;
    }
};
exports.createNotification = createNotification;
// ✅ Verificar se deve enviar notificação baseado nas preferências
const shouldSendNotification = (type, preferences) => {
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
const notifyInspectionCreated = async (inspectionId, userId, vehiclePlate) => {
    await (0, exports.createNotification)({
        userId,
        type: 'inspection_reminder',
        title: '🔍 Nova Inspeção Registrada',
        message: `Inspeção registrada para o veículo ${vehiclePlate}. Acompanhe o status.`,
        priority: 'medium',
        data: { inspectionId, vehiclePlate },
        actionUrl: `/inspections/${inspectionId}`
    });
};
exports.notifyInspectionCreated = notifyInspectionCreated;
// 2. Notificação para inspeção aprovada
const notifyInspectionApproved = async (inspectionId, userId, vehiclePlate) => {
    await (0, exports.createNotification)({
        userId,
        type: 'inspection_reminder',
        title: '✅ Inspeção Aprovada',
        message: `Inspeção do veículo ${vehiclePlate} foi aprovada com sucesso!`,
        priority: 'high',
        data: { inspectionId, vehiclePlate, status: 'approved' },
        actionUrl: `/inspections/${inspectionId}`
    });
};
exports.notifyInspectionApproved = notifyInspectionApproved;
// 3. Notificação para inspeção não conforme
const notifyInspectionRejected = async (inspectionId, userId, vehiclePlate) => {
    await (0, exports.createNotification)({
        userId,
        type: 'inspection_reminder',
        title: '❌ Inspeção Não Conforme',
        message: `Inspeção do veículo ${vehiclePlate} foi rejeitada. Verifique os detalhes.`,
        priority: 'high',
        data: { inspectionId, vehiclePlate, status: 'rejected' },
        actionUrl: `/inspections/${inspectionId}`
    });
};
exports.notifyInspectionRejected = notifyInspectionRejected;
// 4. Notificação para nova manutenção
const notifyMaintenanceCreated = async (maintenanceId, userId, vehiclePlate, service) => {
    await (0, exports.createNotification)({
        userId,
        type: 'maintenance_reminder',
        title: '🔧 Nova Manutenção Agendada',
        message: `Manutenção "${service}" agendada para o veículo ${vehiclePlate}.`,
        priority: 'medium',
        data: { maintenanceId, vehiclePlate, service },
        actionUrl: `/maintenances/${maintenanceId}`
    });
};
exports.notifyMaintenanceCreated = notifyMaintenanceCreated;
// 5. Notificação para manutenção concluída
const notifyMaintenanceCompleted = async (maintenanceId, userId, vehiclePlate, service) => {
    await (0, exports.createNotification)({
        userId,
        type: 'maintenance_reminder',
        title: '✅ Manutenção Concluída',
        message: `Manutenção "${service}" do veículo ${vehiclePlate} foi concluída.`,
        priority: 'medium',
        data: { maintenanceId, vehiclePlate, service, status: 'completed' },
        actionUrl: `/maintenances/${maintenanceId}`
    });
};
exports.notifyMaintenanceCompleted = notifyMaintenanceCompleted;
// 6. Lembrete de manutenção preventiva (baseado em quilometragem)
const notifyMaintenanceReminder = async (userId, vehiclePlate, service, currentKm) => {
    await (0, exports.createNotification)({
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
exports.notifyMaintenanceReminder = notifyMaintenanceReminder;
// 7. Lembrete de inspeção anual
const notifyInspectionReminder = async (userId, vehiclePlate, daysUntilExpiration) => {
    const urgency = daysUntilExpiration <= 7 ? 'high' : daysUntilExpiration <= 30 ? 'medium' : 'low';
    const icon = daysUntilExpiration <= 7 ? '🚨' : '📋';
    await (0, exports.createNotification)({
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
exports.notifyInspectionReminder = notifyInspectionReminder;
// 8. Notificação de sistema
const notifySystemUpdate = async (userId, title, message) => {
    await (0, exports.createNotification)({
        userId,
        type: 'system_update',
        title: `📱 ${title}`,
        message,
        priority: 'low',
        data: { type: 'system_update' },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira em 7 dias
    });
};
exports.notifySystemUpdate = notifySystemUpdate;
// ✅ FUNÇÃO UTILITÁRIA PARA LIMPAR NOTIFICAÇÕES EXPIRADAS
const cleanupExpiredNotifications = async () => {
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
    }
    catch (error) {
        console.error('❌ Erro na limpeza de notificações:', error);
        return 0;
    }
};
exports.cleanupExpiredNotifications = cleanupExpiredNotifications;
// ✅ FUNÇÃO PARA MARCAR NOTIFICAÇÕES ANTIGAS COMO LIDAS (15 dias)
const markOldNotificationsAsRead = async () => {
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
    }
    catch (error) {
        console.error('❌ Erro na marcação automática:', error);
        return 0;
    }
};
exports.markOldNotificationsAsRead = markOldNotificationsAsRead;
//# sourceMappingURL=notificationService.js.map