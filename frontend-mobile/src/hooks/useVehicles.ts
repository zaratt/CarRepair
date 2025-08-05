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

    // 📋 Query para listar veículos
    const vehiclesQuery = useQuery({
        queryKey: queryKeys.vehicles.list(JSON.stringify(filters || {})),
        queryFn: () => VehicleAPI.getVehicles(filters),
        staleTime: 2 * 60 * 1000, // 2 minutos
        enabled: true,
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
            // Invalidar lista de veículos
            reactQueryUtils.invalidateVehicles();

            // Atualizar cache da lista atual se possível
            queryClient.setQueryData(
                queryKeys.vehicles.list(JSON.stringify(filters || {})),
                (oldData: any) => {
                    if (oldData) {
                        return {
                            ...oldData,
                            vehicles: [newVehicle, ...oldData.vehicles],
                            total: oldData.total + 1
                        };
                    }
                    return oldData;
                }
            );

            console.log('✅ Veículo criado com sucesso:', newVehicle.licensePlate);
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
        vehicles: vehiclesQuery.data?.vehicles || [],
        vehiclesCount: vehiclesQuery.data?.total || 0,
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
