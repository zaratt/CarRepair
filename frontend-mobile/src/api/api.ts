import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AuthService } from '../services/authService';
import { Brand, Inspection, Maintenance, Model, User, Vehicle, VehiclePhoto, Workshop } from '../types';
import { MaintenanceAttachment } from '../types/MaintenanceAttachment';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://automazo-production.up.railway.app/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ✅ INTERCEPTOR PARA ADICIONAR TOKEN AUTOMATICAMENTE
api.interceptors.request.use(
    async (config) => {
        const token = await AuthService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ INTERCEPTOR PARA TRATAR ERROS DE AUTENTICAÇÃO
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token inválido ou expirado, fazer logout
            await AuthService.logout();
            // Aqui você pode adicionar lógica para redirecionar para login
        }
        return Promise.reject(error);
    }
);

// Marcas
export const getBrands = async (): Promise<Brand[]> => {
    const response = await api.get('/brands');
    return response.data;
};

// Modelos por marca
export const getModelsByBrand = async (brandId: string): Promise<Model[]> => {
    const response = await api.get(`/brands/${brandId}/models`);
    return response.data;
};

// Veículos
export const getVehicles = async (userId?: string): Promise<Vehicle[]> => {
    const response = await api.get('/vehicles', { params: userId ? { userId } : {} });
    return response.data;
};

export const createVehicle = async (data: Omit<Vehicle, 'id' | 'createdAt' | 'brand' | 'model' | 'owner'>): Promise<Vehicle> => {
    const response = await api.post('/vehicles', data);
    return response.data;
};

export const updateVehicle = async (id: string, data: Omit<Vehicle, 'id' | 'createdAt' | 'brand' | 'model' | 'owner'>): Promise<Vehicle> => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
};

export const getVehicle = async (id: string, userId?: string): Promise<Vehicle> => {
    const response = await api.get(`/vehicles/${id}`, { params: userId ? { userId } : {} });
    return response.data;
};

export const getVehiclePhotos = async (vehicleId: string): Promise<VehiclePhoto[]> => {
    const response = await api.get(`/vehicles/${vehicleId}/photos`);
    return response.data;
};

export const deleteVehiclePhoto = async (vehicleId: string, photoId: string): Promise<void> => {
    await api.delete(`/vehicles/${vehicleId}/photos/${photoId}`);
};

