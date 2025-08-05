import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import inspectionAPI, {
    CreateInspectionRequest,
    InspectionFilters,
    InspectionResult,
    UpdateInspectionRequest
} from '../api/inspection.api';

// 🔑 Query Keys
export const inspectionKeys = {
    all: ['inspections'] as const,
    lists: () => [...inspectionKeys.all, 'list'] as const,
    list: (filters?: InspectionFilters) => [...inspectionKeys.lists(), filters] as const,
    details: () => [...inspectionKeys.all, 'detail'] as const,
    detail: (id: string) => [...inspectionKeys.details(), id] as const,
    stats: (filters?: any) => [...inspectionKeys.all, 'stats', filters] as const,
    types: () => [...inspectionKeys.all, 'types'] as const,
    items: (typeId: string) => [...inspectionKeys.all, 'items', typeId] as const,
    history: (vehicleId: string) => [...inspectionKeys.all, 'history', vehicleId] as const,
    upcoming: (days?: number) => [...inspectionKeys.all, 'upcoming', days] as const,
    overdue: () => [...inspectionKeys.all, 'overdue'] as const,
};

// 🪝 Hook principal para listar inspeções
export const useInspections = (filters?: InspectionFilters) => {
    const queryClient = useQueryClient();

    // 📋 Query para listar inspeções
    const {
        data: inspectionsResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: inspectionKeys.list(filters),
        queryFn: () => inspectionAPI.getInspections(filters),
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    // 📊 Query para estatísticas
    const {
        data: stats,
        isLoading: isLoadingStats,
    } = useQuery({
        queryKey: inspectionKeys.stats(filters),
        queryFn: () => inspectionAPI.getInspectionStats(filters),
        staleTime: 5 * 60 * 1000,
    });

    // 📋 Query para tipos de inspeção
    const {
        data: types,
        isLoading: isLoadingTypes,
    } = useQuery({
        queryKey: inspectionKeys.types(),
        queryFn: () => inspectionAPI.getInspectionTypes(),
        staleTime: 30 * 60 * 1000, // 30 minutos (dados mais estáveis)
    });

    // ➕ Mutation para criar inspeção
    const createMutation = useMutation({
        mutationFn: (inspectionData: CreateInspectionRequest) =>
            inspectionAPI.createInspection(inspectionData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
        },
    });

    // ✏️ Mutation para atualizar inspeção
    const updateMutation = useMutation({
        mutationFn: ({ inspectionId, updateData }: {
            inspectionId: string;
            updateData: UpdateInspectionRequest
        }) => inspectionAPI.updateInspection(inspectionId, updateData),
        onSuccess: (_, { inspectionId }) => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
        },
    });

    // 🗑️ Mutation para excluir inspeção
    const deleteMutation = useMutation({
        mutationFn: (inspectionId: string) =>
            inspectionAPI.deleteInspection(inspectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
        },
    });

    // 🔄 Mutation para alterar status
    const changeStatusMutation = useMutation({
        mutationFn: ({ inspectionId, status, notes }: {
            inspectionId: string;
            status: string;
            notes?: string
        }) => inspectionAPI.changeStatus(inspectionId, status, notes),
        onSuccess: (_, { inspectionId }) => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
        },
    });

    // 📅 Mutation para reagendar
    const rescheduleMutation = useMutation({
        mutationFn: ({ inspectionId, newDate, reason }: {
            inspectionId: string;
            newDate: string;
            reason?: string
        }) => inspectionAPI.reschedule(inspectionId, newDate, reason),
        onSuccess: (_, { inspectionId }) => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
        },
    });

    // 🏁 Mutation para finalizar inspeção
    const completeMutation = useMutation({
        mutationFn: ({ inspectionId, completion }: {
            inspectionId: string;
            completion: any
        }) => inspectionAPI.completeInspection(inspectionId, completion),
        onSuccess: (_, { inspectionId }) => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
            queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
        },
    });

    // 🧹 Função para limpar erros
    const clearErrors = () => {
        createMutation.reset();
        updateMutation.reset();
        deleteMutation.reset();
        changeStatusMutation.reset();
        rescheduleMutation.reset();
        completeMutation.reset();
    };

    return {
        // 📊 Dados
        inspections: inspectionsResponse?.data || [],
        inspectionsCount: inspectionsResponse?.total || 0,
        stats,
        types: types || [],

        // 🔄 Estados de loading
        isLoading: isLoading || isLoadingStats || isLoadingTypes,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isChangingStatus: changeStatusMutation.isPending,
        isRescheduling: rescheduleMutation.isPending,
        isCompleting: completeMutation.isPending,

        // ❌ Erros
        error: error?.message,
        createError: createMutation.error?.message,
        updateError: updateMutation.error?.message,
        deleteError: deleteMutation.error?.message,
        statusError: changeStatusMutation.error?.message,
        rescheduleError: rescheduleMutation.error?.message,
        completeError: completeMutation.error?.message,

        // ✅ Estados de sucesso
        createSuccess: createMutation.isSuccess,
        updateSuccess: updateMutation.isSuccess,
        deleteSuccess: deleteMutation.isSuccess,
        statusSuccess: changeStatusMutation.isSuccess,
        rescheduleSuccess: rescheduleMutation.isSuccess,
        completeSuccess: completeMutation.isSuccess,

        // 🎯 Ações
        createInspection: createMutation.mutate,
        updateInspection: updateMutation.mutate,
        deleteInspection: deleteMutation.mutate,
        changeStatus: changeStatusMutation.mutate,
        reschedule: rescheduleMutation.mutate,
        completeInspection: completeMutation.mutate,
        refetch,
        clearErrors,
    };
};

