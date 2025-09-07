import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, reactQueryUtils } from '../api/queryClient';
import {
    CreateVehicleRequest,
    UpdateVehicleRequest,
    VehicleAPI,
    VehicleFilters
} from '../api/vehicle.api';

// 🚗 Hook para gerenciar veículos com React Query
export const useVehicles = (filters?: VehicleFilters) => {
    const queryClient = useQueryClient();

    // 📋 Query dos veículos
    const vehiclesQuery = useQuery({
        queryKey: queryKeys.vehicles.list(JSON.stringify(filters || {})),
        queryFn: async () => {
            console.log('🔍 [VEHICLES QUERY] Executando query de veículos...');
            console.log('🔍 [VEHICLES QUERY] Query key filters:', JSON.stringify(filters || {}));
            const result = await VehicleAPI.getVehicles();
            console.log('🔍 [VEHICLES QUERY] Resposta da API:', result);
            console.log('🔍 [VEHICLES QUERY] Estrutura da resposta:', {
                hasVehicles: !!result?.data,
                vehiclesIsArray: Array.isArray(result?.data),
                vehiclesLength: result?.data?.length || 0,
                hasTotal: !!result?.pagination?.total,
                totalValue: result?.pagination?.total,
                fullObject: Object.keys(result || {})
            });
            return result;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos
    });

    // 📊 Query para estatísticas
    const statsQuery = useQuery({
        queryKey: ['vehicles', 'stats'],
        queryFn: VehicleAPI.getVehicleStats,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    // ➕ Mutation para criar veículo
    const createMutation = useMutation({
        mutationFn: (vehicleData: CreateVehicleRequest) => VehicleAPI.createVehicle(vehicleData),
        onSuccess: (newVehicle) => {
            console.log('✅ Veículo criado, invalidando cache...', newVehicle);

            try {
                // 🔄 Invalidar TODAS as queries de veículos para garantir sincronização
                console.log('🔄 Invalidando todas as queries de veículos...');
                queryClient.invalidateQueries({
                    queryKey: ['vehicles']  // Invalida todas as queries que começam com 'vehicles'
                });

                console.log('✅ Cache invalidado com sucesso');
            } catch (err) {
                console.error('❌ Erro no onSuccess:', err);
            }
        },
        onError: (error) => {
            console.error('❌ Erro ao criar veículo:', error);
        },
    });

    // ✏️ Mutation para atualizar veículo
    const updateMutation = useMutation({
        mutationFn: ({ vehicleId, updateData }: { vehicleId: string; updateData: UpdateVehicleRequest }) =>
            VehicleAPI.updateVehicle(vehicleId, updateData),
        onSuccess: (updatedVehicle) => {
            // Invalidar queries relacionadas
            reactQueryUtils.invalidateVehicles();

            // Atualizar cache específico do veículo
            queryClient.setQueryData(
                queryKeys.vehicles.detail(updatedVehicle.id),
                updatedVehicle
            );

            console.log('✅ Veículo atualizado com sucesso:', updatedVehicle.licensePlate);
        },
        onError: (error) => {
            console.error('❌ Erro ao atualizar veículo:', error);
        },
    });

    // 🗑️ Mutation para excluir veículo
    const deleteMutation = useMutation({
        mutationFn: (vehicleId: string) => VehicleAPI.deleteVehicle(vehicleId),
        onSuccess: (_, vehicleId) => {
            // Invalidar lista de veículos
            reactQueryUtils.invalidateVehicles();

            // Remover do cache
            queryClient.removeQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) });

            console.log('✅ Veículo excluído com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao excluir veículo:', error);
        },
    });

    // 📷 Mutation para upload de foto
    const uploadPhotoMutation = useMutation({
        mutationFn: ({ vehicleId, photoFile }: { vehicleId: string; photoFile: any }) =>
            VehicleAPI.uploadPhoto(vehicleId, photoFile),
        onSuccess: (response, { vehicleId }) => {
            // Invalidar dados do veículo específico
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) });

            // Invalidar lista também para atualizar thumbnails
            reactQueryUtils.invalidateVehicles();

            console.log('✅ Foto enviada com sucesso:', response.photo.id);
        },
        onError: (error) => {
            console.error('❌ Erro ao enviar foto:', error);
        },
    });

    // 🗑️ Mutation para excluir foto
    const deletePhotoMutation = useMutation({
        mutationFn: ({ vehicleId, photoId }: { vehicleId: string; photoId: string }) =>
            VehicleAPI.deletePhoto(vehicleId, photoId),
        onSuccess: (_, { vehicleId }) => {
            // Invalidar dados do veículo
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) });
            reactQueryUtils.invalidateVehicles();

            console.log('✅ Foto excluída com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao excluir foto:', error);
        },
    });

    // 🏷️ Mutation para definir foto principal
    const setPrimaryPhotoMutation = useMutation({
        mutationFn: ({ vehicleId, photoId }: { vehicleId: string; photoId: string }) =>
            VehicleAPI.setPrimaryPhoto(vehicleId, photoId),
        onSuccess: (updatedVehicle) => {
            // Atualizar cache do veículo
            queryClient.setQueryData(
                queryKeys.vehicles.detail(updatedVehicle.id),
                updatedVehicle
            );

            // Invalidar lista para atualizar thumbnails
            reactQueryUtils.invalidateVehicles();

            console.log('✅ Foto principal definida com sucesso');
        },
        onError: (error) => {
            console.error('❌ Erro ao definir foto principal:', error);
        },
    });

    // 🔄 Mutation para alterar status
    const toggleStatusMutation = useMutation({
        mutationFn: ({ vehicleId, active }: { vehicleId: string; active: boolean }) =>
            VehicleAPI.toggleVehicleStatus(vehicleId, active),
        onSuccess: (updatedVehicle) => {
            // Atualizar caches
            queryClient.setQueryData(
                queryKeys.vehicles.detail(updatedVehicle.id),
                updatedVehicle
            );
            reactQueryUtils.invalidateVehicles();

            console.log(`✅ Veículo ${updatedVehicle.active ? 'ativado' : 'desativado'} com sucesso`);
        },
        onError: (error) => {
            console.error('❌ Erro ao alterar status:', error);
        },
    });

    return {
        // 📊 Dados
        vehicles: vehiclesQuery.data?.data || [], // ✅ CORREÇÃO: usar .data em vez de .vehicles
        vehiclesCount: vehiclesQuery.data?.pagination?.total || 0, // ✅ CORREÇÃO: usar .pagination.total
        stats: statsQuery.data,

        // 🔄 Estados de loading
        isLoading: vehiclesQuery.isLoading,
        isStatsLoading: statsQuery.isLoading,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isUploadingPhoto: uploadPhotoMutation.isPending,
        isDeletingPhoto: deletePhotoMutation.isPending,
        isSettingPrimaryPhoto: setPrimaryPhotoMutation.isPending,
        isTogglingStatus: toggleStatusMutation.isPending,

        // ❌ Erros
        error: vehiclesQuery.error?.message,
        statsError: statsQuery.error?.message,
        createError: createMutation.error?.message,
        updateError: updateMutation.error?.message,
        deleteError: deleteMutation.error?.message,
        uploadPhotoError: uploadPhotoMutation.error?.message,
        deletePhotoError: deletePhotoMutation.error?.message,

        // ✅ Sucessos
        createSuccess: createMutation.isSuccess,
        updateSuccess: updateMutation.isSuccess,
        deleteSuccess: deleteMutation.isSuccess,
        uploadPhotoSuccess: uploadPhotoMutation.isSuccess,

        // 🎯 Ações
        createVehicle: createMutation.mutate,
        updateVehicle: updateMutation.mutate,
        deleteVehicle: deleteMutation.mutate,
        uploadPhoto: uploadPhotoMutation.mutate,
        deletePhoto: deletePhotoMutation.mutate,
        setPrimaryPhoto: setPrimaryPhotoMutation.mutate,
        toggleStatus: toggleStatusMutation.mutate,

        // 🔄 Utilitários
        refetch: vehiclesQuery.refetch,
        refetchStats: statsQuery.refetch,

        // 🧹 Reset de erros
        clearErrors: () => {
            createMutation.reset();
            updateMutation.reset();
            deleteMutation.reset();
            uploadPhotoMutation.reset();
            deletePhotoMutation.reset();
            setPrimaryPhotoMutation.reset();
            toggleStatusMutation.reset();
        },
    };
};

// 🔍 Hook para obter um veículo específico
export const useVehicle = (vehicleId: string) => {
    const queryClient = useQueryClient();

    const vehicleQuery = useQuery({
        queryKey: queryKeys.vehicles.detail(vehicleId),
        queryFn: () => VehicleAPI.getVehicleById(vehicleId),
        enabled: !!vehicleId,
        staleTime: 2 * 60 * 1000, // 2 minutos
    });

    return {
        vehicle: vehicleQuery.data,
        isLoading: vehicleQuery.isLoading,
        error: vehicleQuery.error?.message,
        refetch: vehicleQuery.refetch,
    };
};

export default useVehicles;