export const uploadVehiclePhoto = async (vehicleId: string, photoUri: string) => {
    const formData = new FormData();
    formData.append('photo', {
        uri: photoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    } as any);
    const { data } = await api.post(`/vehicles/${vehicleId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

// Usuários
export const getUsers = async (userId?: string, profile?: string): Promise<User[]> => {
    const params: any = {};
    if (userId) params.userId = userId;
    if (profile) params.profile = profile;
    const response = await api.get('/users', { params });
    return response.data;
};

export const createUser = async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
};

export const updateUser = async (id: string, data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
};

// Usuário - atualizar status de validação
export const updateUserValidation = async (userId: string, isValidated: boolean) => {
    const response = await api.patch(`/users/${userId}/validate`, { isValidated });
    return response.data;
};

// Usuário - exclusão total da conta
export const deleteUserFull = async (userId: string) => {
    const response = await api.delete(`/users/${userId}/full`);
    return response.data;
};

// Usuário - atualizar dados do perfil
export const updateUserProfile = async (userId: string, data: Partial<User>) => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
};

// Oficinas
export const getWorkshops = async (): Promise<Workshop[]> => {
    const response = await api.get('/workshops');
    return response.data;
};

export const createWorkshop = async (data: Omit<Workshop, 'id'>): Promise<Workshop> => {
    const response = await api.post('/workshops', data);
    return response.data;
};

export const updateWorkshop = async (id: string, data: Omit<Workshop, 'id'>): Promise<Workshop> => {
    const response = await api.put(`/workshops/${id}`, data);
    return response.data;
};

export const deleteWorkshop = async (id: string): Promise<void> => {
    await api.delete(`/workshops/${id}`);
};

export const getWorkshopCommonServices = async (workshopId: string): Promise<string[]> => {
    try {
        const response = await api.get(`/workshops/${workshopId}/common-services`);
        return response.data.services || [];
    } catch (error) {
        console.error('Erro ao buscar serviços comuns da oficina:', error);
        return [];
    }
};

// Manutenções
export const getMaintenances = async (userId?: string): Promise<Maintenance[]> => {
    const response = await api.get('/maintenances', { params: userId ? { userId } : {} });
    return response.data;
};

export const createMaintenance = async (data: Omit<Maintenance, 'id' | 'createdAt'>): Promise<Maintenance> => {
    const response = await api.post('/maintenances', data);
    return response.data;
};

export const updateMaintenance = async (id: string, data: Omit<Maintenance, 'id' | 'createdAt'>): Promise<Maintenance> => {
    const response = await api.put(`/maintenances/${id}`, data);
    return response.data;
};

export const deleteMaintenance = async (id: string): Promise<void> => {
    await api.delete(`/maintenances/${id}`);
};

export const getMaintenance = async (id: string): Promise<Maintenance> => {
    const response = await api.get(`/maintenances/${id}`);
    return response.data;
};

// Inspeções
export const getInspections = async (userId?: string): Promise<Inspection[]> => {
    const response = await api.get('/inspections', { params: userId ? { userId } : {} });
    return response.data.data ? response.data.data.inspections : response.data;
};

export const createInspection = async (data: Omit<Inspection, 'id' | 'createdAt'>): Promise<Inspection> => {
    const response = await api.post('/inspections', data);
    return response.data.data ? response.data.data : response.data;
};

export const updateInspection = async (id: string, data: Partial<Omit<Inspection, 'id' | 'createdAt'>>): Promise<Inspection> => {
    const response = await api.put(`/inspections/${id}`, data);
    return response.data.data ? response.data.data : response.data;
};

export const deleteInspection = async (id: string): Promise<void> => {
    await api.delete(`/inspections/${id}`);
};

export const getInspection = async (id: string): Promise<Inspection> => {
    const response = await api.get(`/inspections/${id}`);
    return response.data.data ? response.data.data : response.data;
};

// Avaliação de oficinas
export const rateWorkshop = async (
    workshopId: string,
    userId: string,
    value: number,
    review?: string[]
): Promise<{ success: boolean; rating: number }> => {
    const response = await api.post(`/workshops/${workshopId}/rate`, { userId, value, review });
    return response.data;
};

export const getWorkshopRatings = async (workshopId: string) => {
    const response = await api.get(`/workshops/${workshopId}/ratings`);
    return response.data;
};

// Estatísticas Home
export const getStatistics = async (userId: string, profile: string) => {
    const response = await api.get('/statistics', { params: { userId, profile } });
    return response.data;
};

// Anexos de manutenção
export const getMaintenanceAttachments = async (maintenanceId: string): Promise<MaintenanceAttachment[]> => {
    const response = await api.get(`/maintenances/${maintenanceId}/attachments`);
    return response.data;
};

export const uploadMaintenanceAttachment = async (maintenanceId: string, fileUri: string, type: 'photo' | 'pdf', name?: string) => {
    const formData = new FormData();
    formData.append('file', {
        uri: fileUri,
        name: name || (type === 'pdf' ? 'ordem_servico.pdf' : 'ordem_servico.jpg'),
        type: type === 'pdf' ? 'application/pdf' : 'image/jpeg',
    } as any);
    formData.append('type', type);
    const { data } = await api.post(`/maintenances/${maintenanceId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const deleteMaintenanceAttachment = async (maintenanceId: string, attachmentId: string): Promise<void> => {
    await api.delete(`/maintenances/${maintenanceId}/attachments/${attachmentId}`);
};

// Favoritar e desfavoritar oficinas
export const favoriteWorkshop = async (workshopId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/workshops/${workshopId}/favorite`, { userId });
    return response.data;
};

export const unfavoriteWorkshop = async (workshopId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/workshops/${workshopId}/favorite`, { data: { userId } });
    return response.data;
};

export const getFavoriteWorkshops = async (userId: string): Promise<Workshop[]> => {
    const response = await api.get(`/users/${userId}/favorite-workshops`);
    return response.data;
};

// Anexos de inspeção
export const getInspectionAttachments = async (inspectionId: string) => {
    const response = await api.get(`/inspections/${inspectionId}/attachments`);
    return response.data;
};

export const uploadInspectionAttachment = async (inspectionId: string, file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
    } as any);
    const { data } = await api.post(`/inspections/${inspectionId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const deleteInspectionAttachment = async (inspectionId: string, attachmentId: string): Promise<void> => {
    await api.delete(`/inspections/${inspectionId}/attachments/${attachmentId}`);
};

// --- React Query Hooks para Inspeções ---
export function useInspectionsQuery(userId?: string) {
    return useQuery<Inspection[]>({
        queryKey: ['inspections', userId],
        queryFn: () => getInspections(userId),
    });
}

export function useInspectionQuery(id: string) {
    return useQuery<Inspection>({
        queryKey: ['inspection', id],
        queryFn: () => getInspection(id),
        enabled: !!id,
    });
}

export function useCreateInspectionMutation(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createInspection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspections', userId] });
        },
    });
}

export function useUpdateInspectionMutation(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateInspection(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspections', userId] });
        },
    });
}

export function useDeleteInspectionMutation(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteInspection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspections', userId] });
        },
    });
}

// --- React Query Hooks para Anexos de Inspeção ---
export function useInspectionAttachmentsQuery(inspectionId?: string) {
    return useQuery({
        queryKey: ['inspection-attachments', inspectionId],
        queryFn: () => inspectionId ? getInspectionAttachments(inspectionId) : [],
        enabled: !!inspectionId,
    });
}

export function useUploadInspectionAttachmentMutation(inspectionId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: { uri: string; name: string; type: string }) => uploadInspectionAttachment(inspectionId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-attachments', inspectionId] });
        },
    });
}

export function useDeleteInspectionAttachmentMutation(inspectionId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: string) => deleteInspectionAttachment(inspectionId, attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-attachments', inspectionId] });
        },
    });
}

// Dashboard
export interface DashboardSummary {
    totalVehicles: number;
    totalMaintenances: number;
    averageSpending: number;
    totalWorkshopsUsed: number;
}

export interface VehicleDashboard {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    currentKm: number;
    totalMaintenances: number;
    averageSpending: number;
    upcomingMaintenances: {
        id: string;
        description: string;
        scheduledDate: string;
        estimatedCost?: number;
    }[];
}

export const getDashboardSummary = async (userId: string): Promise<DashboardSummary> => {
    const response = await api.get(`/dashboard/summary/${userId}`);
    return response.data;
};

export const getDashboardVehicles = async (userId: string): Promise<VehicleDashboard[]> => {
    const response = await api.get(`/dashboard/vehicles/${userId}`);
    return response.data;
};

// React Query hooks para dashboard
export function useDashboardSummary(userId: string) {
    return useQuery({
        queryKey: ['dashboard-summary', userId],
        queryFn: () => getDashboardSummary(userId),
        enabled: !!userId,
    });
}

export function useDashboardVehicles(userId: string) {
    return useQuery({
        queryKey: ['dashboard-vehicles', userId],
        queryFn: () => getDashboardVehicles(userId),
        enabled: !!userId,
    });
}

export const getVehicleLastMaintenance = async (vehicleId: string) => {
    const response = await api.get(`/vehicles/${vehicleId}/last-maintenance`);
    return response.data;
};

// Sistema de Status Automático
export const updateMaintenanceStatus = async () => {
    const response = await api.post('/maintenances/update-status');
    return response.data;
};

export const validateMaintenance = async (maintenanceId: string, userId: string) => {
    const response = await api.put(`/maintenances/${maintenanceId}/validate`, { userId });
    return response.data;
};

export const getWorkshopPendingMaintenances = async (userId: string) => {
    const response = await api.get(`/workshops/${userId}/pending-maintenances`);
    return response.data;
};

export const getUserMaintenanceHistory = async (userId: string): Promise<{
    services: string[];
    recentServices: string[];
    totalMaintenances: number;
}> => {
    try {
        const response = await api.get(`/users/${userId}/maintenance-history`);
        return {
            services: response.data.services || [],
            recentServices: response.data.recentServices || [],
            totalMaintenances: response.data.totalMaintenances || 0
        };
    } catch (error) {
        console.error('Erro ao buscar histórico do usuário:', error);
        return {
            services: [],
            recentServices: [],
            totalMaintenances: 0
        };
    }
};