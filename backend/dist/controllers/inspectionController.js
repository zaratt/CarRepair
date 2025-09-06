"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInspections = exports.scheduleInspection = exports.getInspectionTypes = exports.getInspectionStats = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
// Obter estatísticas de vistorias
exports.getInspectionStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const response = {
        success: true,
        message: 'Inspection statistics retrieved successfully',
        data: stats
    };
    res.json(response);
});
// Obter tipos de vistoria
exports.getInspectionTypes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const response = {
        success: true,
        message: 'Inspection types retrieved successfully',
        data: types
    };
    res.json(response);
});
// Agendar vistoria
exports.scheduleInspection = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const response = {
        success: true,
        message: 'Inspection scheduled successfully',
        data: newInspection
    };
    res.status(201).json(response);
});
// Obter vistorias do usuário
exports.getUserInspections = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId || 'default_user'; // Para quando não há userId na rota
    // Mock data
    const inspections = [
        {
            id: 'insp_001',
            vehicleId: 'vh_001',
            vehicleName: 'Honda Civic 2020',
            type: 'annual',
            typeName: 'Vistoria Anual',
            status: 'completed',
            scheduledDate: '2025-08-15T09:00:00Z',
            completedDate: '2025-08-15T09:45:00Z',
            protocol: 'VIS123456',
            result: 'approved',
            inspector: 'João Silva',
            location: 'Centro de Vistoria - Unidade Principal',
            observations: 'Veículo em excelente estado de conservação.'
        },
        {
            id: 'insp_002',
            vehicleId: 'vh_002',
            vehicleName: 'Toyota Corolla 2019',
            type: 'transfer',
            typeName: 'Vistoria de Transferência',
            status: 'scheduled',
            scheduledDate: '2025-09-05T14:30:00Z',
            protocol: 'VIS234567',
            inspector: 'Maria Santos',
            location: 'Centro de Vistoria - Unidade Norte',
            instructions: 'Trazer comprovante de venda original.'
        }
    ];
    const response = {
        success: true,
        message: 'User inspections retrieved successfully',
        data: inspections
    };
    res.json(response);
});
//# sourceMappingURL=inspectionController.js.map