import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, VehiclePhoto } from '../types';
import { api } from './client';

// 📝 Tipos para API de Veículos
export interface CreateVehicleRequest {
    licensePlate: string;
    // Campos FIPE para integração oficial
    fipeTypeId?: number; // ID do tipo de veículo na FIPE (1=carros, 2=motos, 3=caminhões)
    fipeBrandId?: number; // ID da marca na FIPE
    fipeModelId?: number; // ID do modelo na FIPE
    fipeYearCode?: string; // Código do ano/combustível na FIPE (ex: "2020-1")
    // Campos legados (ainda aceitos para compatibilidade)
    brandId?: string;
    modelId?: string;
    // Dados do veículo
    yearManufacture: number;
    modelYear: number;
    fuelType: string;
    vin?: string;
    ownerId?: string;
    color?: string;
    mileage?: number;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
    active?: boolean;
}

export interface VehicleListResponse {
    data: Vehicle[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface VehicleFilters {
    search?: string;
    brandId?: string;
    fuelType?: string;
    active?: boolean;
    page?: number;
    limit?: number;
}

export interface UploadPhotoResponse {
    photo: VehiclePhoto;
    message: string;
}

// 🚗 API de Veículos
export class VehicleAPI {
    // 📋 Listar veículos do usuário
    static async getVehicles(filters?: VehicleFilters): Promise<VehicleListResponse> {
        try {
            // ✅ CORREÇÃO CRÍTICA: Sempre incluir ownerId do usuário logado
            const userData = await AsyncStorage.getItem('user_data');
            const user = userData ? JSON.parse(userData) : null;
            const ownerId = user?.id;

            if (!ownerId) {
                throw new Error('Usuário não autenticado');
            }

            const params = new URLSearchParams();

            // ✅ Garantir que ownerId sempre seja incluído
            params.append('ownerId', ownerId);

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        params.append(key, value.toString());
                    }
                });
            }

            const queryString = params.toString();
            const url = `/vehicles?${queryString}`;

            console.log('🔍 [VEHICLE API] Buscando veículos para ownerId:', ownerId);
            const response = await api.get<VehicleListResponse>(url);
            console.log('🔍 [VEHICLE API] Resposta:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao buscar veículos:', error);

            if (error.response?.status === 403) {
                throw new Error('Acesso negado. Verifique suas permissões.');
            } else if (error.response?.status === 404) {
                throw new Error('Veículos não encontrados');
            }

