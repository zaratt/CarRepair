import apiClient from './client';

// 🔍 Interfaces para Inspection API
export interface InspectionItem {
    id: string;
    category: 'ENGINE' | 'BRAKES' | 'SUSPENSION' | 'ELECTRICAL' | 'BODY' | 'INTERIOR' | 'SAFETY' | 'TIRES';
    name: string;
    description?: string;
    isRequired: boolean;
    order: number;
}

export interface InspectionResult {
    itemId: string;
    status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE';
    notes?: string;
    photoUrl?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedAction?: string;
    estimatedCost?: number;
}

export interface CreateInspectionRequest {
    vehicleId: string;
    typeId: string; // Tipo de inspeção (anual, pré-venda, etc.)
    scheduledDate: string;
    currentKm: number;
    location?: string;
    inspectorId?: string;
    notes?: string;
}

export interface UpdateInspectionRequest {
    scheduledDate?: string;
    currentKm?: number;
    location?: string;
    inspectorId?: string;
    notes?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    completedDate?: string;
    overallRating?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    certificateNumber?: string;
    validUntil?: string;
}

export interface InspectionFilters {
    vehicleId?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    overallRating?: string;
    location?: string;
    inspectorId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'vehicle' | 'status' | 'rating';
    sortOrder?: 'asc' | 'desc';
}

export interface InspectionStats {
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
}

// 🔍 API Class
class InspectionAPI {
    private basePath = '/inspections';

    // 📋 Listar inspeções
    async getInspections(filters?: InspectionFilters) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

        const response = await apiClient.get(url);
        return response.data;
    }

    // 📋 Obter inspeção específica
    async getInspection(inspectionId: string) {
        const response = await apiClient.get(`${this.basePath}/${inspectionId}`);
        return response.data;
    }

    // ➕ Criar nova inspeção
    async createInspection(inspectionData: CreateInspectionRequest) {
        const response = await apiClient.post(this.basePath, inspectionData);
        return response.data;
    }

    // ✏️ Atualizar inspeção
    async updateInspection(inspectionId: string, updateData: UpdateInspectionRequest) {
        const response = await apiClient.put(`${this.basePath}/${inspectionId}`, updateData);
        return response.data;
    }

    // 🗑️ Excluir inspeção
    async deleteInspection(inspectionId: string) {
        const response = await apiClient.delete(`${this.basePath}/${inspectionId}`);
        return response.data;
    }

    // 📊 Obter estatísticas
    async getInspectionStats(filters?: Pick<InspectionFilters, 'vehicleId' | 'dateFrom' | 'dateTo'>) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}/stats?${queryString}` : `${this.basePath}/stats`;

        const response = await apiClient.get(url);
        return response.data;
    }

    // 📋 Obter itens de inspeção por tipo
    async getInspectionItems(typeId: string) {
        const response = await apiClient.get(`${this.basePath}/types/${typeId}/items`);
        return response.data;
    }

    // 📋 Obter tipos de inspeção
    async getInspectionTypes() {
        const response = await apiClient.get(`${this.basePath}/types`);
        return response.data;
    }

    // ✅ Adicionar resultado de item
    async addInspectionResult(inspectionId: string, result: InspectionResult) {
        const response = await apiClient.post(`${this.basePath}/${inspectionId}/results`, result);
        return response.data;
    }

    // ✏️ Atualizar resultado de item
    async updateInspectionResult(inspectionId: string, resultId: string, result: Partial<InspectionResult>) {
        const response = await apiClient.put(`${this.basePath}/${inspectionId}/results/${resultId}`, result);
        return response.data;
    }

    // 🗑️ Remover resultado de item
    async deleteInspectionResult(inspectionId: string, resultId: string) {
        const response = await apiClient.delete(`${this.basePath}/${inspectionId}/results/${resultId}`);
        return response.data;
    }

    // 📸 Upload de foto para item
    async uploadInspectionPhoto(inspectionId: string, resultId: string, file: any) {
        const formData = new FormData();
        formData.append('photo', file);

        const response = await apiClient.post(
            `${this.basePath}/${inspectionId}/results/${resultId}/photo`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    // 🗑️ Remover foto de item
    async deleteInspectionPhoto(inspectionId: string, resultId: string) {
        const response = await apiClient.delete(`${this.basePath}/${inspectionId}/results/${resultId}/photo`);
        return response.data;
    }

    // 📄 Gerar relatório
    async generateReport(inspectionId: string, format: 'PDF' | 'JSON' | 'CSV' = 'PDF') {
        const response = await apiClient.get(`${this.basePath}/${inspectionId}/report?format=${format}`, {
            responseType: format === 'PDF' ? 'blob' : 'json',
        });
        return response.data;
    }

    // 📧 Enviar relatório por email
    async emailReport(inspectionId: string, emails: string[], message?: string) {
        const response = await apiClient.post(`${this.basePath}/${inspectionId}/email-report`, {
            emails,
            message,
        });
        return response.data;
    }

    // 🔄 Alterar status da inspeção
    async changeStatus(inspectionId: string, status: string, notes?: string) {
        const response = await apiClient.patch(`${this.basePath}/${inspectionId}/status`, {
            status,
            notes,
        });
        return response.data;
    }

    // 📅 Reagendar inspeção
    async reschedule(inspectionId: string, newDate: string, reason?: string) {
        const response = await apiClient.patch(`${this.basePath}/${inspectionId}/reschedule`, {
            scheduledDate: newDate,
            reason,
        });
        return response.data;
    }

    // 🏁 Finalizar inspeção
    async completeInspection(inspectionId: string, completion: {
        overallRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
        certificateNumber?: string;
        validUntil?: string;
        finalNotes?: string;
    }) {
        const response = await apiClient.patch(`${this.basePath}/${inspectionId}/complete`, completion);
        return response.data;
    }

    // 📊 Obter histórico de inspeções por veículo
    async getVehicleInspectionHistory(vehicleId: string, limit?: number) {
        const params = limit ? `?limit=${limit}` : '';
        const response = await apiClient.get(`${this.basePath}/vehicle/${vehicleId}/history${params}`);
        return response.data;
    }

    // 🔔 Obter inspeções próximas do vencimento
    async getUpcomingInspections(days: number = 30) {
        const response = await apiClient.get(`${this.basePath}/upcoming?days=${days}`);
        return response.data;
    }

    // ⚠️ Obter inspeções vencidas
    async getOverdueInspections() {
        const response = await apiClient.get(`${this.basePath}/overdue`);
        return response.data;
    }
}

// 🔍 Instância singleton
const inspectionAPI = new InspectionAPI();
export default inspectionAPI;
