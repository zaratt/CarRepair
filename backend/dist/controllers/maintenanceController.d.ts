import { Request, Response } from 'express';
import { MaintenanceAttachmentData } from '../types';
export declare const createAttachmentFromUpload: (uploadedFile: any, category: string) => MaintenanceAttachmentData;
export declare const createMaintenance: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMaintenances: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMaintenanceById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateMaintenance: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteMaintenance: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMaintenancesByVehicle: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=maintenanceController.d.ts.map