import winston from 'winston';
export declare const securityLogger: winston.Logger;
export declare const auditLogger: winston.Logger;
export declare enum SecurityEventType {
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGIN_FAILURE = "LOGIN_FAILURE",
    LOGOUT = "LOGOUT",
    TOKEN_REFRESH = "TOKEN_REFRESH",
    TOKEN_INVALID = "TOKEN_INVALID",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    DATA_ACCESS = "DATA_ACCESS",
    DATA_MODIFICATION = "DATA_MODIFICATION",
    FILE_UPLOAD = "FILE_UPLOAD",
    MALICIOUS_UPLOAD = "MALICIOUS_UPLOAD",
    CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
    MALICIOUS_REQUEST = "MALICIOUS_REQUEST"
}
export interface SecurityEvent {
    type: SecurityEventType;
    userId?: string;
    email?: string;
    ip: string;
    userAgent: string;
    endpoint?: string;
    method?: string;
    payload?: any;
    success: boolean;
    message: string;
    timestamp?: Date;
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    session_id?: string;
    geo_location?: string;
}
export declare const logSecurityEvent: (event: SecurityEvent) => void;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export declare const detectSuspiciousActivity: (input: string, req: any) => boolean;
export declare const suspiciousActivityDetector: (req: any, res: any, next: any) => any;
export declare const initializeLogger: () => void;
//# sourceMappingURL=securityLogger.d.ts.map