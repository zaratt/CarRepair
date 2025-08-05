import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { CreateInspectionRequest, InspectionFilters, UpdateInspectionRequest } from '../api/inspection.api';
import { useInspection as useInspectionApi, useInspections as useInspectionsApi } from './useInspections';

// 🔍 Interface unificada do contexto de inspeções
interface InspectionContextData {
    // 📊 Dados
    inspections: any[];
    inspectionsCount: number;
    stats?: {
        total: number;
        scheduled: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        averageRating: number;
        passRate: number;
        criticalIssues: number;
        upcomingDue: number;
        overdueInspections: number;
    };
    types: any[];

    // 🔄 Estados de loading
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isChangingStatus: boolean;
    isRescheduling: boolean;
    isCompleting: boolean;

    // ❌ Erros
    error?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
    statusError?: string;
    rescheduleError?: string;
    completeError?: string;

    // ✅ Estados de sucesso
    createSuccess: boolean;
    updateSuccess: boolean;
    deleteSuccess: boolean;
    statusSuccess: boolean;
    rescheduleSuccess: boolean;
    completeSuccess: boolean;

    // 🎯 Ações principais
    createInspection: (inspectionData: CreateInspectionRequest) => void;
    updateInspection: (inspectionId: string, updateData: UpdateInspectionRequest) => void;
    deleteInspection: (inspectionId: string) => void;

    // 🔄 Ações de status
    changeStatus: (inspectionId: string, status: string, notes?: string) => void;
    reschedule: (inspectionId: string, newDate: string, reason?: string) => void;
    completeInspection: (inspectionId: string, completion: any) => void;

    // 🔄 Utilitários
    refetch: () => void;
    clearErrors: () => void;

    // 🔧 Sistema ativo
    isUsingRealAPI: boolean;
}

// 🔍 Interface para obter inspeção específica
interface SingleInspectionContextData {
    inspection?: any;
    isLoading: boolean;
    error?: string;
    refetch: () => void;
}

// 🎛️ Flag para controlar qual sistema usar
const USE_REAL_API = false; // 🚧 Alterar para true quando backend estiver pronto

// 🔍 Contexto principal
const InspectionContext = createContext<InspectionContextData>({} as InspectionContextData);

// 🔍 Contexto para inspeção individual
const SingleInspectionContext = createContext<SingleInspectionContextData>({} as SingleInspectionContextData);

// 🔄 Provider híbrido de inspeções
interface InspectionProviderProps {
    children: React.ReactNode;
    filters?: InspectionFilters;
}

