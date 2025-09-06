"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const inspectionRoutes_1 = __importDefault(require("./routes/inspectionRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const systemRoutes_1 = __importDefault(require("./routes/systemRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const workshopRoutes_1 = __importDefault(require("./routes/workshopRoutes"));
// Validar configurações na inicialização
(0, config_1.validateConfig)();
const app = (0, express_1.default)();
// Middleware básico
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging (simples para desenvolvimento)
if (config_1.config.isDevelopment) {
    app.use((req, res, next) => {
        console.log(`📡 ${req.method} ${req.path}`, {
            body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
            query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
        });
        next();
    });
} // Rotas da API
app.use('/api/auth', authRoutes_1.default);
app.use('/api/system', systemRoutes_1.default);
app.use('/api/vehicles', vehicleRoutes_1.default);
app.use('/api/maintenances', maintenanceRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/workshops', workshopRoutes_1.default);
app.use('/api/inspections', inspectionRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
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
// Health check endpoint com informações da configuração
app.get('/health', (req, res) => {
    const response = {
        success: true,
        message: 'CarRepair API is running',
        data: {
            version: '2.0.0',
            environment: config_1.config.nodeEnv,
            port: config_1.config.port,
            timestamp: new Date().toISOString(),
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