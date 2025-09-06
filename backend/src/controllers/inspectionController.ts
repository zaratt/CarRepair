import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

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
