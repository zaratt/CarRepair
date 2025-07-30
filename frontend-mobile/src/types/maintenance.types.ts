// Maintenance Types for CarRepair App

export interface Maintenance {
    id: string;
    vehicleId: string;           // Referência ao veículo
    userId: string;              // Proprietário
    services: string[];          // Array de serviços realizados
    date: string;               // Data da manutenção (ISO string)
    currentKm: number;          // KM no momento da manutenção
    workshop: {                 // Dados da oficina
        name: string;
        cnpj?: string;
        address?: string;
    };
    value: number;              // Valor total da manutenção
    documents: string[];        // URLs dos documentos (PDF/imagens)
    validationCode: string;     // Código único para validação pela oficina
    status: 'pending' | 'validated' | 'rejected';
    validatedAt?: string;       // Data da validação
    validatedBy?: string;       // Quem validou (oficina)
    rejectionReason?: string;   // Motivo da rejeição (se rejeitada)
    createdAt: string;         // Data de criação do registro
    updatedAt: string;         // Última atualização
}

// Form Types para criação de manutenção
export interface MaintenanceFormData {
    vehicleId: string;
    services: string[];
    date: string;
    currentKm: number;
    workshop: {
        name: string;
        cnpj?: string;
        address?: string;
    };
    value: number;
    documents?: string[];
}

// Serviços mais comuns no Brasil
export const BRAZILIAN_COMMON_SERVICES = [
    // Básicos
    "Troca de Óleo",
    "Filtro de Óleo",
    "Filtro de Ar",
    "Filtro de Combustível",
    "Filtro de Cabine",

    // Freios
    "Pastilhas de Freio",
    "Discos de Freio",
    "Fluido de Freio",

    // Suspensão/Direção  
    "Alinhamento",
    "Balanceamento",
    "Amortecedores",
    "Molas",

    // Pneus
    "Troca de Pneus",
    "Rodízio de Pneus",
    "Calibragem",

    // Motor
    "Velas de Ignição",
    "Correias",
    "Bateria",
    "Radiador",

    // Revisões
    "Revisão Preventiva",
    "Revisão dos 10.000km",
    "Revisão dos 20.000km",

    // Outros
    "Ar Condicionado",
    "Sistema Elétrico",
    "Escapamento",
] as const;

// Filtros disponíveis
export type MaintenanceStatus = 'all' | 'pending' | 'validated' | 'rejected';

export interface MaintenanceFilters {
    vehicleId?: string;
    status: MaintenanceStatus;
    startDate?: string;
    endDate?: string;
}

// Navigation Types
export type MaintenanceStackParamList = {
    MaintenanceList: undefined;
    MaintenanceDetails: { maintenanceId: string };
    AddMaintenance: undefined;
};

// API Response Types
export interface MaintenanceApiResponse {
    success: boolean;
    data: Maintenance[];
    message?: string;
}

export interface SingleMaintenanceApiResponse {
    success: boolean;
    data: Maintenance;
    message?: string;
}
