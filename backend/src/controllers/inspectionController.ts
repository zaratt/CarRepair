import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logSecurityEvent, SecurityEventType } from '../middleware/securityLogger';
import { notifyInspectionApproved, notifyInspectionCreated, notifyInspectionRejected } from '../services/notificationService';
import { ApiResponse } from '../types';

const prisma = new PrismaClient();

// ✅ CRUD COMPLETO DE INSPEÇÕES

// Criar nova inspeção
export const createInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { vehicleId, status, company, date, fileUrl } = req.body;
    const userId = req.user?.userId;

    // Validações básicas
    if (!vehicleId || !status || !company || !date) {
        res.status(400).json({
            success: false,
            message: 'Campos obrigatórios: vehicleId, status, company, date'
        });
        return;
    }

    // Verificar se o veículo pertence ao usuário
    const vehicle = await prisma.vehicle.findFirst({
        where: {
            id: vehicleId,
            ownerId: userId
        }
    });

    if (!vehicle) {
        logSecurityEvent({
            type: SecurityEventType.PERMISSION_DENIED,
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: req.originalUrl,
            method: req.method,
            payload: { vehicleId, userId },
            success: false,
            message: 'Tentativa de criar inspeção para veículo não autorizado',
            risk_level: 'MEDIUM'
        });

        res.status(403).json({
            success: false,
            message: 'Veículo não encontrado ou não autorizado'
        });
        return;
    }

    const inspection = await prisma.inspection.create({
        data: {
            vehicleId,
            status,
            company,
            date: new Date(date),
            fileUrl: fileUrl || '',
            uploadedById: userId!
        },
        include: {
            vehicle: {
                select: {
                    licensePlate: true,
                    brand: {
                        select: { name: true }
                    },
                    model: {
                        select: { name: true }
                    }
                }
            },
            attachments: true
        }
    });

    logSecurityEvent({
        type: SecurityEventType.DATA_MODIFICATION,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        endpoint: req.originalUrl,
        method: req.method,
        payload: { inspectionId: inspection.id, vehicleId },
        success: true,
        message: 'Nova inspeção criada',
        risk_level: 'LOW'
    });

    // ✅ GERAR NOTIFICAÇÃO AUTOMÁTICA
    await notifyInspectionCreated(
        inspection.id,
        userId!,
        inspection.vehicle?.licensePlate || 'N/A'
    );

    const response: ApiResponse = {
        success: true,
        message: 'Inspeção criada com sucesso',
        data: inspection
    };

    res.status(201).json(response);
});

// Obter todas as inspeções do usuário
export const getInspections = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { page = '1', limit = '10', status, vehicleId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = {
        uploadedById: userId
    };

    if (status) {
        where.status = status;
    }

    if (vehicleId) {
        where.vehicleId = vehicleId;
    }

    const [inspections, total] = await Promise.all([
        prisma.inspection.findMany({
            where,
            include: {
                vehicle: {
                    select: {
                        licensePlate: true,
                        brand: {
                            select: { name: true }
                        },
                        model: {
                            select: { name: true }
                        }
                    }
                },
                attachments: true
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
        }),
        prisma.inspection.count({ where })
    ]);

    const response: ApiResponse = {
        success: true,
        message: 'Inspeções obtidas com sucesso',
        data: {
            inspections,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        }
    };

    res.json(response);
});

// Obter inspeção específica
export const getInspectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const inspection = await prisma.inspection.findFirst({
        where: {
            id,
            uploadedById: userId
        },
        include: {
            vehicle: {
                select: {
                    licensePlate: true,
                    brand: {
                        select: { name: true }
                    },
                    model: {
                        select: { name: true }
                    }
                }
            },
            attachments: true,
            uploadedBy: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!inspection) {
        res.status(404).json({
            success: false,
            message: 'Inspeção não encontrada'
        });
        return;
    }

    logSecurityEvent({
        type: SecurityEventType.DATA_ACCESS,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        endpoint: req.originalUrl,
        method: req.method,
        payload: { inspectionId: id },
        success: true,
        message: 'Inspeção acessada',
        risk_level: 'LOW'
    });

    const response: ApiResponse = {
        success: true,
        message: 'Inspeção obtida com sucesso',
        data: inspection
    };

    res.json(response);
});

// Atualizar inspeção
export const updateInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, company, date, fileUrl } = req.body;
    const userId = req.user?.userId;

    // Verificar se a inspeção pertence ao usuário
    const existingInspection = await prisma.inspection.findFirst({
        where: {
            id,
            uploadedById: userId
        }
    });

    if (!existingInspection) {
        res.status(404).json({
            success: false,
            message: 'Inspeção não encontrada ou não autorizada'
        });
        return;
    }

    const inspection = await prisma.inspection.update({
        where: { id },
        data: {
            ...(status && { status }),
            ...(company && { company }),
            ...(date && { date: new Date(date) }),
            ...(fileUrl && { fileUrl })
        },
        include: {
            vehicle: {
                select: {
                    licensePlate: true,
                    brand: {
                        select: { name: true }
                    },
                    model: {
                        select: { name: true }
                    }
                }
            },
            attachments: true
        }
    });

    // ✅ GERAR NOTIFICAÇÃO BASEADA NA MUDANÇA DE STATUS
    if (status && status !== existingInspection.status) {
        const vehiclePlate = inspection.vehicle?.licensePlate || 'N/A';

        switch (status) {
            case 'Aprovado':
                await notifyInspectionApproved(inspection.id, userId!, vehiclePlate);
                break;
            case 'Não conforme':
                await notifyInspectionRejected(inspection.id, userId!, vehiclePlate);
                break;
        }
    }

    logSecurityEvent({
        type: SecurityEventType.DATA_MODIFICATION,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        endpoint: req.originalUrl,
        method: req.method,
        payload: { inspectionId: id },
        success: true,
        message: 'Inspeção atualizada',
        risk_level: 'LOW'
    });

    const response: ApiResponse = {
        success: true,
        message: 'Inspeção atualizada com sucesso',
        data: inspection
    };

    res.json(response);
});

