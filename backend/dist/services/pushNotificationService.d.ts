export interface PushNotificationData {
    title: string;
    body: string;
    data?: any;
    sound?: 'default' | null;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
}
export interface PushNotificationTarget {
    userId: string;
    notificationType?: string;
}
declare class PushNotificationService {
    sendToUser(target: PushNotificationTarget, notification: PushNotificationData): Promise<boolean>;
    sendToMultipleUsers(userIds: string[], notification: PushNotificationData, notificationType?: string): Promise<void>;
    private shouldSendNotification;
    private isQuietHours;
    private disableToken;
    private updateTokensUsage;
    sendEmergencyNotification(userId: string, notification: PushNotificationData): Promise<boolean>;
    broadcastToAllUsers(notification: PushNotificationData, notificationType?: string): Promise<void>;
    cleanupOldTokens(daysOld?: number): Promise<void>;
}
export declare const pushNotificationService: PushNotificationService;
export declare const pushNotifications: {
    sendMaintenanceReminder: (userId: string, vehicleName: string, maintenanceType: string) => Promise<boolean>;
    sendInspectionReminder: (userId: string, vehicleName: string) => Promise<boolean>;
    sendPaymentReminder: (userId: string, amount: number, dueDate: string) => Promise<boolean>;
    sendPromotionalOffer: (userId: string, title: string, description: string) => Promise<boolean>;
};
export {};
//# sourceMappingURL=pushNotificationService.d.ts.map