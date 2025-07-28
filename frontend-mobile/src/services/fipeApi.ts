// FIPE API Service - Apenas para cadastro de novos veículos

import { FipeBrand, FipeModel, FipeVehicleData, FipeYear } from '../types/vehicle.types';

const FIPE_BASE_URL = 'https://fipe.parallelum.com.br/api/v2';
const VEHICLE_TYPE = 'cars'; // carros

class FipeApiService {
    private async fetchFipe<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${FIPE_BASE_URL}/${endpoint}`);

            if (!response.ok) {
                throw new Error(`FIPE API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('FIPE API Error:', error);
            throw new Error('Falha ao consultar dados da FIPE. Verifique sua conexão.');
        }
    }

    /**
     * Buscar todas as marcas disponíveis
     */
    async getBrands(): Promise<FipeBrand[]> {
        console.log('🚗 Buscando marcas na API FIPE...');
        const brands = await this.fetchFipe<FipeBrand[]>(`${VEHICLE_TYPE}/brands`);
        console.log(`✅ ${brands.length} marcas encontradas`);
        return brands;
    }

    /**
     * Buscar modelos de uma marca específica
     */
    async getModels(brandCode: string): Promise<FipeModel[]> {
        console.log(`🚗 Buscando modelos para marca ${brandCode}...`);
        const models = await this.fetchFipe<FipeModel[]>(`${VEHICLE_TYPE}/brands/${brandCode}/models`);
        console.log(`✅ ${models.length} modelos encontrados`);
        return models;
    }

    /**
     * Buscar anos disponíveis para um modelo específico
     */
    async getYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
        console.log(`🚗 Buscando anos para modelo ${modelCode}...`);
        const years = await this.fetchFipe<FipeYear[]>(`${VEHICLE_TYPE}/brands/${brandCode}/models/${modelCode}/years`);
        console.log(`✅ ${years.length} anos encontrados`);
        return years;
    }

    /**
     * Buscar dados completos do veículo (incluindo valor FIPE)
     */
    async getVehicleData(brandCode: string, modelCode: string, yearCode: string): Promise<FipeVehicleData> {
        console.log(`🚗 Buscando dados FIPE para ${brandCode}/${modelCode}/${yearCode}...`);
        const vehicleData = await this.fetchFipe<FipeVehicleData>(
            `${VEHICLE_TYPE}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`
        );
        console.log('✅ Dados FIPE obtidos:', vehicleData);
        return vehicleData;
    }

    /**
     * Parse do valor FIPE string para number
     * "R$ 85.000,00" -> 85000
     */
    parseFipeValue(fipeValue: string): number {
        const cleanValue = fipeValue
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();

        return parseFloat(cleanValue) || 0;
    }

    /**
     * Format valor para exibição
     * 85000 -> "R$ 85.000,00"
     */
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    }
}

export const fipeApiService = new FipeApiService();
