const FIPE_BASE_URL = 'https://fipe.parallelum.com.br/api/v2';

interface FipeBrand {
    code: string;
    name: string;
}

interface FipeModel {
    code: string;
    name: string;
}

interface FipeVehicleInfo {
    brand: string;
    model: string;
    modelYear: number;
    fuel: string;
    codeFipe: string;
    price: string;
    priceHistory: Array<{
        price: string;
        month: string;
    }>;
}

class FipeService {
    private async fetchFipe<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${FIPE_BASE_URL}/${endpoint}`);

            if (!response.ok) {
                throw new Error(`FIPE API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json() as T;
        } catch (error) {
            console.error('❌ FIPE Service Error:', error);
            throw error;
        }
    }

    /**
     * Buscar informações de marca por ID
     */
    async getBrandInfo(brandId: number): Promise<string> {
        try {
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('🔍 Buscando marca FIPE ID:', brandId);
            const brands = await this.fetchFipe<FipeBrand[]>('cars/brands');
            const brand = brands.find(b => parseInt(b.code) === brandId);

            if (!brand) {
                // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
                console.warn('⚠️ Marca não encontrada para ID:', brandId);
                return 'Marca não identificada';
            }

            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('✅ Marca encontrada:', brand.name);
            return brand.name;
        } catch (error) {
            console.error('❌ Erro ao buscar marca:', error);
            return 'Marca não identificada';
        }
    }

    /**
     * Buscar informações de modelo por ID
     */
    async getModelInfo(brandId: number, modelId: number): Promise<string> {
        try {
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('🔍 Buscando modelo FIPE - Brand:', brandId, 'Model:', modelId);
            const models = await this.fetchFipe<FipeModel[]>(`cars/brands/${brandId}/models`);
            const model = models.find(m => parseInt(m.code) === modelId);

            if (!model) {
                // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
                console.warn('⚠️ Modelo não encontrado para Brand:', brandId, 'Model:', modelId);
                return 'Modelo não identificado';
            }

            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('✅ Modelo encontrado:', model.name);
            return model.name;
        } catch (error) {
            console.error('❌ Erro ao buscar modelo:', error);
            return 'Modelo não identificado';
        }
    }

    /**
     * Buscar informações completas do veículo
     */
    async getVehicleInfo(brandId: number, modelId: number, yearCode: string): Promise<Partial<FipeVehicleInfo>> {
        try {
            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('🔍 Buscando info completa - Brand:', brandId, 'Model:', modelId, 'Year:', yearCode);
            const vehicleInfo = await this.fetchFipe<FipeVehicleInfo>(`cars/brands/${brandId}/models/${modelId}/years/${yearCode}`);

            // ✅ SEGURANÇA: Log com format string estático (CWE-134 Prevention)
            console.log('✅ Info completa encontrada:', vehicleInfo.brand, vehicleInfo.model);
            return {
                brand: vehicleInfo.brand,
                model: vehicleInfo.model,
                modelYear: vehicleInfo.modelYear,
                fuel: vehicleInfo.fuel,
                price: vehicleInfo.price,
            };
        } catch (error) {
            console.error('❌ Erro ao buscar info completa:', error);
            return {};
        }
    }

    /**
     * Buscar apenas marca e modelo (método otimizado)
     */
    async getBrandAndModel(brandId: number, modelId: number): Promise<{ brand: string; model: string }> {
        try {
            // Buscar marca e modelo em paralelo para melhor performance
            const [brand, model] = await Promise.all([
                this.getBrandInfo(brandId),
                this.getModelInfo(brandId, modelId)
            ]);

            return { brand, model };
        } catch (error) {
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
    async getBrandModelAndPrice(brandId: number, modelId: number, yearCode: string): Promise<{ brand: string; model: string; fipeValue: number }> {
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
        } catch (error) {
            console.error('❌ Erro ao buscar dados completos da FIPE:', error);
            const fallbackBrandModel = await this.getBrandAndModel(brandId, modelId);
            return {
                ...fallbackBrandModel,
                fipeValue: 0
            };
        }
    }
}

export const fipeService = new FipeService();
