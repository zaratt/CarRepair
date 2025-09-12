import cors from 'cors';
import express from 'express';
import { config, validateConfig } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import inspectionRoutes from './routes/inspectionRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import notificationRoutes from './routes/notificationRoutes';
import systemRoutes from './routes/systemRoutes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/userRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import workshopRoutes from './routes/workshopRoutes';
import { ApiResponse } from './types';

// Validar configurações na inicialização
validateConfig();

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (simples para desenvolvimento)
if (config.isDevelopment) {
    app.use((req, res, next) => {
        console.log(`📡 ${req.method} ${req.path}`, {
            body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
            query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
        });
        next();
    });
}

// ✅ Middleware para servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

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
    const response: ApiResponse = {
        success: true,
        message: 'CarRepair API is running',
        data: {
            version: '2.0.0',
            environment: config.nodeEnv,
            port: config.port,
            timestamp: new Date().toISOString(),
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
