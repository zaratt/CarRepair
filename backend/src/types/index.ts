export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
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

export interface VehicleCreateData {
    licensePlate: string;
    fipeTypeId?: number;
    fipeBrandId?: number;
    fipeModelId?: number;
    fipeYearCode?: string;
    yearManufacture: number;
    modelYear: number;
    fuelType: FuelType;
    vin?: string;
    ownerId?: string;
    // ✅ Novos campos para informações do usuário
    currentKm?: number;
    color?: string;
    fipeValue?: number;
}

export interface MaintenanceCreateData {
    vehicleId: string;
    workshopId?: string;
    date: Date;
    description?: string;
    services?: string[]; // ✅ NOVO: Array de serviços realizados
    products?: string;  // ✅ ALTERADO: Agora opcional
    workshopName?: string; // ✅ NOVO: Nome da oficina
    workshopCnpj?: string; // ✅ NOVO: CNPJ da oficina  
    workshopAddress?: string; // ✅ NOVO: Endereço da oficina
    mileage: number;
    value?: number;
}

// ✅ NOVO: Interface para anexos de manutenção
export interface MaintenanceAttachmentData {
    url: string;
    type: 'image' | 'pdf';
    category: 'nota_fiscal' | 'orcamento' | 'garantia' | 'outros';
    name?: string;
    size?: number;
    mimeType?: string;
}

export interface ParsedMonetaryValue {
    success: boolean;
    value: number | null;
    originalString: string;
    error?: string;
}

export interface ParsedKilometerValue {
    success: boolean;
    value: number | null;
    originalString: string;
    error?: string;
}

export type UserType = 'individual' | 'business';

export interface UserCreateData {
    name: string;
    email: string;
    phone?: string;
    document: string; // CPF ou CNPJ
    userType?: UserType; // Será determinado automaticamente
    city?: string;
    state?: string;
}

export interface UserUpdateData {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
}

export interface DocumentValidation {
    isValid: boolean;
    type: 'cpf' | 'cnpj' | 'unknown';
    formatted: string;
    originalValue: string;
    error?: string;
}
