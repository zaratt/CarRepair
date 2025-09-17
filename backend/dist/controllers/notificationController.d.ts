import { Request, Response } from 'express';
export declare const getUserNotifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markNotificationAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markAllNotificationsAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getNotificationStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getNotificationPreferences: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateNotificationPreferences: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const registerPushToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserPushTokens: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removePushToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateTokenUsage: (tokenId: string) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map