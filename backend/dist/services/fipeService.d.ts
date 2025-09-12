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
declare class FipeService {
    private fetchFipe;
    /**
     * Buscar informações de marca por ID
     */
    getBrandInfo(brandId: number): Promise<string>;
    /**
     * Buscar informações de modelo por ID
     */
    getModelInfo(brandId: number, modelId: number): Promise<string>;
    /**
     * Buscar informações completas do veículo
     */
    getVehicleInfo(brandId: number, modelId: number, yearCode: string): Promise<Partial<FipeVehicleInfo>>;
    /**
     * Buscar apenas marca e modelo (método otimizado)
     */
    getBrandAndModel(brandId: number, modelId: number): Promise<{
        brand: string;
        model: string;
    }>;
    /**
     * Buscar marca, modelo e valor FIPE (método completo)
     */
    getBrandModelAndPrice(brandId: number, modelId: number, yearCode: string): Promise<{
        brand: string;
        model: string;
        fipeValue: number;
    }>;
}
export declare const fipeService: FipeService;
export {};
//# sourceMappingURL=fipeService.d.ts.map