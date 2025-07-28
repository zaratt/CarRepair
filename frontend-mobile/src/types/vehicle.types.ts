// Vehicle Types for CarRepair App

export interface Vehicle {
    id: string;
    brand: string;        // Marca (imutável - vem da API FIPE)
    model: string;        // Modelo (imutável - vem da API FIPE)
    year: number;         // Ano (imutável - vem da API FIPE)
    plate: string;        // Placa (editável pelo usuário)
    currentKm: number;    // KM Atual (editável pelo usuário)
    fipeValue: number;    // Valor FIPE (imutável - salvo na data do cadastro)
    fipeCode?: string;    // Código FIPE para referência
    color?: string;       // Cor (editável pelo usuário)
    userId: string;       // ID do proprietário
    createdAt: string;    // Data de cadastro
    updatedAt: string;    // Última atualização
}

// FIPE API Response Types
export interface FipeBrand {
    code: string;
    name: string;
}

export interface FipeModel {
    code: string;
    name: string;
}

export interface FipeYear {
    code: string;
    name: string;
}

export interface FipeVehicleData {
    brand: string;
    model: string;
    year: number;
    value: string;        // "R$ 85.000,00"
    month: string;        // "dezembro de 2024"
    code: string;         // Código FIPE
    vehicleType: number;  // 1 = carro
}

// Form Types
export interface VehicleFormData {
    brand: string;
    model: string;
    year: number;
    plate: string;
    currentKm: number;
    color?: string;
}

export interface EditableVehicleData {
    plate: string;
    currentKm: number;
    color?: string;
}

// Navigation Types
export type VehicleStackParamList = {
    VehicleList: undefined;
    VehicleDetails: { vehicleId: string };
    AddVehicle: undefined;
};

// API Response Types
export interface VehicleApiResponse {
    success: boolean;
    data: Vehicle[];
    message?: string;
}

export interface SingleVehicleApiResponse {
    success: boolean;
    data: Vehicle;
    message?: string;
}
