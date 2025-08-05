import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CreateMaintenanceRequest,
    MaintenanceAPI,
    MaintenanceFilters,
    UpdateMaintenanceRequest
} from '../api/maintenance.api';
import { queryKeys, reactQueryUtils } from '../api/queryClient';

// 🔧 Hook para gerenciar manutenções com React Query
export const useMaintenances = (filters?: MaintenanceFilters) => {
    const queryClient = useQueryClient();

    // 📋 Query para listar manutenções
    const maintenancesQuery = useQuery({
        queryKey: queryKeys.maintenances.list(JSON.stringify(filters || {})),
        queryFn: () => MaintenanceAPI.getMaintenances(filters),
        staleTime: 2 * 60 * 1000, // 2 minutos
        enabled: true,
    });

    // 📊 Query para estatísticas
    const statsQuery = useQuery({
        queryKey: ['maintenances', 'stats'],
        queryFn: () => MaintenanceAPI.getMaintenanceStats(),
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    // 📋 Query para tipos de manutenção
    const typesQuery = useQuery({
        queryKey: ['maintenance-types'],
        queryFn: MaintenanceAPI.getMaintenanceTypes,
        staleTime: 30 * 60 * 1000, // 30 minutos (dados estáticos)
    });

    // ➕ Mutation para criar manutenção
    const createMutation = useMutation({
        mutationFn: (maintenanceData: CreateMaintenanceRequest) => MaintenanceAPI.createMaintenance(maintenanceData),
        onSuccess: (newMaintenance) => {
            // Invalidar lista de manutenções
            reactQueryUtils.invalidateMaintenances();

            // Atualizar cache da lista atual se possível
            queryClient.setQueryData(
                queryKeys.maintenances.list(JSON.stringify(filters || {})),
                (oldData: any) => {
                    if (oldData) {
                        return {
                            ...oldData,
                            maintenances: [newMaintenance, ...oldData.maintenances],
                            total: oldData.total + 1
                        };
                    }
                    return oldData;
                }
            );

            console.log('✅ Manutenção criada com sucesso:', newMaintenance.id);
        },
        onError: (error) => {
            console.error('❌ Erro ao criar manutenção:', error);
        },
    });

    // ✏️ Mutation para atualizar manutenção
    const updateMutation = useMutation({
        mutationFn: ({ maintenanceId, updateData }: { maintenanceId: string; updateData: UpdateMaintenanceRequest }) =>
            MaintenanceAPI.updateMaintenance(maintenanceId, updateData),
        onSuccess: (updatedMaintenance) => {
            // Invalidar queries relacionadas
            reactQueryUtils.invalidateMaintenances();

            // Atualizar cache específico da manutenção
            queryClient.setQueryData(
                queryKeys.maintenances.detail(updatedMaintenance.id),
                updatedMaintenance
            );

            console.log('✅ Manutenção atualizada com sucesso:', updatedMaintenance.id);
        },
        onError: (error) => {
            console.error('❌ Erro ao atualizar manutenção:', error);
        },
    });

    // 🗑️ Mutation para excluir manutenção
    const deleteMutation = useMutation({
        mutationFn: (maintenanceId: string) => MaintenanceAPI.deleteMaintenance(maintenanceId),
        onSuccess: (_, maintenanceId) => {
            // Invalidar lista de manutenções
            reactQueryUtils.invalidateMaintenances();

            // Remover do cache
            queryClient.removeQueries({ queryKey: queryKeys.maintenances.detail(maintenanceId) });

            console.log('✅ Manutenção excluída com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao excluir manutenção:', error);
        },
    });

    // 📄 Mutation para upload de documento
    const uploadDocumentMutation = useMutation({
        mutationFn: ({ maintenanceId, file }: { maintenanceId: string; file: any }) =>
            MaintenanceAPI.uploadDocument(maintenanceId, file),
        onSuccess: (response, { maintenanceId }) => {
            // Invalidar dados da manutenção específica
            queryClient.invalidateQueries({ queryKey: queryKeys.maintenances.detail(maintenanceId) });

            // Invalidar lista também
            reactQueryUtils.invalidateMaintenances();

            console.log('✅ Documento enviado com sucesso:', response.document.filename);
        },
        onError: (error) => {
            console.error('❌ Erro ao enviar documento:', error);
        },
    });

    // 🗑️ Mutation para excluir documento
    const deleteDocumentMutation = useMutation({
        mutationFn: ({ maintenanceId, documentId }: { maintenanceId: string; documentId: string }) =>
            MaintenanceAPI.deleteDocument(maintenanceId, documentId),
        onSuccess: (_, { maintenanceId }) => {
            // Invalidar dados da manutenção
            queryClient.invalidateQueries({ queryKey: queryKeys.maintenances.detail(maintenanceId) });
            reactQueryUtils.invalidateMaintenances();

            console.log('✅ Documento excluído com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao excluir documento:', error);
        },
    });

    // 🔄 Mutation para alterar status
    const changeStatusMutation = useMutation({
        mutationFn: ({ maintenanceId, status }: { maintenanceId: string; status: string }) =>
            MaintenanceAPI.changeStatus(maintenanceId, status as any),
        onSuccess: (updatedMaintenance) => {
            // Atualizar cache da manutenção
            queryClient.setQueryData(
                queryKeys.maintenances.detail(updatedMaintenance.id),
                updatedMaintenance
            );

            // Invalidar lista para atualizar filtros por status
            reactQueryUtils.invalidateMaintenances();

            console.log('✅ Status alterado com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao alterar status:', error);
        },
    });

    // 📅 Mutation para reagendar
    const rescheduleMutation = useMutation({
        mutationFn: ({ maintenanceId, newDate, reason }: { maintenanceId: string; newDate: string; reason?: string }) =>
            MaintenanceAPI.reschedule(maintenanceId, newDate, reason),
        onSuccess: (updatedMaintenance) => {
            // Atualizar caches
            queryClient.setQueryData(
                queryKeys.maintenances.detail(updatedMaintenance.id),
                updatedMaintenance
            );
            reactQueryUtils.invalidateMaintenances();

            console.log('✅ Manutenção reagendada com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao reagendar manutenção:', error);
        },
    });

    return {
        // 📊 Dados
        maintenances: maintenancesQuery.data?.maintenances || [],
        maintenancesCount: maintenancesQuery.data?.total || 0,
        stats: statsQuery.data,
        types: typesQuery.data || [],

        // 🔄 Estados de loading
        isLoading: maintenancesQuery.isLoading,
        isStatsLoading: statsQuery.isLoading,
        isTypesLoading: typesQuery.isLoading,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isUploadingDocument: uploadDocumentMutation.isPending,
        isDeletingDocument: deleteDocumentMutation.isPending,
        isChangingStatus: changeStatusMutation.isPending,
        isRescheduling: rescheduleMutation.isPending,

        // ❌ Erros
        error: maintenancesQuery.error?.message,
        statsError: statsQuery.error?.message,
        typesError: typesQuery.error?.message,
        createError: createMutation.error?.message,
        updateError: updateMutation.error?.message,
        deleteError: deleteMutation.error?.message,
        uploadDocumentError: uploadDocumentMutation.error?.message,
        deleteDocumentError: deleteDocumentMutation.error?.message,

        // ✅ Sucessos
        createSuccess: createMutation.isSuccess,
        updateSuccess: updateMutation.isSuccess,
        deleteSuccess: deleteMutation.isSuccess,
        uploadDocumentSuccess: uploadDocumentMutation.isSuccess,

        // 🎯 Ações
        createMaintenance: createMutation.mutate,
        updateMaintenance: updateMutation.mutate,
        deleteMaintenance: deleteMutation.mutate,
        uploadDocument: uploadDocumentMutation.mutate,
        deleteDocument: deleteDocumentMutation.mutate,
        changeStatus: changeStatusMutation.mutate,
        reschedule: rescheduleMutation.mutate,

        // 🔄 Utilitários
        refetch: maintenancesQuery.refetch,
        refetchStats: statsQuery.refetch,
        refetchTypes: typesQuery.refetch,

        // 🧹 Reset de erros
        clearErrors: () => {
            createMutation.reset();
            updateMutation.reset();
            deleteMutation.reset();
            uploadDocumentMutation.reset();
            deleteDocumentMutation.reset();
            changeStatusMutation.reset();
            rescheduleMutation.reset();
        },
    };
};

// 🔍 Hook para obter uma manutenção específica
export const useMaintenance = (maintenanceId: string) => {
    const maintenanceQuery = useQuery({
        queryKey: queryKeys.maintenances.detail(maintenanceId),
        queryFn: () => MaintenanceAPI.getMaintenanceById(maintenanceId),
        enabled: !!maintenanceId,
        staleTime: 2 * 60 * 1000, // 2 minutos
    });

    return {
        maintenance: maintenanceQuery.data,
        isLoading: maintenanceQuery.isLoading,
        error: maintenanceQuery.error?.message,
        refetch: maintenanceQuery.refetch,
    };
};

// 🔔 Hook para manutenções vencendo
export const useUpcomingMaintenances = (days: number = 30) => {
    const upcomingQuery = useQuery({
        queryKey: ['maintenances', 'upcoming', days],
        queryFn: () => MaintenanceAPI.getUpcomingMaintenances(days),
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    return {
        upcomingMaintenances: upcomingQuery.data || [],
        isLoading: upcomingQuery.isLoading,
        error: upcomingQuery.error?.message,
        refetch: upcomingQuery.refetch,
    };
};

export default useMaintenances;
