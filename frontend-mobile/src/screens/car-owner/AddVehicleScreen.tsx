import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createVehicle } from '../../api/api';
import VehiclePhotos from '../../components/vehicle/VehiclePhotos';
import { useAuthContext } from '../../contexts/AuthContext';
import { fipeApiService } from '../../services/fipeApi';
import { AppColors } from '../../styles/colors';
import { FipeBrand, FipeModel, FipeVehicleData, FipeYear } from '../../types/vehicle.types';

export default function AddVehicleScreen() {
    const navigation = useNavigation();
    const { user } = useAuthContext();

    // Estados dos dropdowns FIPE
    const [brands, setBrands] = useState<FipeBrand[]>([]);
    const [models, setModels] = useState<FipeModel[]>([]);
    const [years, setYears] = useState<FipeYear[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingYears, setLoadingYears] = useState(false);
    const [loadingValue, setLoadingValue] = useState(false);

    // Estados dos valores selecionados
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [fipeData, setFipeData] = useState<FipeVehicleData | null>(null);

    // Estados do formulário
    const [plate, setPlate] = useState('');
    const [currentKm, setCurrentKm] = useState('');
    const [color, setColor] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);

    // Estados de controle
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<'fipe' | 'form'>('fipe');

    // Carregar marcas quando a tela abrir
    React.useEffect(() => {
        loadBrands();
    }, []);

    // Carregar marcas da API FIPE
    const loadBrands = async () => {
        try {
            setLoadingBrands(true);
            console.log('🔍 Carregando marcas FIPE...');

            const brandsData = await fipeApiService.getBrands();
            setBrands(brandsData);

            console.log(`✅ ${brandsData.length} marcas carregadas`);
        } catch (error) {
            console.error('❌ Erro ao carregar marcas:', error);
            Alert.alert('Erro', 'Não foi possível carregar as marcas de veículos');
        } finally {
            setLoadingBrands(false);
        }
    };

    // Carregar modelos quando marca for selecionada
    const handleBrandSelect = async (brandCode: string) => {
        try {
            setSelectedBrand(brandCode);
            setSelectedModel('');
            setSelectedYear('');
            setModels([]);
            setYears([]);
            setFipeData(null);

            if (!brandCode) return;

            setLoadingModels(true);
            console.log('🔍 Carregando modelos para marca:', brandCode);

            const modelsData = await fipeApiService.getModels(brandCode);
            setModels(modelsData);

            console.log(`✅ ${modelsData.length} modelos carregados`);
        } catch (error) {
            console.error('❌ Erro ao carregar modelos:', error);
            Alert.alert('Erro', 'Não foi possível carregar os modelos');
        } finally {
            setLoadingModels(false);
        }
    };

    // Carregar anos quando modelo for selecionado
    const handleModelSelect = async (modelCode: string) => {
        try {
            setSelectedModel(modelCode);
            setSelectedYear('');
            setYears([]);
            setFipeData(null);

            if (!modelCode) return;

            setLoadingYears(true);
            console.log('🔍 Carregando anos para modelo:', modelCode);

            const yearsData = await fipeApiService.getYears(selectedBrand, modelCode);
            setYears(yearsData);

            console.log(`✅ ${yearsData.length} anos carregados`);
        } catch (error) {
            console.error('❌ Erro ao carregar anos:', error);
            Alert.alert('Erro', 'Não foi possível carregar os anos');
        } finally {
            setLoadingYears(false);
        }
    };

    // Carregar valor FIPE quando ano for selecionado
    const handleYearSelect = async (yearCode: string) => {
        try {
            setSelectedYear(yearCode);
            setFipeData(null);

            if (!yearCode) return;

            setLoadingValue(true);
            console.log('🔍 Carregando valor FIPE...');

            const vehicleData = await fipeApiService.getVehicleData(selectedBrand, selectedModel, yearCode);
            setFipeData(vehicleData);

            console.log('✅ Valor FIPE carregado:', vehicleData.value);
        } catch (error) {
            console.error('❌ Erro ao carregar valor FIPE:', error);
            Alert.alert('Erro', 'Não foi possível carregar o valor FIPE');
        } finally {
            setLoadingValue(false);
        }
    };

    // Avançar para formulário de dados pessoais
    const handleContinueToForm = () => {
        if (!fipeData) {
            Alert.alert('Atenção', 'Selecione marca, modelo e ano para continuar');
            return;
        }
        setStep('form');
    };

    // Voltar para seleção FIPE
    const handleBackToFipe = () => {
        setStep('fipe');
    };

    // Validar e salvar veículo
    const handleSave = async () => {
        try {
            // Validações
            if (!fipeData) {
                Alert.alert('Erro', 'Dados FIPE não carregados');
                return;
            }

            if (!plate.trim()) {
                Alert.alert('Erro', 'A placa é obrigatória');
                return;
            }

            if (!currentKm.trim() || isNaN(Number(currentKm)) || Number(currentKm) < 0) {
                Alert.alert('Erro', 'KM deve ser um número válido');
                return;
            }

            if (!color.trim()) {
                Alert.alert('Erro', 'A cor é obrigatória');
                return;
            }

            setSaving(true);

            // Preparar dados para envio (formato correto para API)
            const vehicleData = {
                licensePlate: plate.trim().toUpperCase(),
                brandId: 'temp-brand-id', // TODO: Implementar mapeamento de marca FIPE -> brandId
                modelId: 'temp-model-id', // TODO: Implementar mapeamento de modelo FIPE -> modelId
                yearManufacture: parseInt(fipeData?.year?.toString() || '2000'),
                modelYear: parseInt(fipeData?.year?.toString() || '2000'),
                fuelType: 'GASOLINE' as const, // TODO: Implementar seleção de combustível
                vin: '', // Campo obrigatório mas vazio por enquanto
                ownerId: user?.id,
            };

            console.log('💾 Salvando veículo...', vehicleData);
            console.log('👤 Usuário:', user);
            console.log('🚗 Dados FIPE:', fipeData);

            // Criar veículo primeiro sem fotos
            const newVehicle = await createVehicle(vehicleData);

            console.log('✅ Veículo criado:', newVehicle);

            // TODO: Implementar upload de fotos separadamente se necessário
            if (photos.length > 0) {
                console.log('📸 Fotos serão implementadas posteriormente:', photos);
            }

            console.log('✅ Veículo salvo com sucesso!', newVehicle);

            Alert.alert(
                'Sucesso!',
                `${fipeData.brand} ${fipeData.model} ${fipeData.year} cadastrado com sucesso!`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack() // Volta para lista de veículos
                    }
                ]
            );

        } catch (error) {
            console.error('❌ Erro ao salvar veículo:', error);
            Alert.alert('Erro', 'Não foi possível salvar o veículo');
        } finally {
            setSaving(false);
        }
    };

    // Renderizar seção FIPE
    const renderFipeSection = () => (
        <View>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        🔍 Buscar Veículo (FIPE)
                    </Text>
                    <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                        Selecione marca, modelo e ano para obter o valor FIPE
                    </Text>

                    {/* Dropdown Marca */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Marca:</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={brands.map(brand => ({ label: brand.name, value: brand.code }))}
                            labelField="label"
                            valueField="value"
                            placeholder="Selecionar marca..."
                            value={selectedBrand}
                            onChange={(item) => handleBrandSelect(item.value)}
                            search
                            searchPlaceholder="Buscar marca..."
                            disable={loadingBrands}
                            renderLeftIcon={() => (
                                <MaterialCommunityIcons
                                    name={loadingBrands ? "loading" : "car"}
                                    size={20}
                                    color={AppColors.primary}
                                    style={styles.dropdownIcon}
                                />
                            )}
                        />
                    </View>

                    {/* Dropdown Modelo */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Modelo:</Text>
                        <Dropdown
                            style={[styles.dropdown, !selectedBrand && styles.dropdownDisabled]}
                            data={models.map(model => ({ label: model.name, value: model.code }))}
                            labelField="label"
                            valueField="value"
                            placeholder="Selecionar modelo..."
                            value={selectedModel}
                            onChange={(item) => handleModelSelect(item.value)}
                            search
                            searchPlaceholder="Buscar modelo..."
                            disable={!selectedBrand || loadingModels}
                            renderLeftIcon={() => (
                                <MaterialCommunityIcons
                                    name={loadingModels ? "loading" : "car-sports"}
                                    size={20}
                                    color={selectedBrand ? AppColors.primary : AppColors.gray}
                                    style={styles.dropdownIcon}
                                />
                            )}
                        />
                    </View>

                    {/* Dropdown Ano */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Ano:</Text>
                        <Dropdown
                            style={[styles.dropdown, !selectedModel && styles.dropdownDisabled]}
                            data={years.map(year => ({ label: year.name, value: year.code }))}
                            labelField="label"
                            valueField="value"
                            placeholder="Selecionar ano..."
                            value={selectedYear}
                            onChange={(item) => handleYearSelect(item.value)}
                            disable={!selectedModel || loadingYears}
                            renderLeftIcon={() => (
                                <MaterialCommunityIcons
                                    name={loadingYears ? "loading" : "calendar"}
                                    size={20}
                                    color={selectedModel ? AppColors.primary : AppColors.gray}
                                    style={styles.dropdownIcon}
                                />
                            )}
                        />
                    </View>

                    {/* Valor FIPE */}
                    {loadingValue && (
                        <View style={styles.valueContainer}>
                            <MaterialCommunityIcons name="loading" size={24} color={AppColors.primary} />
                            <Text style={styles.loadingText}>Carregando valor FIPE...</Text>
                        </View>
                    )}

                    {fipeData && (
                        <View style={styles.valueContainer}>
                            <MaterialCommunityIcons name="currency-usd" size={24} color={AppColors.primary} />
                            <View style={styles.valueInfo}>
                                <Text variant="titleMedium" style={styles.fipeValue}>
                                    {fipeData.value}
                                </Text>
                                <Text variant="bodySmall" style={styles.fipeMonth}>
                                    Referência: {fipeData.month}
                                </Text>
                            </View>
                        </View>
                    )}
                </Card.Content>
            </Card>

            {/* Botão Continuar */}
            <View style={styles.actionButtons}>
                <Button
                    mode="contained"
                    onPress={handleContinueToForm}
                    style={styles.continueButton}
                    disabled={!fipeData}
                    icon="arrow-right"
                >
                    Continuar
                </Button>
            </View>
        </View>
    );

    // Renderizar formulário de dados pessoais
    const renderFormSection = () => (
        <View>
            {/* Resumo FIPE */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        📋 Veículo Selecionado
                    </Text>
                    {fipeData && (
                        <View style={styles.selectedVehicle}>
                            <Text variant="bodyLarge" style={styles.vehicleName}>
                                {fipeData.brand} {fipeData.model} {fipeData.year}
                            </Text>
                            <Text variant="bodyMedium" style={styles.vehicleValue}>
                                Valor FIPE: {fipeData.value}
                            </Text>
                        </View>
                    )}
                </Card.Content>
            </Card>

            {/* Dados pessoais */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        📝 Dados do Veículo
                    </Text>

                    {/* Placa */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Placa: *</Text>
                        <TextInput
                            value={plate}
                            onChangeText={setPlate}
                            style={styles.textInput}
                            mode="outlined"
                            placeholder="ABC-1234"
                            autoCapitalize="characters"
                            maxLength={8}
                            left={<TextInput.Icon icon="card-text" />}
                        />
                    </View>

                    {/* KM Atual */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>KM Atual: *</Text>
                        <TextInput
                            value={currentKm}
                            onChangeText={setCurrentKm}
                            style={styles.textInput}
                            mode="outlined"
                            placeholder="85240"
                            keyboardType="numeric"
                            left={<TextInput.Icon icon="speedometer" />}
                        />
                    </View>

                    {/* Cor */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Cor: *</Text>
                        <TextInput
                            value={color}
                            onChangeText={setColor}
                            style={styles.textInput}
                            mode="outlined"
                            placeholder="Prata"
                            left={<TextInput.Icon icon="palette" />}
                        />
                    </View>
                </Card.Content>
            </Card>

            {/* Fotos */}
            <VehiclePhotos
                photos={photos}
                onPhotosChange={setPhotos}
                editing={true}
                maxPhotos={4}
            />

            {/* Botões de ação */}
            <View style={styles.actionButtons}>
                <Button
                    mode="outlined"
                    onPress={handleBackToFipe}
                    style={styles.backButton}
                    icon="arrow-left"
                    disabled={saving}
                >
                    Voltar
                </Button>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.saveButton}
                    loading={saving}
                    disabled={saving}
                    icon="content-save"
                >
                    {saving ? 'Salvando...' : 'Salvar Veículo'}
                </Button>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {step === 'fipe' ? renderFipeSection() : renderFormSection()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    scrollView: {
        flex: 1,
    },
    card: {
        margin: 16,
        backgroundColor: AppColors.white,
    },
    sectionTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionSubtitle: {
        color: AppColors.text,
        opacity: 0.7,
        marginBottom: 20,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 8,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: AppColors.gray,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: AppColors.white,
    },
    dropdownDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: AppColors.gray,
        opacity: 0.6,
    },
    dropdownIcon: {
        marginRight: 8,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: AppColors.primary,
    },
    valueInfo: {
        marginLeft: 8,
        flex: 1,
    },
    fipeValue: {
        color: AppColors.text,
        fontWeight: 'bold',
    },
    fipeMonth: {
        color: AppColors.text,
        opacity: 0.7,
    },
    loadingText: {
        color: AppColors.text,
        marginLeft: 8,
    },
    selectedVehicle: {
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: AppColors.primary,
    },
    vehicleName: {
        color: AppColors.text,
        fontWeight: 'bold',
    },
    vehicleValue: {
        color: AppColors.text,
        opacity: 0.8,
    },
    textInput: {
        backgroundColor: AppColors.white,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 100, // Espaço para bottom tabs
        gap: 12,
    },
    continueButton: {
        flex: 1,
        backgroundColor: AppColors.primary,
    },
    backButton: {
        flex: 1,
        borderColor: AppColors.gray,
    },
    saveButton: {
        flex: 2,
        backgroundColor: AppColors.primary,
    },
});
