import apiClient from './client';

// 🔧 Interfaces para Maintenance API
export interface MaintenanceType {
    id: string;
    name: string;
    description?: string;
    estimatedDuration?: number; // em minutos
    category: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
    isActive: boolean;
}

export interface CreateMaintenanceRequest {
    vehicleId: string;
    typeId: string;
    scheduledDate: string;
    currentKm: number;
    description?: string;
    services?: string[]; // ✅ NOVO: Array de serviços realizados
    workshopName?: string; // ✅ NOVO: Nome da oficina
    workshopCnpj?: string; // ✅ NOVO: CNPJ da oficina
    workshopAddress?: string; // ✅ NOVO: Endereço da oficina
    estimatedCost?: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    workshopId?: string;
    attachments?: MaintenanceAttachmentData[]; // ✅ NOVO: Anexos
}

// ✅ NOVO: Interface para anexos
export interface MaintenanceAttachmentData {
    url: string;
    type: 'image' | 'pdf';
    category: 'nota_fiscal' | 'orcamento' | 'garantia' | 'outros';
    name?: string;
    size?: number;
    mimeType?: string;
}

export interface UpdateMaintenanceRequest {
    scheduledDate?: string;
    currentKm?: number;
    description?: string;
    estimatedCost?: number;
    actualCost?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    workshopId?: string;
    completedDate?: string;
    nextMaintenanceKm?: number;
    notes?: string;
}

export interface MaintenanceFilters {
    vehicleId?: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dateFrom?: string;
    dateTo?: string;
    workshopId?: string;
    typeId?: string;
    page?: number;
    limit?: number;
}

export interface MaintenanceStats {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalCost: number;
    averageCost: number;
    onTimeCompletion: number; // percentage
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    byWorkshop: Record<string, number>;
}

export interface MaintenanceDocument {
    id: string;
    maintenanceId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
    description?: string;
}

export interface UploadDocumentResponse {
    document: MaintenanceDocument;
    message: string;
}

// 🔧 API de Manutenções
export const MaintenanceAPI = {
    // 📋 Listar manutenções
    getMaintenances: async (filters?: MaintenanceFilters) => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `/maintenances?${queryString}` : '/maintenances';

        const response = await apiClient.get(url);
        return response.data;
    },

    // 🔍 Obter manutenção por ID
    getMaintenanceById: async (maintenanceId: string) => {
        const response = await apiClient.get(`/maintenances/${maintenanceId}`);
        return response.data;
    },

    // ➕ Criar nova manutenção
    createMaintenance: async (maintenanceData: CreateMaintenanceRequest) => {
        const response = await apiClient.post('/maintenances', maintenanceData);
        return response.data;
    },

    // ✏️ Atualizar manutenção
    updateMaintenance: async (maintenanceId: string, updateData: UpdateMaintenanceRequest) => {
        const response = await apiClient.put(`/maintenances/${maintenanceId}`, updateData);
        return response.data;
    },

    // 🗑️ Excluir manutenção
    deleteMaintenance: async (maintenanceId: string) => {
        const response = await apiClient.delete(`/maintenances/${maintenanceId}`);
        return response.data;
    },

    // 📊 Obter estatísticas
    getMaintenanceStats: async (filters?: { vehicleId?: string; dateFrom?: string; dateTo?: string }) => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `/maintenances/stats?${queryString}` : '/maintenances/stats';

        const response = await apiClient.get(url);
        return response.data;
    },

    // 📄 Upload de documento
    uploadDocument: async (maintenanceId: string, file: any) => {
        const formData = new FormData();
        formData.append('document', file);

        const response = await apiClient.post(
            `/maintenances/${maintenanceId}/documents`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // 🗑️ Excluir documento
    deleteDocument: async (maintenanceId: string, documentId: string) => {
        const response = await apiClient.delete(`/maintenances/${maintenanceId}/documents/${documentId}`);
        return response.data;
    },

    // 📋 Listar tipos de manutenção
    getMaintenanceTypes: async () => {
        const response = await apiClient.get('/maintenance-types');
        return response.data;
    },

    // 🔄 Alterar status da manutenção
    changeStatus: async (maintenanceId: string, status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
        const response = await apiClient.patch(`/maintenances/${maintenanceId}/status`, { status });
        return response.data;
    },

    // 📅 Reagendar manutenção
    reschedule: async (maintenanceId: string, newDate: string, reason?: string) => {
        const response = await apiClient.patch(`/maintenances/${maintenanceId}/reschedule`, {
            scheduledDate: newDate,
            reason
        });
        return response.data;
    },

    // 💰 Adicionar custos
    addCosts: async (maintenanceId: string, costs: { description: string; amount: number; category: string }[]) => {
        const response = await apiClient.post(`/maintenances/${maintenanceId}/costs`, { costs });
        return response.data;
    },

    // 🔍 Buscar manutenções por texto
    searchMaintenances: async (query: string, filters?: MaintenanceFilters) => {
        const params = new URLSearchParams({ q: query });
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }

        const response = await apiClient.get(`/maintenances/search?${params.toString()}`);
        return response.data;
    },

    // 📈 Relatório de manutenções
    getMaintenanceReport: async (filters: {
        vehicleId?: string;
        dateFrom: string;
        dateTo: string;
        format?: 'json' | 'pdf' | 'excel';
    }) => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get(`/maintenances/report?${params.toString()}`);
        return response.data;
    },

    // 🔔 Manutenções vencendo
    getUpcomingMaintenances: async (days: number = 30) => {
        const response = await apiClient.get(`/maintenances/upcoming?days=${days}`);
        return response.data;
    },

    // 📊 Histórico de manutenções por veículo
    getVehicleMaintenanceHistory: async (vehicleId: string, limit?: number) => {
        const params = limit ? `?limit=${limit}` : '';
        const response = await apiClient.get(`/vehicles/${vehicleId}/maintenances${params}`);
        return response.data;
    },
};
