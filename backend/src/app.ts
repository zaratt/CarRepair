import cors from 'cors';
import express from 'express';
import path from 'path';
import { config, validateConfig } from './config';
import { errorHandler } from './middleware/errorHandler';
import { initializeLogger, requestLogger, suspiciousActivityDetector } from './middleware/securityLogger';
import {
    apiRateLimit,
    authRateLimit,
    securityMiddleware,
    uploadRateLimit
} from './middleware/securityMiddleware';
import { cleanupOldFiles } from './middleware/uploadSecurity';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import inspectionRoutes from './routes/inspectionRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import notificationRoutes from './routes/notificationRoutes';
import systemRoutes from './routes/systemRoutes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/userRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import workshopRoutes from './routes/workshopRoutes';
import { initializeCronJobs } from './services/cronJobs';
import { ApiResponse } from './types';

// Validar configurações na inicialização
validateConfig();

// Inicializar sistema de logging de segurança
initializeLogger();

// ✅ INICIALIZAR TAREFAS AUTOMÁTICAS
initializeCronJobs();

const app = express();

// ✅ SEGURANÇA LAYER 1: Trust proxy para aplicações atrás de proxy/load balancer
app.set('trust proxy', 1);

// ✅ SEGURANÇA LAYER 2: Middlewares de segurança principais
app.use(securityMiddleware);

// ✅ SEGURANÇA LAYER 3: Logging de segurança
app.use(requestLogger);
app.use(suspiciousActivityDetector);

// ✅ SEGURANÇA LAYER 4: CORS configurado
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ SEGURANÇA LAYER 5: Body parsing com limites seguros
app.use(express.json({
    limit: '1mb',
    type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({
    extended: true,
    limit: '1mb',
    parameterLimit: 20
}));

// ✅ SEGURANÇA LAYER 6: Limpeza automática de arquivos antigos
app.use(cleanupOldFiles(path.join(process.cwd(), 'uploads', 'temp'), 2)); // 2 horas

// Request logging para desenvolvimento
if (config.isDevelopment) {
    app.use((req, res, next) => {
        console.log(`📡 ${req.method} ${req.path}`, {
            body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
            query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
        });
        next();
    });
}

// ✅ Middleware para servir arquivos estáticos com segurança
app.use('/uploads', express.static('uploads', {
    maxAge: '1h',
    setHeaders: (res, path) => {
        // Prevenir execução de scripts em uploads
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', 'default-src \'none\'');
    }
}));

// ✅ ROTAS COM RATE LIMITING ESPECÍFICO
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/upload', uploadRateLimit, uploadRoutes);
app.use('/api/system', apiRateLimit, systemRoutes);
app.use('/api/vehicles', apiRateLimit, vehicleRoutes);
app.use('/api/maintenances', apiRateLimit, maintenanceRoutes);
app.use('/api/users', apiRateLimit, userRoutes);
app.use('/api/workshops', apiRateLimit, workshopRoutes);
app.use('/api/inspections', apiRateLimit, inspectionRoutes);
app.use('/api/notifications', apiRateLimit, notificationRoutes);
app.use('/api/dashboard', apiRateLimit, dashboardRoutes);

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
    const response: ApiResponse = {
        success: true,
        message: 'CarRepair API is running - SECURE MODE',
        data: {
            version: '2.0.0',
            environment: config.nodeEnv,
            port: config.port,
            timestamp: new Date().toISOString(),
            security: {
                headers: 'enabled',
                rateLimit: 'enabled',
                inputSanitization: 'enabled',
                fileUploadSecurity: 'enabled',
                logging: 'enabled'
            },
            fipe: {
                baseUrl: config.fipe.baseUrl,
                cacheTtl: config.fipe.cacheTtl
            },
            upload: {
                path: config.upload.path,
                maxFileSize: config.upload.maxFileSize,
                allowedTypes: config.upload.allowedTypes
            },
            logLevel: config.logLevel,
            endpoints: {
                auth: '/api/auth',
                system: '/api/system',
                vehicles: '/api/vehicles',
                maintenances: '/api/maintenances',
                users: '/api/users',
                workshops: '/api/workshops',
                inspections: '/api/inspections',
                notifications: '/api/notifications',
                dashboard: '/api/dashboard',
                health: '/health'
            }
        }
    };
    res.json(response);
});

// 404 handler
app.use((req, res) => {
    const response: ApiResponse = {
        success: false,
        error: 'Endpoint not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    };
    res.status(404).json(response);
});

// Error handler global (deve ser o último middleware)
app.use(errorHandler);// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);

    const response: ApiResponse = {
        success: false,
        error: config.isDevelopment ? err.message : 'Internal server error',
        message: 'An error occurred while processing your request'
    };

    res.status(500).json(response);
});

// Start server
const server = app.listen(config.port, () => {
    console.log(`🚀 CarRepair API running on port ${config.port}`);
    console.log(`📱 Environment: ${config.nodeEnv}`);
    console.log(`🏥 Health check: http://localhost:${config.port}/health`);
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

export default app;