            throw new Error('Erro ao carregar veículos. Tente novamente.');
        }
    }

    // 🔍 Obter detalhes de um veículo
    static async getVehicleById(vehicleId: string): Promise<Vehicle> {
        try {
            const response = await api.get<{ success: boolean; data: Vehicle }>(`/vehicles/${vehicleId}`);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Erro ao buscar veículo:', error);

            if (error.response?.status === 404) {
                throw new Error('Veículo não encontrado');
            } else if (error.response?.status === 403) {
                throw new Error('Acesso negado a este veículo');
            }

            throw new Error('Erro ao carregar dados do veículo');
        }
    }

    // ➕ Criar novo veículo
    static async createVehicle(vehicleData: CreateVehicleRequest): Promise<Vehicle> {
        try {
            const response = await api.post<{ success: boolean; message: string; data: Vehicle }>('/vehicles', vehicleData);
            console.log('🔍 [API] Response structure:', response.data);
            return response.data.data; // ✅ Corrigido: acessar data.data em vez de data.vehicle
        } catch (error: any) {
            console.error('❌ Erro ao criar veículo:', error);

            if (error.response?.status === 409) {
                throw new Error('Placa já cadastrada');
            } else if (error.response?.status === 400) {
                const message = error.response.data?.message || 'Dados inválidos';
                throw new Error(message);
            } else if (error.response?.status === 422) {
                throw new Error('VIN inválido ou já cadastrado');
            }

            throw new Error('Erro ao cadastrar veículo. Tente novamente.');
        }
    }

    // ✏️ Atualizar veículo
    static async updateVehicle(vehicleId: string, updateData: UpdateVehicleRequest): Promise<Vehicle> {
        try {
            const response = await api.put<{ success: boolean; data: Vehicle }>(`/vehicles/${vehicleId}`, updateData);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Erro ao atualizar veículo:', error);

            if (error.response?.status === 404) {
                throw new Error('Veículo não encontrado');
            } else if (error.response?.status === 403) {
                throw new Error('Sem permissão para alterar este veículo');
            } else if (error.response?.status === 409) {
                throw new Error('Placa já existe em outro veículo');
            }

            throw new Error('Erro ao atualizar veículo. Tente novamente.');
        }
    }

    // 🗑️ Excluir veículo (soft delete)
    static async deleteVehicle(vehicleId: string): Promise<void> {
        try {
            await api.delete(`/vehicles/${vehicleId}`);
        } catch (error: any) {
            console.error('❌ Erro ao excluir veículo:', error);

            if (error.response?.status === 404) {
                throw new Error('Veículo não encontrado');
            } else if (error.response?.status === 403) {
                throw new Error('Sem permissão para excluir este veículo');
            } else if (error.response?.status === 409) {
                throw new Error('Não é possível excluir veículo com manutenções ativas');
            }

            throw new Error('Erro ao excluir veículo. Tente novamente.');
        }
    }

    // 📷 Upload de foto do veículo
    static async uploadPhoto(vehicleId: string, photoFile: any): Promise<UploadPhotoResponse> {
        try {
            const formData = new FormData();
            formData.append('photo', {
                uri: photoFile.uri,
                type: photoFile.type || 'image/jpeg',
                name: photoFile.name || `vehicle_${vehicleId}_${Date.now()}.jpg`,
            } as any);

            const response = await api.upload<UploadPhotoResponse>(
                `/vehicles/${vehicleId}/photos`,
                formData
            );

            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao fazer upload da foto:', error);

            if (error.response?.status === 413) {
                throw new Error('Arquivo muito grande. Máximo 5MB.');
            } else if (error.response?.status === 415) {
                throw new Error('Formato de arquivo não suportado. Use JPG, PNG ou WEBP.');
            } else if (error.response?.status === 404) {
                throw new Error('Veículo não encontrado');
            }

            throw new Error('Erro ao enviar foto. Tente novamente.');
        }
    }

    // 🗑️ Excluir foto do veículo
    static async deletePhoto(vehicleId: string, photoId: string): Promise<void> {
        try {
            await api.delete(`/vehicles/${vehicleId}/photos/${photoId}`);
        } catch (error: any) {
            console.error('❌ Erro ao excluir foto:', error);

            if (error.response?.status === 404) {
                throw new Error('Foto não encontrada');
            } else if (error.response?.status === 403) {
                throw new Error('Sem permissão para excluir esta foto');
            }

            throw new Error('Erro ao excluir foto. Tente novamente.');
        }
    }

    // 🏷️ Definir foto principal
    static async setPrimaryPhoto(vehicleId: string, photoId: string): Promise<Vehicle> {
        try {
            const response = await api.patch<{ success: boolean; data: Vehicle }>(
                `/vehicles/${vehicleId}/photos/${photoId}/primary`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Erro ao definir foto principal:', error);

            if (error.response?.status === 404) {
                throw new Error('Foto ou veículo não encontrado');
            }

            throw new Error('Erro ao definir foto principal. Tente novamente.');
        }
    }

    // 📊 Obter estatísticas de veículos
    static async getVehicleStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byFuelType: Record<string, number>;
        byBrand: Record<string, number>;
    }> {
        try {
            const response = await api.get('/vehicles/stats');
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao obter estatísticas:', error);
            throw new Error('Erro ao carregar estatísticas de veículos');
        }
    }

    // 🔄 Ativar/Desativar veículo
    static async toggleVehicleStatus(vehicleId: string, active: boolean): Promise<Vehicle> {
        try {
            const response = await api.patch<{ success: boolean; data: Vehicle }>(
                `/vehicles/${vehicleId}/status`,
                { active }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Erro ao alterar status do veículo:', error);

            if (error.response?.status === 404) {
                throw new Error('Veículo não encontrado');
            } else if (error.response?.status === 409) {
                throw new Error('Não é possível desativar veículo com manutenções pendentes');
            }

            throw new Error('Erro ao alterar status do veículo');
        }
    }
}

export default VehicleAPI;
