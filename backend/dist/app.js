"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const securityLogger_1 = require("./middleware/securityLogger");
const securityMiddleware_1 = require("./middleware/securityMiddleware");
const uploadSecurity_1 = require("./middleware/uploadSecurity");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const inspectionRoutes_1 = __importDefault(require("./routes/inspectionRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const systemRoutes_1 = __importDefault(require("./routes/systemRoutes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const workshopRoutes_1 = __importDefault(require("./routes/workshopRoutes"));
const cronJobs_1 = require("./services/cronJobs");
// Validar configurações na inicialização
(0, config_1.validateConfig)();
// Inicializar sistema de logging de segurança
(0, securityLogger_1.initializeLogger)();
// ✅ INICIALIZAR TAREFAS AUTOMÁTICAS
(0, cronJobs_1.initializeCronJobs)();
const app = (0, express_1.default)();
// ✅ SEGURANÇA LAYER 1: Trust proxy para aplicações atrás de proxy/load balancer
app.set('trust proxy', 1);
// ✅ SEGURANÇA LAYER 2: Middlewares de segurança principais
app.use(securityMiddleware_1.securityMiddleware);
// ✅ SEGURANÇA LAYER 3: Logging de segurança
app.use(securityLogger_1.requestLogger);
app.use(securityLogger_1.suspiciousActivityDetector);
// ✅ SEGURANÇA LAYER 4: CORS configurado
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// ✅ SEGURANÇA LAYER 5: Body parsing com limites seguros
app.use(express_1.default.json({
    limit: '1mb',
    type: ['application/json', 'text/plain']
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '1mb',
    parameterLimit: 20
}));
// ✅ SEGURANÇA LAYER 6: Limpeza automática de arquivos antigos
app.use((0, uploadSecurity_1.cleanupOldFiles)(path_1.default.join(process.cwd(), 'uploads', 'temp'), 2)); // 2 horas
// Request logging para desenvolvimento
if (config_1.config.isDevelopment) {
    app.use((req, res, next) => {
        console.log(`📡 ${req.method} ${req.path}`, {
            body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
            query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
        });
        next();
    });
}
// ✅ Middleware para servir arquivos estáticos com segurança
app.use('/uploads', express_1.default.static('uploads', {
    maxAge: '1h',
    setHeaders: (res, path) => {
        // Prevenir execução de scripts em uploads
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', 'default-src \'none\'');
    }
}));
// ✅ ROTAS COM RATE LIMITING ESPECÍFICO
app.use('/api/auth', securityMiddleware_1.authRateLimit, authRoutes_1.default);
app.use('/api/upload', securityMiddleware_1.uploadRateLimit, upload_routes_1.default);
app.use('/api/system', securityMiddleware_1.apiRateLimit, systemRoutes_1.default);
app.use('/api/vehicles', securityMiddleware_1.apiRateLimit, vehicleRoutes_1.default);
app.use('/api/maintenances', securityMiddleware_1.apiRateLimit, maintenanceRoutes_1.default);
app.use('/api/users', securityMiddleware_1.apiRateLimit, userRoutes_1.default);
app.use('/api/workshops', securityMiddleware_1.apiRateLimit, workshopRoutes_1.default);
app.use('/api/inspections', securityMiddleware_1.apiRateLimit, inspectionRoutes_1.default);
app.use('/api/notifications', securityMiddleware_1.apiRateLimit, notificationRoutes_1.default);
// Rota específica para tipos de manutenção (compatibilidade)
app.get('/api/maintenance-types', (req, res) => {
    res.json({
        success: true,
        message: 'Maintenance types',
        data: [
            'Troca de óleo',
            'Revisão geral',
            'Freios',
            'Suspensão',
            'Motor',
            'Elétrica',
            'Ar condicionado',
            'Outros'
        ]
    });
});
// Health check endpoint com informações da configuração (sem rate limit)
app.get('/health', (req, res) => {
    const response = {
        success: true,
        message: 'CarRepair API is running - SECURE MODE',
        data: {
            version: '2.0.0',
            environment: config_1.config.nodeEnv,
            port: config_1.config.port,
            timestamp: new Date().toISOString(),
            security: {
                headers: 'enabled',
                rateLimit: 'enabled',
                inputSanitization: 'enabled',
                fileUploadSecurity: 'enabled',
                logging: 'enabled'
            },
            fipe: {
                baseUrl: config_1.config.fipe.baseUrl,
                cacheTtl: config_1.config.fipe.cacheTtl
            },
            upload: {
                path: config_1.config.upload.path,
                maxFileSize: config_1.config.upload.maxFileSize,
                allowedTypes: config_1.config.upload.allowedTypes
            },
            logLevel: config_1.config.logLevel,
            endpoints: {
                auth: '/api/auth',
                system: '/api/system',
                vehicles: '/api/vehicles',
                maintenances: '/api/maintenances',
                users: '/api/users',
                workshops: '/api/workshops',
                inspections: '/api/inspections',
                notifications: '/api/notifications',
                health: '/health'
            }
        }
    };
    res.json(response);
});
// 404 handler
app.use((req, res) => {
    const response = {
        success: false,
        error: 'Endpoint not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    };
    res.status(404).json(response);
});
// Error handler global (deve ser o último middleware)
app.use(errorHandler_1.errorHandler); // Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const response = {
        success: false,
        error: config_1.config.isDevelopment ? err.message : 'Internal server error',
        message: 'An error occurred while processing your request'
    };
    res.status(500).json(response);
});
// Start server
const server = app.listen(config_1.config.port, () => {
    console.log(`🚀 CarRepair API running on port ${config_1.config.port}`);
    console.log(`📱 Environment: ${config_1.config.nodeEnv}`);
    console.log(`🏥 Health check: http://localhost:${config_1.config.port}/health`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map