// 🪝 Hook para inspeção específica
export const useInspection = (inspectionId: string) => {
    const queryClient = useQueryClient();

    const {
        data: inspection,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: inspectionKeys.detail(inspectionId),
        queryFn: () => inspectionAPI.getInspection(inspectionId),
        enabled: !!inspectionId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        inspection,
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para itens de inspeção por tipo
export const useInspectionItems = (typeId: string) => {
    const {
        data: items,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: inspectionKeys.items(typeId),
        queryFn: () => inspectionAPI.getInspectionItems(typeId),
        enabled: !!typeId,
        staleTime: 30 * 60 * 1000,
    });

    return {
        items: items || [],
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para histórico de inspeções do veículo
export const useVehicleInspectionHistory = (vehicleId: string, limit?: number) => {
    const {
        data: history,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: inspectionKeys.history(vehicleId),
        queryFn: () => inspectionAPI.getVehicleInspectionHistory(vehicleId, limit),
        enabled: !!vehicleId,
        staleTime: 10 * 60 * 1000,
    });

    return {
        history: history || [],
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para inspeções próximas do vencimento
export const useUpcomingInspections = (days: number = 30) => {
    const {
        data: upcoming,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: inspectionKeys.upcoming(days),
        queryFn: () => inspectionAPI.getUpcomingInspections(days),
        staleTime: 15 * 60 * 1000,
    });

    return {
        upcoming: upcoming || [],
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para inspeções vencidas
export const useOverdueInspections = () => {
    const {
        data: overdue,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: inspectionKeys.overdue(),
        queryFn: () => inspectionAPI.getOverdueInspections(),
        staleTime: 10 * 60 * 1000,
    });

    return {
        overdue: overdue || [],
        isLoading,
        error: error?.message,
        refetch,
    };
};

// 🪝 Hook para resultados de inspeção
export const useInspectionResults = (inspectionId: string) => {
    const queryClient = useQueryClient();

    // ✅ Mutation para adicionar resultado
    const addResultMutation = useMutation({
        mutationFn: (result: InspectionResult) =>
            inspectionAPI.addInspectionResult(inspectionId, result),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
        },
    });

    // ✏️ Mutation para atualizar resultado
    const updateResultMutation = useMutation({
        mutationFn: ({ resultId, result }: {
            resultId: string;
            result: Partial<InspectionResult>
        }) => inspectionAPI.updateInspectionResult(inspectionId, resultId, result),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
        },
    });

    // 🗑️ Mutation para remover resultado
    const deleteResultMutation = useMutation({
        mutationFn: (resultId: string) =>
            inspectionAPI.deleteInspectionResult(inspectionId, resultId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
        },
    });

    // 📸 Mutation para upload de foto
    const uploadPhotoMutation = useMutation({
        mutationFn: ({ resultId, file }: { resultId: string; file: any }) =>
            inspectionAPI.uploadInspectionPhoto(inspectionId, resultId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
        },
    });

    // 🗑️ Mutation para remover foto
    const deletePhotoMutation = useMutation({
        mutationFn: (resultId: string) =>
            inspectionAPI.deleteInspectionPhoto(inspectionId, resultId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(inspectionId) });
        },
    });

    return {
        // 🔄 Estados de loading
        isAddingResult: addResultMutation.isPending,
        isUpdatingResult: updateResultMutation.isPending,
        isDeletingResult: deleteResultMutation.isPending,
        isUploadingPhoto: uploadPhotoMutation.isPending,
        isDeletingPhoto: deletePhotoMutation.isPending,

        // ❌ Erros
        addResultError: addResultMutation.error?.message,
        updateResultError: updateResultMutation.error?.message,
        deleteResultError: deleteResultMutation.error?.message,
        uploadPhotoError: uploadPhotoMutation.error?.message,
        deletePhotoError: deletePhotoMutation.error?.message,

        // ✅ Estados de sucesso
        addResultSuccess: addResultMutation.isSuccess,
        updateResultSuccess: updateResultMutation.isSuccess,
        deleteResultSuccess: deleteResultMutation.isSuccess,
        uploadPhotoSuccess: uploadPhotoMutation.isSuccess,
        deletePhotoSuccess: deletePhotoMutation.isSuccess,

        // 🎯 Ações
        addResult: addResultMutation.mutate,
        updateResult: updateResultMutation.mutate,
        deleteResult: deleteResultMutation.mutate,
        uploadPhoto: uploadPhotoMutation.mutate,
        deletePhoto: deletePhotoMutation.mutate,

        // 🧹 Reset
        clearErrors: () => {
            addResultMutation.reset();
            updateResultMutation.reset();
            deleteResultMutation.reset();
            uploadPhotoMutation.reset();
            deletePhotoMutation.reset();
        },
    };
};
