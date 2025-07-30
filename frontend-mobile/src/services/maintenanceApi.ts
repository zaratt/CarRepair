import { Maintenance, MaintenanceStatus } from '../types/maintenance.types';

// Serviços de manutenção brasileiros comuns
export const COMMON_SERVICES = [
    'Troca de óleo',
    'Filtro de óleo',
    'Filtro de ar',
    'Filtro de combustível',
    'Velas de ignição',
    'Alinhamento',
    'Balanceamento',
    'Revisão geral',
    'Troca de pneus',
    'Freios dianteiros',
    'Freios traseiros',
    'Bateria',
    'Correia dentada',
    'Amortecedores',
    'Embreagem',
    'Radiador',
    'Ar condicionado',
    'Sistema elétrico',
    'Suspensão',
    'Escapamento',
];

// Oficinas mock
export const MOCK_WORKSHOPS = [
    {
        id: '1',
        name: 'Auto Center Silva',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Flores, 123 - São Paulo/SP',
        phone: '(11) 1234-5678',
        isVerified: true,
    },
    {
        id: '2',
        name: 'Mecânica do João',
        cnpj: '98.765.432/0001-10',
        address: 'Av. Brasil, 456 - Rio de Janeiro/RJ',
        phone: '(21) 9876-5432',
        isVerified: true,
    },
    {
        id: '3',
        name: 'Oficina Express',
        cnpj: '11.222.333/0001-44',
        address: 'Rua da Mecânica, 789 - Belo Horizonte/MG',
        phone: '(31) 1111-2222',
        isVerified: false,
    },
    {
        id: '4',
        name: 'AutoService Premium',
        cnpj: '55.666.777/0001-88',
        address: 'Rua dos Carros, 321 - Porto Alegre/RS',
        phone: '(51) 5555-6666',
        isVerified: true,
    },
];

// Função para gerar código de validação
const generateValidationCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Função para gerar data aleatória dos últimos 6 meses
const generateRandomDate = (): string => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime).toISOString();
};