export const InspectionProvider: React.FC<InspectionProviderProps> = ({ children, filters }) => {
    // 🎯 Hooks do sistema real (API)
    const apiHooks = useInspectionsApi(filters);

    // 🎯 Seleção do sistema ativo
    const contextValue: InspectionContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                inspections: apiHooks.inspections,
                inspectionsCount: apiHooks.inspectionsCount,
                stats: apiHooks.stats ? {
                    total: apiHooks.stats.total || 0,
                    scheduled: apiHooks.stats.scheduled || 0,
                    inProgress: apiHooks.stats.inProgress || 0,
                    completed: apiHooks.stats.completed || 0,
                    cancelled: apiHooks.stats.cancelled || 0,
                    averageRating: apiHooks.stats.averageRating || 0,
                    passRate: apiHooks.stats.passRate || 0,
                    criticalIssues: apiHooks.stats.criticalIssues || 0,
                    upcomingDue: apiHooks.stats.upcomingDue || 0,
                    overdueInspections: apiHooks.stats.overdueInspections || 0,
                } : undefined,
                types: apiHooks.types,
                isLoading: apiHooks.isLoading,
                isCreating: apiHooks.isCreating,
                isUpdating: apiHooks.isUpdating,
                isDeleting: apiHooks.isDeleting,
                isChangingStatus: apiHooks.isChangingStatus,
                isRescheduling: apiHooks.isRescheduling,
                isCompleting: apiHooks.isCompleting,
                error: apiHooks.error,
                createError: apiHooks.createError,
                updateError: apiHooks.updateError,
                deleteError: apiHooks.deleteError,
                statusError: apiHooks.statusError,
                rescheduleError: apiHooks.rescheduleError,
                completeError: apiHooks.completeError,
                createSuccess: apiHooks.createSuccess,
                updateSuccess: apiHooks.updateSuccess,
                deleteSuccess: apiHooks.deleteSuccess,
                statusSuccess: apiHooks.statusSuccess,
                rescheduleSuccess: apiHooks.rescheduleSuccess,
                completeSuccess: apiHooks.completeSuccess,
                createInspection: apiHooks.createInspection,
                updateInspection: (inspectionId: string, updateData: UpdateInspectionRequest) => {
                    apiHooks.updateInspection({ inspectionId, updateData });
                },
                deleteInspection: apiHooks.deleteInspection,
                changeStatus: (inspectionId: string, status: string, notes?: string) => {
                    apiHooks.changeStatus({ inspectionId, status, notes });
                },
                reschedule: (inspectionId: string, newDate: string, reason?: string) => {
                    apiHooks.reschedule({ inspectionId, newDate, reason });
                },
                completeInspection: (inspectionId: string, completion: any) => {
                    apiHooks.completeInspection({ inspectionId, completion });
                },
                refetch: apiHooks.refetch,
                clearErrors: apiHooks.clearErrors,
                isUsingRealAPI: true,
            };
        } else {
            // 🎯 Sistema mock simplificado
            return {
                inspections: [],
                inspectionsCount: 0,
                stats: {
                    total: 0,
                    scheduled: 0,
                    inProgress: 0,
                    completed: 0,
                    cancelled: 0,
                    averageRating: 0,
                    passRate: 0,
                    criticalIssues: 0,
                    upcomingDue: 0,
                    overdueInspections: 0,
                },
                types: [
                    { id: '1', name: 'Inspeção Anual', category: 'ANNUAL', description: 'Inspeção obrigatória anual' },
                    { id: '2', name: 'Pré-Venda', category: 'PRE_SALE', description: 'Inspeção para venda de veículo' },
                    { id: '3', name: 'Pós-Compra', category: 'POST_PURCHASE', description: 'Inspeção após compra' },
                    { id: '4', name: 'Emergência', category: 'EMERGENCY', description: 'Inspeção urgente' },
                ],
                isLoading: false,
                isCreating: false,
                isUpdating: false,
                isDeleting: false,
                isChangingStatus: false,
                isRescheduling: false,
                isCompleting: false,
                error: undefined,
                createError: undefined,
                updateError: undefined,
                deleteError: undefined,
                statusError: undefined,
                rescheduleError: undefined,
                completeError: undefined,
                createSuccess: false,
                updateSuccess: false,
                deleteSuccess: false,
                statusSuccess: false,
                rescheduleSuccess: false,
                completeSuccess: false,
                createInspection: (inspectionData: CreateInspectionRequest) => {
                    console.log('🔍 Criar inspeção (mock):', inspectionData);
                },
                updateInspection: (inspectionId: string, updateData: UpdateInspectionRequest) => {
                    console.log('✏️ Atualizar inspeção (mock):', inspectionId, updateData);
                },
                deleteInspection: (inspectionId: string) => {
                    console.log('🗑️ Excluir inspeção (mock):', inspectionId);
                },
                changeStatus: (inspectionId: string, status: string, notes?: string) => {
                    console.log('🔄 Alterar status (mock):', inspectionId, status, notes);
                },
                reschedule: (inspectionId: string, newDate: string, reason?: string) => {
                    console.log('📅 Reagendar (mock):', inspectionId, newDate, reason);
                },
                completeInspection: (inspectionId: string, completion: any) => {
                    console.log('🏁 Finalizar inspeção (mock):', inspectionId, completion);
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
        console.log(`🔍 Sistema de inspeções ativo: ${USE_REAL_API ? 'API Real' : 'Mock'}`);
    }, []);

    return (
        <InspectionContext.Provider value={contextValue}>
            {children}
        </InspectionContext.Provider>
    );
};

// 🔄 Provider para inspeção individual
interface SingleInspectionProviderProps {
    children: React.ReactNode;
    inspectionId: string;
}

export const SingleInspectionProvider: React.FC<SingleInspectionProviderProps> = ({ children, inspectionId }) => {
    // 🎯 Hooks do sistema real
    const apiHook = useInspectionApi(inspectionId);

    // 🎯 Seleção do sistema ativo
    const contextValue: SingleInspectionContextData = useMemo(() => {
        if (USE_REAL_API) {
            return {
                inspection: apiHook.inspection,
                isLoading: apiHook.isLoading,
                error: apiHook.error,
                refetch: apiHook.refetch,
            };
        } else {
            return {
                inspection: undefined,
                isLoading: false,
                error: undefined,
                refetch: () => {
                    console.log('🔄 Refetch inspection (mock):', inspectionId);
                },
            };
        }
    }, [USE_REAL_API, apiHook, inspectionId]);

    return (
        <SingleInspectionContext.Provider value={contextValue}>
            {children}
        </SingleInspectionContext.Provider>
    );
};

// 🪝 Hook para usar o contexto de inspeções
export const useInspectionContext = (): InspectionContextData => {
    const context = useContext(InspectionContext);
    if (!context) {
        throw new Error('useInspectionContext deve ser usado dentro de InspectionProvider');
    }
    return context;
};

// 🪝 Hook para usar o contexto de inspeção individual
export const useSingleInspectionContext = (): SingleInspectionContextData => {
    const context = useContext(SingleInspectionContext);
    if (!context) {
        throw new Error('useSingleInspectionContext deve ser usado dentro de SingleInspectionProvider');
    }
    return context;
};

export default InspectionContext;
