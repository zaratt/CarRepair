import { Inspection } from '../types/inspection.types';

// Mock data de vistorias
export const mockInspections: Inspection[] = [
    {
        id: '1',
        vehicleId: '1',
        vehicleBrand: 'Honda',
        vehicleModel: 'Civic',
        vehiclePlate: 'ABC-1234',
        type: 'regular',
        inspectionDate: '2024-06-15T10:00:00.000Z',
        expiryDate: '2025-06-15T23:59:59.000Z',
        currentKm: 45000,
        inspectionCenter: {
            name: 'Centro de Vistoria Detran SP',
            code: 'CVD-001',
            address: 'Av. Paulista, 1000',
            city: 'São Paulo',
            state: 'SP'
        },
        result: 'approved',
        observations: 'Veículo em perfeitas condições',
        cost: 85.50,
        certificate: 'https://example.com/cert_001.pdf',
        attachments: [
            {
                id: 'att1',
                type: 'certificate',
                url: 'https://example.com/cert_001.pdf',
                name: 'Certificado de Vistoria',
                uploadedAt: '2024-06-15T10:30:00.000Z'
            },
            {
                id: 'att2',
                type: 'photo',
                url: 'https://example.com/photo_001.jpg',
                name: 'Foto do Veículo',
                uploadedAt: '2024-06-15T10:15:00.000Z'
            }
        ],
        status: 'valid',
        validationCode: 'VST-2024-001',
        userId: 'user1',
        createdAt: '2024-06-15T10:00:00.000Z'
    },
    {
        id: '2',
        vehicleId: '2',
        vehicleBrand: 'Toyota',
        vehicleModel: 'Corolla',
        vehiclePlate: 'XYZ-5678',
        type: 'transfer',
        inspectionDate: '2024-03-20T14:00:00.000Z',
        expiryDate: '2025-03-20T23:59:59.000Z',
        currentKm: 62000,
        inspectionCenter: {
            name: 'Vistoria Veicular Rio',
            code: 'VVR-025',
            address: 'Rua da Vistoria, 500',
            city: 'Rio de Janeiro',
            state: 'RJ'
        },
        result: 'conditional',
        observations: 'Aprovado com restrição para pneu dianteiro direito',
        defects: ['Pneu dianteiro direito com desgaste irregular'],
        cost: 95.00,
        certificate: 'https://example.com/cert_002.pdf',
        attachments: [
            {
                id: 'att3',
                type: 'certificate',
                url: 'https://example.com/cert_002.pdf',
                name: 'Certificado de Vistoria',
                uploadedAt: '2024-03-20T14:30:00.000Z'
            }
        ],
        status: 'expiring_soon',
        validationCode: 'VST-2024-002',
        userId: 'user1',
        createdAt: '2024-03-20T14:00:00.000Z'
    },
    {
        id: '3',
        vehicleId: '3',
        vehicleBrand: 'Volkswagen',
        vehicleModel: 'Gol',
        vehiclePlate: 'DEF-9012',
        type: 'regular',
        inspectionDate: '2023-08-10T09:00:00.000Z',
        expiryDate: '2024-08-10T23:59:59.000Z',
        currentKm: 98000,
        inspectionCenter: {
            name: 'Auto Vistoria BH',
            code: 'AVB-015',
            address: 'Av. Contorno, 2000',
            city: 'Belo Horizonte',
            state: 'MG'
        },
        result: 'approved',
        observations: 'Veículo aprovado sem restrições',
        cost: 78.00,
        certificate: 'https://example.com/cert_003.pdf',
        attachments: [
            {
                id: 'att4',
                type: 'certificate',
                url: 'https://example.com/cert_003.pdf',
                name: 'Certificado de Vistoria',
                uploadedAt: '2023-08-10T09:30:00.000Z'
            },
            {
                id: 'att5',
                type: 'photo',
                url: 'https://example.com/photo_003.jpg',
                name: 'Foto Lateral',
                uploadedAt: '2023-08-10T09:15:00.000Z'
            }
        ],
        status: 'expired',
        validationCode: 'VST-2023-003',
        userId: 'user1',
        createdAt: '2023-08-10T09:00:00.000Z'
    }
];

// Função para buscar vistorias por usuário
export const getInspectionsByUser = (userId: string): Inspection[] => {
    return mockInspections.filter(inspection => inspection.userId === userId);
};

// Função para buscar vistoria por ID
export const getInspectionById = (id: string): Inspection | undefined => {
    return mockInspections.find(inspection => inspection.id === id);
};

// Função para buscar vistorias por veículo
export const getInspectionsByVehicle = (vehicleId: string): Inspection[] => {
    return mockInspections.filter(inspection => inspection.vehicleId === vehicleId);
};

// Função para criar nova vistoria
export const createInspection = (data: Omit<Inspection, 'id' | 'createdAt' | 'validationCode' | 'status'>): Inspection => {
    const now = new Date().toISOString();
    const validationCode = `VST-${new Date().getFullYear()}-${String(mockInspections.length + 1).padStart(3, '0')}`;

    // Calcular status baseado na data de expiração
    const expiryDate = new Date(data.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let status: 'valid' | 'expired' | 'expiring_soon';
    if (daysUntilExpiry < 0) {
        status = 'expired';
    } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
    } else {
        status = 'valid';
    }

    const newInspection: Inspection = {
        ...data,
        id: String(mockInspections.length + 1),
        validationCode,
        status,
        createdAt: now
    };

    mockInspections.push(newInspection);
    return newInspection;
};

// Função para atualizar vistoria
export const updateInspection = (id: string, data: Partial<Inspection>): Inspection | null => {
    const index = mockInspections.findIndex(inspection => inspection.id === id);
    if (index === -1) return null;

    mockInspections[index] = { ...mockInspections[index], ...data };
    return mockInspections[index];
};

// Função para deletar vistoria
export const deleteInspection = (id: string): boolean => {
    const index = mockInspections.findIndex(inspection => inspection.id === id);
    if (index === -1) return false;

    mockInspections.splice(index, 1);
    return true;
};

// Função para calcular estatísticas
export const getInspectionStats = (userId: string) => {
    const userInspections = getInspectionsByUser(userId);

    return {
        total: userInspections.length,
        valid: userInspections.filter(i => i.status === 'valid').length,
        expiring: userInspections.filter(i => i.status === 'expiring_soon').length,
        expired: userInspections.filter(i => i.status === 'expired').length,
        approved: userInspections.filter(i => i.result === 'approved').length,
        conditional: userInspections.filter(i => i.result === 'conditional').length,
        rejected: userInspections.filter(i => i.result === 'rejected').length
    };
};
