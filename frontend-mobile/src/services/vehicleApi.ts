// Vehicle API Service - Backend próprio

import { EditableVehicleData, SingleVehicleApiResponse, Vehicle, VehicleApiResponse, VehicleFormData } from '../types/vehicle.types';

// TODO: Substituir por URL do backend real
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class VehicleApiService {
    private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Adicionar token de autenticação
                    // 'Authorization': `Bearer ${token}`,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Vehicle API Error:', error);
            throw new Error('Falha ao conectar com o servidor. Verifique sua conexão.');
        }
    }

    /**
     * Buscar todos os veículos do usuário logado
     */
    async getUserVehicles(): Promise<Vehicle[]> {
        console.log('🚗 Buscando veículos do usuário...');
        const response = await this.fetchApi<VehicleApiResponse>('/vehicles');

        if (!response.success) {
            throw new Error(response.message || 'Erro ao buscar veículos');
        }

        console.log(`✅ ${response.data.length} veículos encontrados`);
        return response.data;
    }

    /**
     * Buscar um veículo específico por ID
     */
    async getVehicleById(vehicleId: string): Promise<Vehicle> {
        console.log(`🚗 Buscando veículo ${vehicleId}...`);
        const response = await this.fetchApi<SingleVehicleApiResponse>(`/vehicles/${vehicleId}`);

        if (!response.success) {
            throw new Error(response.message || 'Veículo não encontrado');
        }

        console.log('✅ Veículo encontrado:', response.data);
        return response.data;
    }

    /**
     * Criar novo veículo
     */
    async createVehicle(vehicleData: VehicleFormData): Promise<Vehicle> {
        console.log('🚗 Criando novo veículo...', vehicleData);
        const response = await this.fetchApi<SingleVehicleApiResponse>('/vehicles', {
            method: 'POST',
            body: JSON.stringify(vehicleData),
        });

        if (!response.success) {
            throw new Error(response.message || 'Erro ao criar veículo');
        }

        console.log('✅ Veículo criado com sucesso:', response.data);
        return response.data;
    }

    /**
     * Atualizar dados editáveis do veículo (placa, KM, cor)
     */
    async updateVehicle(vehicleId: string, updateData: EditableVehicleData): Promise<Vehicle> {
        console.log(`🚗 Atualizando veículo ${vehicleId}...`, updateData);
        const response = await this.fetchApi<SingleVehicleApiResponse>(`/vehicles/${vehicleId}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData),
        });

        if (!response.success) {
            throw new Error(response.message || 'Erro ao atualizar veículo');
        }

        console.log('✅ Veículo atualizado com sucesso:', response.data);
        return response.data;
    }

    /**
     * Excluir veículo
     */
    async deleteVehicle(vehicleId: string): Promise<void> {
        console.log(`🚗 Excluindo veículo ${vehicleId}...`);
        const response = await this.fetchApi<{ success: boolean; message?: string }>(`/vehicles/${vehicleId}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.message || 'Erro ao excluir veículo');
        }

        console.log('✅ Veículo excluído com sucesso');
    }

    /**
     * Formatar placa para exibição
     * "ABC1234" -> "ABC-1234"
     */
    formatPlate(plate: string): string {
        const cleanPlate = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();

        if (cleanPlate.length === 7) {
            return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
        }

        return cleanPlate;
    }

    /**
     * Formatar KM para exibição
     * 85240 -> "85.240 km"
     */
    formatKm(km: number): string {
        return `${km.toLocaleString('pt-BR')} km`;
    }
}

// Mock data para desenvolvimento (remover quando backend estiver pronto)
export const mockVehicles: Vehicle[] = [
    {
        id: '1',
        brand: 'Honda',
        model: 'Civic',
        year: 2020,
        plate: 'ABC-1234',
        currentKm: 85240,
        fipeValue: 85000,
        fipeCode: '001004-9',
        color: 'Prata',
        photos: [
            'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
            'https://images.unsplash.com/photo-1592840301632-0dfa9e7300e1?w=800',
        ],
        userId: 'user1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-07-27T15:30:00Z',
    },
    {
        id: '2',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2019,
        plate: 'XYZ-5678',
        currentKm: 92150,
        fipeValue: 78000,
        fipeCode: '018003-1',
        color: 'Branco',
        photos: [
            'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
        ],
        userId: 'user1',
        createdAt: '2024-02-10T14:20:00Z',
        updatedAt: '2024-07-20T09:15:00Z',
    },
    {
        id: '3',
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2021,
        plate: 'POL-9876',
        currentKm: 45320,
        fipeValue: 72000,
        fipeCode: '005012-4',
        color: 'Azul',
        photos: [
            'https://images.unsplash.com/photo-1614015070768-a3a61e138d2c?w=800',
            'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
            'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
        ],
        userId: 'user1',
        createdAt: '2024-03-05T16:45:00Z',
        updatedAt: '2024-07-25T11:20:00Z',
    },
];

/**
 * Mock function para atualizar veículo (desenvolvimento)
 */
export const updateVehicle = async (vehicleId: string, updateData: { plate: string; currentKm: number; color: string; photos?: string[] }): Promise<Vehicle> => {
    console.log(`🚗 [MOCK] Atualizando veículo ${vehicleId}...`, updateData);

    const vehicleIndex = mockVehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) {
        throw new Error('Veículo não encontrado');
    }

    // Atualizar dados do veículo no mock
    mockVehicles[vehicleIndex] = {
        ...mockVehicles[vehicleIndex],
        plate: updateData.plate,
        currentKm: updateData.currentKm,
        color: updateData.color,
        photos: updateData.photos || mockVehicles[vehicleIndex].photos, // Manter fotos existentes se não fornecidas
        updatedAt: new Date().toISOString(),
    };

    console.log('✅ [MOCK] Veículo atualizado:', mockVehicles[vehicleIndex]);
    return mockVehicles[vehicleIndex];
};

export const vehicleApiService = new VehicleApiService();
