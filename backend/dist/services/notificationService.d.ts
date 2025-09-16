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
export declare const createNotification: (notificationData: NotificationData) => Promise<{
    message: string;
    data: import("@prisma/client/runtime/library").JsonValue | null;
    id: string;
    type: string;
    createdAt: Date;
    userId: string;
    updatedAt: Date;
    title: string;
    priority: string;
    isRead: boolean;
    readAt: Date | null;
    actionUrl: string | null;
    expiresAt: Date | null;
} | null>;
export declare const notifyInspectionCreated: (inspectionId: string, userId: string, vehiclePlate: string) => Promise<void>;
export declare const notifyInspectionApproved: (inspectionId: string, userId: string, vehiclePlate: string) => Promise<void>;
export declare const notifyInspectionRejected: (inspectionId: string, userId: string, vehiclePlate: string) => Promise<void>;
export declare const notifyMaintenanceCreated: (maintenanceId: string, userId: string, vehiclePlate: string, service: string) => Promise<void>;
export declare const notifyMaintenanceCompleted: (maintenanceId: string, userId: string, vehiclePlate: string, service: string) => Promise<void>;
export declare const notifyMaintenanceReminder: (userId: string, vehiclePlate: string, service: string, currentKm: number) => Promise<void>;
export declare const notifyInspectionReminder: (userId: string, vehiclePlate: string, daysUntilExpiration: number) => Promise<void>;
export declare const notifySystemUpdate: (userId: string, title: string, message: string) => Promise<void>;
export declare const cleanupExpiredNotifications: () => Promise<number>;
export declare const markOldNotificationsAsRead: () => Promise<number>;
//# sourceMappingURL=notificationService.d.ts.map