export interface Brand {
    id: string;
    name: string;
}

export interface Model {
    id: string;
    name: string;
    brandId: string;
}

export type FuelType =
    | 'GASOLINE'
    | 'ETHANOL'
    | 'FLEX'
    | 'DIESEL'
    | 'GNV'
    | 'ELECTRIC'
    | 'HYBRID'
    | 'OTHER';

export interface VehiclePhoto {
    id: string;
    url: string;
    vehicleId: string;
    createdAt: string;
}

export interface Vehicle {
    id: string;
    licensePlate: string;
    brandId: string;
    modelId: string;
    yearManufacture: number;
    modelYear: number;
    fuelType: FuelType;
    vin: string;
    ownerId?: string;
    owner?: {
        id: string;
        name: string;
        email: string;
        cpfCnpj: string;
        type: string;
        profile: string;
    };
    createdAt: string;
    brand?: Brand;
    model?: Model;
    photos?: VehiclePhoto[];
    active?: boolean; // Indica se o veículo está ativo
    soldAt?: string; // Data da venda, se aplicável
}

export interface User {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    type: string;
    profile: string;
    phone?: string;
    city?: string;
    state?: string;
    isValidated?: boolean;
    createdAt?: string;
}

export interface Workshop {
    id: string;
    name: string; // Nome da oficina
    userId: string;
    address: string;
    phone: string;
    subdomain?: string;
    user?: { name: string };
    rating?: number; // 1 a 5 estrelas
}

export interface Maintenance {
    id: string;
    vehicleId: string;
    workshopId: string;
    date: string;
    description: string;
    value: number;
    serviceStatus: string; // Status do serviço (sempre "concluído")
    validationStatus: string; // Status de validação (registrado, pendente, validado)
    validationCode?: string; // Código único para validação
    mileage: number; // KM
    createdAt: string;
    vehicle?: {
        licensePlate: string;
        brand?: Brand;
        model?: Model;
        owner?: {
            id: string;
            name: string;
            email: string;
        };
    };
    workshop?: Workshop;
    inspection?: Inspection | null; // Inspeção mais recente (se houver)
}

export interface InspectionAttachment {
    id: string;
    url: string;
    type: string; // 'image/jpeg', 'application/pdf', etc
    name?: string;
}

export interface Inspection {
    id: string;
    vehicleId: string;
    vehicle?: Vehicle; // Adicionado para acesso direto no frontend
    status?: string;
    company?: string;
    date?: string;
    fileUrl: string;
    uploadedById: string;
    uploadedBy?: { id: string; name: string };
    createdAt?: string;
    updatedAt?: string;
    attachments?: InspectionAttachment[];
}