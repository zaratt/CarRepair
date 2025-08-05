import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { CreateVehicleRequest, UpdateVehicleRequest, VehicleFilters } from '../api/vehicle.api';
import { Vehicle } from '../types';
import { useVehicle as useVehicleApi, useVehicles as useVehiclesApi } from './useVehicles';

// 🏗️ Interface unificada do contexto de veículos
interface VehicleContextData {
    // 📊 Dados
    vehicles: Vehicle[];
    vehiclesCount: number;
    stats?: {
        totalVehicles: number;
        activeVehicles: number;
        inactiveVehicles: number;
        averageYear: number;
        mostCommonBrand: string;
    };

    // 🔄 Estados de loading
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isUploadingPhoto: boolean;

    // ❌ Erros
    error?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;

    // ✅ Estados de sucesso
    createSuccess: boolean;
    updateSuccess: boolean;
    deleteSuccess: boolean;

    // 🎯 Ações principais
    createVehicle: (vehicleData: CreateVehicleRequest) => void;
    updateVehicle: (vehicleId: string, updateData: UpdateVehicleRequest) => void;
    deleteVehicle: (vehicleId: string) => void;

    // 📷 Ações de foto
    uploadPhoto: (vehicleId: string, photoFile: any) => void;
    deletePhoto: (vehicleId: string, photoId: string) => void;
    setPrimaryPhoto: (vehicleId: string, photoId: string) => void;

    // 🔄 Utilitários
    refetch: () => void;
    clearErrors: () => void;
    toggleStatus: (vehicleId: string, active: boolean) => void;

    // 🔧 Sistema ativo
    isUsingRealAPI: boolean;
}

// 🏗️ Interface para obter veículo específico
interface SingleVehicleContextData {
    vehicle?: Vehicle;
    isLoading: boolean;
    error?: string;
    refetch: () => void;
}

// 🎛️ Flag para controlar qual sistema usar
const USE_REAL_API = false; // 🚧 Alterar para true quando backend estiver pronto

// 🏗️ Contexto principal
const VehicleContext = createContext<VehicleContextData>({} as VehicleContextData);

// 🏗️ Contexto para veículo individual
const SingleVehicleContext = createContext<SingleVehicleContextData>({} as SingleVehicleContextData);

// 🔄 Provider híbrido de veículos
interface VehicleProviderProps {
    children: React.ReactNode;
    filters?: VehicleFilters;
}

