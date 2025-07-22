export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly databaseUrl: string;
    readonly jwtSecret: string;
    readonly fipe: {
        readonly baseUrl: string;
        readonly cacheTtl: number;
    };
    readonly upload: {
        readonly path: string;
        readonly maxFileSize: number;
        readonly allowedTypes: string[];
    };
    readonly logLevel: string;
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly isTest: boolean;
};
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=index.d.ts.map