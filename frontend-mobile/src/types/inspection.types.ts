export interface Inspection {
    id: string;
    vehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlate: string;
    type: 'regular' | 'transfer' | 'special';
    inspectionDate: string;
    expiryDate: string;
    currentKm: number;
    inspectionCenter: {
        name: string;
        code: string;
        address?: string;
        city: string;
        state: string;
    };
    result: 'approved' | 'rejected' | 'conditional';
    observations?: string;
    defects?: string[];
    cost: number;
    certificate?: string; // URL do certificado
    attachments: InspectionAttachment[];
    status: 'valid' | 'expired' | 'expiring_soon'; // Auto-calculado
    validationCode: string;
    userId: string;
    createdAt: string;
}

export interface InspectionAttachment {
    id: string;
    type: 'photo' | 'pdf' | 'certificate';
    url: string;
    name: string;
    uploadedAt: string;
}

export interface InspectionFormData {
    id?: string;
    vehicleId: string;
    type: 'regular' | 'transfer' | 'special';
    inspectionDate: string;
    expiryDate: string;
    currentKm: number;
    inspectionCenter: {
        name: string;
        code: string;
        address?: string;
        city: string;
        state: string;
    };
    result: 'approved' | 'rejected' | 'conditional';
    observations?: string;
    defects?: string[];
    cost: number;
    attachments: string[];
}

export interface InspectionApiResponse {
    inspections: Inspection[];
    total: number;
}

export interface SingleInspectionApiResponse {
    inspection: Inspection;
}

// Filtros para listagem
export interface InspectionFilters {
    vehicleId?: string;
    type?: 'regular' | 'transfer' | 'special';
    result?: 'approved' | 'rejected' | 'conditional';
    status?: 'valid' | 'expired' | 'expiring_soon';
    dateFrom?: string;
    dateTo?: string;
}

// Tipos específicos de vistoria no Brasil
export const INSPECTION_TYPES = {
    regular: 'Vistoria Regular',
    transfer: 'Vistoria de Transferência',
    special: 'Vistoria Especial'
} as const;

export const INSPECTION_RESULTS = {
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    conditional: 'Aprovado com Restrições'
} as const;

export const INSPECTION_STATUS = {
    valid: 'Válida',
    expired: 'Vencida',
    expiring_soon: 'Vence em Breve'
} as const;

// Estados brasileiros para centros de vistoria
export const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;