export const VehicleProvider: React.FC<VehicleProviderProps> = ({ children, filters }) => {
    // 🎯 Hooks do sistema real (API)
    const apiHooks = useVehiclesApi(filters);

    // 🎯 Seleção do sistema ativo - usando sempre a API por enquanto
    const contextValue: VehicleContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                vehicles: apiHooks.vehicles,
                vehiclesCount: apiHooks.vehiclesCount,
                stats: apiHooks.stats ? {
                    totalVehicles: apiHooks.stats.total || 0,
                    activeVehicles: apiHooks.stats.active || 0,
                    inactiveVehicles: apiHooks.stats.inactive || 0,
                    averageYear: 2020, // Default value
                    mostCommonBrand: Object.keys(apiHooks.stats.byBrand || {})[0] || 'N/A',
                } : undefined,
                isLoading: apiHooks.isLoading,
                isCreating: apiHooks.isCreating,
                isUpdating: apiHooks.isUpdating,
                isDeleting: apiHooks.isDeleting,
                isUploadingPhoto: apiHooks.isUploadingPhoto,
                error: apiHooks.error,
                createError: apiHooks.createError,
                updateError: apiHooks.updateError,
                deleteError: apiHooks.deleteError,
                createSuccess: apiHooks.createSuccess,
                updateSuccess: apiHooks.updateSuccess,
                deleteSuccess: apiHooks.deleteSuccess,
                createVehicle: apiHooks.createVehicle,
                updateVehicle: (vehicleId: string, updateData: UpdateVehicleRequest) => {
                    apiHooks.updateVehicle({ vehicleId, updateData });
                },
                deleteVehicle: apiHooks.deleteVehicle,
                uploadPhoto: (vehicleId: string, photoFile: any) => {
                    apiHooks.uploadPhoto({ vehicleId, photoFile });
                },
                deletePhoto: (vehicleId: string, photoId: string) => {
                    apiHooks.deletePhoto({ vehicleId, photoId });
                },
                setPrimaryPhoto: (vehicleId: string, photoId: string) => {
                    apiHooks.setPrimaryPhoto({ vehicleId, photoId });
                },
                refetch: apiHooks.refetch,
                clearErrors: apiHooks.clearErrors,
                toggleStatus: (vehicleId: string, active: boolean) => {
                    apiHooks.toggleStatus({ vehicleId, active });
                },
                isUsingRealAPI: true,
            };
        } else {
            // 🎯 Sistema mock simplificado
            return {
                vehicles: [],
                vehiclesCount: 0,
                stats: {
                    totalVehicles: 0,
                    activeVehicles: 0,
                    inactiveVehicles: 0,
                    averageYear: 2020,
                    mostCommonBrand: 'N/A',
                },
                isLoading: false,
                isCreating: false,
                isUpdating: false,
                isDeleting: false,
                isUploadingPhoto: false,
                error: undefined,
                createError: undefined,
                updateError: undefined,
                deleteError: undefined,
                createSuccess: false,
                updateSuccess: false,
                deleteSuccess: false,
                createVehicle: (vehicleData: CreateVehicleRequest) => {
                    console.log('📝 Criar veículo (mock):', vehicleData);
                },
                updateVehicle: (vehicleId: string, updateData: UpdateVehicleRequest) => {
                    console.log('✏️ Atualizar veículo (mock):', vehicleId, updateData);
                },
                deleteVehicle: (vehicleId: string) => {
                    console.log('🗑️ Excluir veículo (mock):', vehicleId);
                },
                uploadPhoto: (vehicleId: string, photoFile: any) => {
                    console.log('📷 Upload de foto (mock):', vehicleId, photoFile);
                },
                deletePhoto: (vehicleId: string, photoId: string) => {
                    console.log('🗑️ Exclusão de foto (mock):', vehicleId, photoId);
                },
                setPrimaryPhoto: (vehicleId: string, photoId: string) => {
                    console.log('🏷️ Definir foto principal (mock):', vehicleId, photoId);
                },
                refetch: () => {
                    console.log('🔄 Refetch (mock)');
                },
                clearErrors: () => {
                    console.log('🧹 Clear errors (mock)');
                },
                toggleStatus: (vehicleId: string, active: boolean) => {
                    console.log('🔄 Toggle status (mock):', vehicleId, active);
                },
                isUsingRealAPI: false,
            };
        }
    }, [USE_REAL_API, apiHooks]);

    // 📊 Log do sistema ativo
    useEffect(() => {
        console.log(`🔧 Sistema de veículos ativo: ${USE_REAL_API ? 'API Real' : 'Mock'}`);
    }, []);

    return (
        <VehicleContext.Provider value={contextValue}>
            {children}
        </VehicleContext.Provider>
    );
};

// 🔄 Provider para veículo individual
interface SingleVehicleProviderProps {
    children: React.ReactNode;
    vehicleId: string;
}

export const SingleVehicleProvider: React.FC<SingleVehicleProviderProps> = ({ children, vehicleId }) => {
    // 🎯 Hooks do sistema real
    const apiHook = useVehicleApi(vehicleId);

    // 🎯 Seleção do sistema ativo
    const contextValue: SingleVehicleContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                vehicle: apiHook.vehicle,
                isLoading: apiHook.isLoading,
                error: apiHook.error,
                refetch: apiHook.refetch,
            };
        } else {
            return {
                vehicle: undefined,
                isLoading: false,
                error: undefined,
                refetch: () => {
                    console.log('🔄 Refetch vehicle (mock):', vehicleId);
                },
            };
        }
    }, [USE_REAL_API, apiHook, vehicleId]);

    return (
        <SingleVehicleContext.Provider value={contextValue}>
            {children}
        </SingleVehicleContext.Provider>
    );
};

// 🪝 Hook para usar o contexto de veículos
export const useVehicleContext = (): VehicleContextData => {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error('useVehicleContext deve ser usado dentro de VehicleProvider');
    }
    return context;
};

// 🪝 Hook para usar o contexto de veículo individual
export const useSingleVehicleContext = (): SingleVehicleContextData => {
    const context = useContext(SingleVehicleContext);
    if (!context) {
        throw new Error('useSingleVehicleContext deve ser usado dentro de SingleVehicleProvider');
    }
    return context;
};

export default VehicleContext;
