import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { CreateMaintenanceRequest, MaintenanceFilters, UpdateMaintenanceRequest } from '../api/maintenance.api';
import { useMaintenance as useMaintenanceApi, useMaintenances as useMaintenancesApi } from './useMaintenances';

// 🏗️ Interface unificada do contexto de manutenções
interface MaintenanceContextData {
    // 📊 Dados
    maintenances: any[];
    maintenancesCount: number;
    stats?: {
        total: number;
        scheduled: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        totalCost: number;
        averageCost: number;
        onTimeCompletion: number;
    };
    types: any[];

    // 🔄 Estados de loading
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isUploadingDocument: boolean;

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
    createMaintenance: (maintenanceData: CreateMaintenanceRequest) => void;
    updateMaintenance: (maintenanceId: string, updateData: UpdateMaintenanceRequest) => void;
    deleteMaintenance: (maintenanceId: string) => void;

    // 📄 Ações de documento
    uploadDocument: (maintenanceId: string, file: any) => void;
    deleteDocument: (maintenanceId: string, documentId: string) => void;

    // 🔄 Ações de status
    changeStatus: (maintenanceId: string, status: string) => void;
    reschedule: (maintenanceId: string, newDate: string, reason?: string) => void;

    // 🔄 Utilitários
    refetch: () => void;
    clearErrors: () => void;

    // 🔧 Sistema ativo
    isUsingRealAPI: boolean;
}

// 🏗️ Interface para obter manutenção específica
interface SingleMaintenanceContextData {
    maintenance?: any;
    isLoading: boolean;
    error?: string;
    refetch: () => void;
}

// 🎛️ Flag para controlar qual sistema usar
const USE_REAL_API = true; // ✅ Backend configurado com Prisma Accelerate

// 🏗️ Contexto principal
const MaintenanceContext = createContext<MaintenanceContextData>({} as MaintenanceContextData);

// 🏗️ Contexto para manutenção individual
const SingleMaintenanceContext = createContext<SingleMaintenanceContextData>({} as SingleMaintenanceContextData);