// Deletar inspeção
export const deleteInspection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Verificar se a inspeção pertence ao usuário
    const inspection = await prisma.inspection.findFirst({
        where: {
            id,
            uploadedById: userId
        }
    });

    if (!inspection) {
        res.status(404).json({
            success: false,
            message: 'Inspeção não encontrada ou não autorizada'
        });
        return;
    }

    // Deletar anexos relacionados primeiro
    await prisma.inspectionAttachment.deleteMany({
        where: { inspectionId: id }
    });

    // Deletar a inspeção
    await prisma.inspection.delete({
        where: { id }
    });

    logSecurityEvent({
        type: SecurityEventType.DATA_MODIFICATION,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        endpoint: req.originalUrl,
        method: req.method,
        payload: { inspectionId: id },
        success: true,
        message: 'Inspeção deletada',
        risk_level: 'MEDIUM'
    });

    const response: ApiResponse = {
        success: true,
        message: 'Inspeção deletada com sucesso'
    };

    res.json(response);
});

// Obter estatísticas de vistorias
export const getInspectionStats = asyncHandler(async (req: Request, res: Response) => {
    // Mock data para desenvolvimento
    const stats = {
        total: 45,
        pending: 12,
        completed: 28,
        rejected: 5,
        thisMonth: 8,
        lastMonth: 12,
        avgCompletionTime: 5.2, // dias
        popularInspectionTypes: [
            { type: 'Anual', count: 20 },
            { type: 'Transferência', count: 15 },
            { type: 'Perícia', count: 10 }
        ]
    };

    const response: ApiResponse = {
        success: true,
        message: 'Inspection statistics retrieved successfully',
        data: stats
    };

    res.json(response);
});

// Obter tipos de vistoria
export const getInspectionTypes = asyncHandler(async (req: Request, res: Response) => {
    const types = [
        {
            id: 'annual',
            name: 'Vistoria Anual',
            description: 'Vistoria obrigatória anual do veículo',
            requiredDocuments: ['CNH', 'CRLV', 'Comprovante de residência'],
            estimatedTime: '30-45 minutos',
            cost: 'R$ 68,00'
        },
        {
            id: 'transfer',
            name: 'Vistoria de Transferência',
            description: 'Vistoria necessária para transferência de propriedade',
            requiredDocuments: ['CNH', 'CRLV', 'Comprovante de venda', 'Comprovante de residência'],
            estimatedTime: '45-60 minutos',
            cost: 'R$ 85,00'
        },
        {
            id: 'expertise',
            name: 'Perícia Técnica',
            description: 'Vistoria técnica especializada para seguros ou disputas',
            requiredDocuments: ['CNH', 'CRLV', 'Boletim de ocorrência (se aplicável)'],
            estimatedTime: '60-90 minutos',
            cost: 'R$ 150,00'
        },
        {
            id: 'modification',
            name: 'Vistoria de Modificação',
            description: 'Vistoria para aprovação de modificações no veículo',
            requiredDocuments: ['CNH', 'CRLV', 'Projeto de modificação', 'ART do responsável técnico'],
            estimatedTime: '90-120 minutos',
            cost: 'R$ 200,00'
        }
    ];

    const response: ApiResponse = {
        success: true,
        message: 'Inspection types retrieved successfully',
        data: types
    };

    res.json(response);
});

// Agendar vistoria
export const scheduleInspection = asyncHandler(async (req: Request, res: Response) => {
    const inspectionData = req.body;

    // Mock response
    const newInspection = {
        id: `insp_${Date.now()}`,
        vehicleId: inspectionData.vehicleId,
        type: inspectionData.type,
        scheduledDate: inspectionData.scheduledDate,
        status: 'scheduled',
        location: inspectionData.location || 'Centro de Vistoria - Unidade Principal',
        protocol: `VIS${Date.now().toString().slice(-6)}`,
        estimatedDuration: '45 minutos',
        inspector: 'João Silva',
        instructions: 'Chegar 15 minutos antes do horário agendado. Trazer todos os documentos obrigatórios.',
        createdAt: new Date().toISOString()
    };

    const response: ApiResponse = {
        success: true,
        message: 'Inspection scheduled successfully',
        data: newInspection
    };

    res.status(201).json(response);
});

// Obter vistorias do usuário
export const getUserInspections = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId || 'default_user'; // Para quando não há userId na rota

    // Em um ambiente real, buscaríamos do banco de dados
    // Por enquanto, retornamos lista vazia já que não há inspeções reais implementadas
    const inspections: any[] = [];

    const response: ApiResponse = {
        success: true,
        message: 'User inspections retrieved successfully',
        data: inspections
    };

    res.json(response);
});
