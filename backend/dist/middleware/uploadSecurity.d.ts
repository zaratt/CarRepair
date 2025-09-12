import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
export declare const validateUploadedFile: (fileType: "images" | "documents") => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const uploadVehicleImage: multer.Multer;
export declare const uploadMaintenanceDoc: multer.Multer;
export declare const cleanupOldFiles: (directory: string, maxAgeHours?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=uploadSecurity.d.ts.map