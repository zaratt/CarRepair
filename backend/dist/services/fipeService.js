"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fipeService = void 0;
const FIPE_BASE_URL = 'https://fipe.parallelum.com.br/api/v2';
class FipeService {
    async fetchFipe(endpoint) {
        try {
            const response = await fetch(`${FIPE_BASE_URL}/${endpoint}`);
            if (!response.ok) {
                throw new Error(`FIPE API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('❌ FIPE Service Error:', error);
            throw error;
        }
    }
    /**
     * Buscar informações de marca por ID
     */
    async getBrandInfo(brandId) {
        try {
            console.log(`🔍 Buscando marca FIPE ID: ${brandId}`);
            const brands = await this.fetchFipe('cars/brands');
            const brand = brands.find(b => parseInt(b.code) === brandId);
            if (!brand) {
                console.warn(`⚠️ Marca não encontrada para ID: ${brandId}`);
                return 'Marca não identificada';
            }
            console.log(`✅ Marca encontrada: ${brand.name}`);
            return brand.name;
        }
        catch (error) {
            console.error('❌ Erro ao buscar marca:', error);
            return 'Marca não identificada';
        }
    }
    /**
     * Buscar informações de modelo por ID
     */
    async getModelInfo(brandId, modelId) {
        try {
            console.log(`🔍 Buscando modelo FIPE - Brand: ${brandId}, Model: ${modelId}`);
            const models = await this.fetchFipe(`cars/brands/${brandId}/models`);
            const model = models.find(m => parseInt(m.code) === modelId);
            if (!model) {
                console.warn(`⚠️ Modelo não encontrado para Brand: ${brandId}, Model: ${modelId}`);
                return 'Modelo não identificado';
            }
            console.log(`✅ Modelo encontrado: ${model.name}`);
            return model.name;
        }
        catch (error) {
            console.error('❌ Erro ao buscar modelo:', error);
            return 'Modelo não identificado';
        }
    }
    /**
     * Buscar informações completas do veículo
     */
    async getVehicleInfo(brandId, modelId, yearCode) {
        try {
            console.log(`🔍 Buscando info completa - Brand: ${brandId}, Model: ${modelId}, Year: ${yearCode}`);
            const vehicleInfo = await this.fetchFipe(`cars/brands/${brandId}/models/${modelId}/years/${yearCode}`);
            console.log(`✅ Info completa encontrada: ${vehicleInfo.brand} ${vehicleInfo.model}`);
            return {
                brand: vehicleInfo.brand,
                model: vehicleInfo.model,
                modelYear: vehicleInfo.modelYear,
                fuel: vehicleInfo.fuel,
                price: vehicleInfo.price,
            };
        }
        catch (error) {
            console.error('❌ Erro ao buscar info completa:', error);
            return {};
        }
    }
    /**
     * Buscar apenas marca e modelo (método otimizado)
     */
    async getBrandAndModel(brandId, modelId) {
        try {
            // Buscar marca e modelo em paralelo para melhor performance
            const [brand, model] = await Promise.all([
                this.getBrandInfo(brandId),
                this.getModelInfo(brandId, modelId)
            ]);
            return { brand, model };
        }
        catch (error) {
            console.error('❌ Erro ao buscar marca e modelo:', error);
            return {
                brand: 'Marca não identificada',
                model: 'Modelo não identificado'
            };
        }
    }
    /**
     * Buscar marca, modelo e valor FIPE (método completo)
     */
    async getBrandModelAndPrice(brandId, modelId, yearCode) {
        try {
            // Buscar informações completas incluindo preço
            const [brandModelInfo, vehicleInfo] = await Promise.all([
                this.getBrandAndModel(brandId, modelId),
                this.getVehicleInfo(brandId, modelId, yearCode)
            ]);
            // Converter preço de string para número
            let fipeValue = 0;
            if (vehicleInfo.price) {
                // Remove R$, espaços e pontos, substitui vírgula por ponto
                const cleanPrice = vehicleInfo.price
                    .replace(/R\$\s?/g, '')
                    .replace(/\./g, '')
                    .replace(',', '.');
                fipeValue = parseFloat(cleanPrice) || 0;
            }
            return {
                ...brandModelInfo,
                fipeValue
            };
        }
        catch (error) {
            console.error('❌ Erro ao buscar dados completos da FIPE:', error);
            const fallbackBrandModel = await this.getBrandAndModel(brandId, modelId);
            return {
                ...fallbackBrandModel,
                fipeValue: 0
            };
        }
    }
}
exports.fipeService = new FipeService();
//# sourceMappingURL=fipeService.js.map