// Mock data para manutenções
export const mockMaintenances: Maintenance[] = [
    {
        id: '1',
        userId: 'user1',
        vehicleId: '1', // Civic 2020
        date: '2024-01-15T10:00:00.000Z',
        services: ['Troca de óleo', 'Filtro de óleo', 'Revisão geral'],
        value: 280.50,
        currentKm: 45000,
        workshop: MOCK_WORKSHOPS[0],
        documents: [
            'https://example.com/doc1.pdf',
            'https://example.com/receipt1.jpg',
        ],
        validationCode: 'MNT45A7B',
        status: 'validated',
        validatedAt: '2024-01-16T14:30:00.000Z',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T14:30:00.000Z',
    },
    {
        id: '2',
        userId: 'user1',
        vehicleId: '1', // Civic 2020
        date: '2024-02-20T14:30:00.000Z',
        services: ['Alinhamento', 'Balanceamento', 'Troca de pneus'],
        value: 650.00,
        currentKm: 47500,
        workshop: MOCK_WORKSHOPS[1],
        documents: [
            'https://example.com/alignment.pdf',
        ],
        validationCode: 'ALN20C9D',
        status: 'validated',
        validatedAt: '2024-02-21T09:15:00.000Z',
        createdAt: '2024-02-20T14:30:00.000Z',
        updatedAt: '2024-02-21T09:15:00.000Z',
    },
    {
        id: '3',
        userId: 'user1',
        vehicleId: '2', // Onix 2019
        date: '2024-01-10T09:00:00.000Z',
        services: ['Velas de ignição', 'Filtro de ar', 'Sistema elétrico'],
        value: 320.00,
        currentKm: 62000,
        workshop: MOCK_WORKSHOPS[0],
        documents: [
            'https://example.com/electrical.jpg',
            'https://example.com/sparks.pdf',
        ],
        validationCode: 'ELE10F2G',
        status: 'validated',
        validatedAt: '2024-01-11T16:45:00.000Z',
        createdAt: '2024-01-10T09:00:00.000Z',
        updatedAt: '2024-01-11T16:45:00.000Z',
    },
    {
        id: '4',
        userId: 'user1',
        vehicleId: '1', // Civic 2020
        date: '2024-03-05T11:15:00.000Z',
        services: ['Freios dianteiros', 'Freios traseiros'],
        value: 450.00,
        currentKm: 49200,
        workshop: MOCK_WORKSHOPS[2],
        documents: [
            'https://example.com/brakes.pdf',
        ],
        validationCode: 'BRK05H4J',
        status: 'pending',
        createdAt: '2024-03-05T11:15:00.000Z',
        updatedAt: '2024-03-05T11:15:00.000Z',
    },
    {
        id: '5',
        userId: 'user1',
        vehicleId: '3', // Corolla 2021
        date: '2024-02-28T16:00:00.000Z',
        services: ['Ar condicionado', 'Filtro de ar', 'Radiador'],
        value: 380.00,
        currentKm: 28500,
        workshop: MOCK_WORKSHOPS[3],
        documents: [
            'https://example.com/ac-service.jpg',
        ],
        validationCode: 'AC28K6L',
        status: 'validated',
        validatedAt: '2024-03-01T10:20:00.000Z',
        createdAt: '2024-02-28T16:00:00.000Z',
        updatedAt: '2024-03-01T10:20:00.000Z',
    },
    {
        id: '6',
        userId: 'user1',
        vehicleId: '2', // Onix 2019
        date: '2024-03-12T13:45:00.000Z',
        services: ['Correia dentada', 'Bateria', 'Escapamento'],
        value: 720.00,
        currentKm: 64800,
        workshop: MOCK_WORKSHOPS[1],
        documents: [
            'https://example.com/timing-belt.pdf',
            'https://example.com/battery.jpg',
        ],
        validationCode: 'TMB12M8N',
        status: 'rejected',
        rejectionReason: 'Documentos incompletos - falta nota fiscal da bateria.',
        createdAt: '2024-03-12T13:45:00.000Z',
        updatedAt: '2024-03-13T09:30:00.000Z',
    },
    {
        id: '7',
        userId: 'user1',
        vehicleId: '4', // HB20 2018
        date: '2024-03-18T08:30:00.000Z',
        services: ['Revisão geral', 'Troca de óleo', 'Filtro de óleo', 'Amortecedores'],
        value: 890.00,
        currentKm: 78500,
        workshop: MOCK_WORKSHOPS[0],
        documents: [
            'https://example.com/full-service.pdf',
        ],
        validationCode: 'REV18P9Q',
        status: 'pending',
        createdAt: '2024-03-18T08:30:00.000Z',
        updatedAt: '2024-03-18T08:30:00.000Z',
    },
    {
        id: '8',
        userId: 'user1',
        vehicleId: '3', // Corolla 2021
        date: '2024-03-22T15:20:00.000Z',
        services: ['Embreagem', 'Suspensão'],
        value: 1250.00,
        currentKm: 31200,
        workshop: MOCK_WORKSHOPS[3],
        documents: [
            'https://example.com/clutch.pdf',
            'https://example.com/suspension.jpg',
        ],
        validationCode: 'CLT22R5S',
        status: 'validated',
        validatedAt: '2024-03-23T11:45:00.000Z',
        createdAt: '2024-03-22T15:20:00.000Z',
        updatedAt: '2024-03-23T11:45:00.000Z',
    },
];

// Função para buscar manutenções por veículo
export const getMaintenancesByVehicle = (vehicleId: string): Maintenance[] => {
    return mockMaintenances.filter(maintenance => maintenance.vehicleId === vehicleId);
};

// Função para buscar todas as manutenções
export const getAllMaintenances = (): Maintenance[] => {
    return mockMaintenances;
};

// Função para buscar manutenção por ID
export const getMaintenanceById = (id: string): Maintenance | undefined => {
    return mockMaintenances.find(maintenance => maintenance.id === id);
};

// Função para buscar manutenções por status
export const getMaintenancesByStatus = (status: MaintenanceStatus): Maintenance[] => {
    return mockMaintenances.filter(maintenance => maintenance.status === status);
};

// Função para criar nova manutenção
export const createMaintenance = (maintenance: Omit<Maintenance, 'id' | 'validationCode' | 'createdAt' | 'updatedAt'>): Maintenance => {
    const newMaintenance: Maintenance = {
        ...maintenance,
        id: Date.now().toString(),
        validationCode: generateValidationCode(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    mockMaintenances.unshift(newMaintenance);
    return newMaintenance;
};

// Função para atualizar manutenção
export const updateMaintenance = (id: string, updates: Partial<Maintenance>): Maintenance | null => {
    const index = mockMaintenances.findIndex(maintenance => maintenance.id === id);
    if (index === -1) return null;

    mockMaintenances[index] = {
        ...mockMaintenances[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    return mockMaintenances[index];
};

// Função para deletar manutenção
export const deleteMaintenance = (id: string): boolean => {
    const index = mockMaintenances.findIndex(maintenance => maintenance.id === id);
    if (index === -1) return false;

    mockMaintenances.splice(index, 1);
    return true;
};
