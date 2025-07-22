import { NextFunction, Request, Response } from 'express';
export declare const validateUUID: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateLicensePlateParam: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCpfCnpjParam: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateEmailParam: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateVehicleData: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMaintenanceData: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequiredFields: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePagination: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map