// 🔄 Provider híbrido de manutenções
interface MaintenanceProviderProps {
    children: React.ReactNode;
    filters?: MaintenanceFilters;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children, filters }) => {
    // 🎯 Hooks do sistema real (API)
    const apiHooks = useMaintenancesApi(filters);

    // 🎯 Seleção do sistema ativo
    const contextValue: MaintenanceContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                maintenances: apiHooks.maintenances,
                maintenancesCount: apiHooks.maintenancesCount,
                stats: apiHooks.stats ? {
                    total: apiHooks.stats.total || 0,
                    scheduled: apiHooks.stats.scheduled || 0,
                    inProgress: apiHooks.stats.inProgress || 0,
                    completed: apiHooks.stats.completed || 0,
                    cancelled: apiHooks.stats.cancelled || 0,
                    totalCost: apiHooks.stats.totalCost || 0,
                    averageCost: apiHooks.stats.averageCost || 0,
                    onTimeCompletion: apiHooks.stats.onTimeCompletion || 0,
                } : undefined,
                types: apiHooks.types,
                isLoading: apiHooks.isLoading,
                isCreating: apiHooks.isCreating,
                isUpdating: apiHooks.isUpdating,
                isDeleting: apiHooks.isDeleting,
                isUploadingDocument: apiHooks.isUploadingDocument,
                error: apiHooks.error,
                createError: apiHooks.createError,
                updateError: apiHooks.updateError,
                deleteError: apiHooks.deleteError,
                createSuccess: apiHooks.createSuccess,
                updateSuccess: apiHooks.updateSuccess,
                deleteSuccess: apiHooks.deleteSuccess,
                createMaintenance: apiHooks.createMaintenance,
                updateMaintenance: (maintenanceId: string, updateData: UpdateMaintenanceRequest) => {
                    apiHooks.updateMaintenance({ maintenanceId, updateData });
                },
                deleteMaintenance: apiHooks.deleteMaintenance,
                uploadDocument: (maintenanceId: string, file: any) => {
                    apiHooks.uploadDocument({ maintenanceId, file });
                },
                deleteDocument: (maintenanceId: string, documentId: string) => {
                    apiHooks.deleteDocument({ maintenanceId, documentId });
                },
                changeStatus: (maintenanceId: string, status: string) => {
                    apiHooks.changeStatus({ maintenanceId, status });
                },
                reschedule: (maintenanceId: string, newDate: string, reason?: string) => {
                    apiHooks.reschedule({ maintenanceId, newDate, reason });
                },
                refetch: apiHooks.refetch,
                clearErrors: apiHooks.clearErrors,
                isUsingRealAPI: true,
            };
        } else {
            // 🎯 Sistema mock simplificado
            return {
                maintenances: [],
                maintenancesCount: 0,
                stats: {
                    total: 0,
                    scheduled: 0,
                    inProgress: 0,
                    completed: 0,
                    cancelled: 0,
                    totalCost: 0,
                    averageCost: 0,
                    onTimeCompletion: 0,
                },
                types: [
                    { id: '1', name: 'Troca de Óleo', category: 'PREVENTIVE' },
                    { id: '2', name: 'Revisão Geral', category: 'PREVENTIVE' },
                    { id: '3', name: 'Reparo de Freios', category: 'CORRECTIVE' },
                ],
                isLoading: false,
                isCreating: false,
                isUpdating: false,
                isDeleting: false,
                isUploadingDocument: false,
                error: undefined,
                createError: undefined,
                updateError: undefined,
                deleteError: undefined,
                createSuccess: false,
                updateSuccess: false,
                deleteSuccess: false,
                createMaintenance: (maintenanceData: CreateMaintenanceRequest) => {
                    console.log('📝 Criar manutenção (mock):', maintenanceData);
                },
                updateMaintenance: (maintenanceId: string, updateData: UpdateMaintenanceRequest) => {
                    console.log('✏️ Atualizar manutenção (mock):', maintenanceId, updateData);
                },
                deleteMaintenance: (maintenanceId: string) => {
                    console.log('🗑️ Excluir manutenção (mock):', maintenanceId);
                },
                uploadDocument: (maintenanceId: string, file: any) => {
                    console.log('📄 Upload documento (mock):', maintenanceId, file);
                },
                deleteDocument: (maintenanceId: string, documentId: string) => {
                    console.log('🗑️ Excluir documento (mock):', maintenanceId, documentId);
                },
                changeStatus: (maintenanceId: string, status: string) => {
                    console.log('🔄 Alterar status (mock):', maintenanceId, status);
                },
                reschedule: (maintenanceId: string, newDate: string, reason?: string) => {
                    console.log('📅 Reagendar (mock):', maintenanceId, newDate, reason);
                },
                refetch: () => {
                    console.log('🔄 Refetch (mock)');
                },
                clearErrors: () => {
                    console.log('🧹 Clear errors (mock)');
                },
                isUsingRealAPI: false,
            };
        }
    }, [USE_REAL_API, apiHooks]);

    // 📊 Log do sistema ativo
    useEffect(() => {
        console.log(`🔧 Sistema de manutenções ativo: ${USE_REAL_API ? 'API Real' : 'Mock'}`);
    }, []);

    return (
        <MaintenanceContext.Provider value={contextValue}>
            {children}
        </MaintenanceContext.Provider>
    );
};

// 🔄 Provider para manutenção individual
interface SingleMaintenanceProviderProps {
    children: React.ReactNode;
    maintenanceId: string;
}

export const SingleMaintenanceProvider: React.FC<SingleMaintenanceProviderProps> = ({ children, maintenanceId }) => {
    // 🎯 Hooks do sistema real
    const apiHook = useMaintenanceApi(maintenanceId);

    // 🎯 Seleção do sistema ativo
    const contextValue: SingleMaintenanceContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                maintenance: apiHook.maintenance,
                isLoading: apiHook.isLoading,
                error: apiHook.error,
                refetch: apiHook.refetch,
            };
        } else {
            return {
                maintenance: undefined,
                isLoading: false,
                error: undefined,
                refetch: () => {
                    console.log('🔄 Refetch maintenance (mock):', maintenanceId);
                },
            };
        }
    }, [USE_REAL_API, apiHook, maintenanceId]);

    return (
        <SingleMaintenanceContext.Provider value={contextValue}>
            {children}
        </SingleMaintenanceContext.Provider>
    );
};

// 🪝 Hook para usar o contexto de manutenções
export const useMaintenanceContext = (): MaintenanceContextData => {
    const context = useContext(MaintenanceContext);
    if (!context) {
        throw new Error('useMaintenanceContext deve ser usado dentro de MaintenanceProvider');
    }
    return context;
};

// 🪝 Hook para usar o contexto de manutenção individual
export const useSingleMaintenanceContext = (): SingleMaintenanceContextData => {
    const context = useContext(SingleMaintenanceContext);
    if (!context) {
        throw new Error('useSingleMaintenanceContext deve ser usado dentro de SingleMaintenanceProvider');
    }
    return context;
};

export default MaintenanceContext;
