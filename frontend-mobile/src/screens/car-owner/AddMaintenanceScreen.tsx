import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';

import { COMMON_SERVICES, createMaintenance, getAllMaintenances } from '../../services/maintenanceApi';
import { mockVehicles } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { MaintenanceFormData } from '../../types/maintenance.types';

interface AddMaintenanceScreenProps {
    navigation: any;
}

export default function AddMaintenanceScreen({ navigation }: AddMaintenanceScreenProps) {
    // Estados do formulário
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentKm, setCurrentKm] = useState('');
    const [workshopName, setWorkshopName] = useState('');
    const [workshopCnpj, setWorkshopCnpj] = useState('');
    const [workshopAddress, setWorkshopAddress] = useState('');
    const [value, setValue] = useState('');
    const [documents, setDocuments] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Debug do estado do modal
    console.log('🔍 Estado do modal de veículos:', showVehicleModal);
    console.log('🚗 Veículos disponíveis:', mockVehicles.length);

    // Validações
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Formatação de data para pt-br
    const formatDatePtBr = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Handler para mudança de data
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    // Validar KM com base na última manutenção do veículo
    const validateKm = (km: number, vehicleId: string): string | null => {
        if (!vehicleId) return null;

        const maintenances = getAllMaintenances();
        const vehicleMaintenances = maintenances
            .filter(m => m.vehicleId === vehicleId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (vehicleMaintenances.length > 0) {
            const lastMaintenanceKm = vehicleMaintenances[0].currentKm;
            if (km <= lastMaintenanceKm) {
                return `KM deve ser maior que ${lastMaintenanceKm.toLocaleString('pt-BR')} (última manutenção)`;
            }
        }

        return null;
    };

    // Formatação de valor monetário
    const formatCurrency = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        const formattedValue = (Number(numericValue) / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return formattedValue;
    };

    // Formatação de CNPJ
    const formatCNPJ = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        return numericValue
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    // Formatação de KM
    const formatKm = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Toggle serviço selecionado
    const toggleService = (service: string) => {
        setSelectedServices(prev => {
            if (prev.includes(service)) {
                return prev.filter(s => s !== service);
            } else {
                return [...prev, service];
            }
        });
    };

    // Seleção de documentos
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                console.log('Documento selecionado:', asset.name);
                setDocuments(prev => [...prev, `document_${Date.now()}.pdf`]);
                Alert.alert('Sucesso', 'Documento adicionado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao selecionar documento:', error);
            Alert.alert('Erro', 'Não foi possível selecionar o documento');
        }
    };

    // Seleção de foto
    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permissão necessária', 'É necessário permitir acesso à galeria de fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                console.log('Imagem selecionada:', result.assets[0].uri);
                setDocuments(prev => [...prev, `image_${Date.now()}.jpg`]);
                Alert.alert('Sucesso', 'Imagem adicionada com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
        }
    };

    // Remover documento
    const removeDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    // Validar formulário
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!selectedVehicle) {
            newErrors.vehicle = 'Selecione um veículo';
        }

        if (selectedServices.length === 0) {
            newErrors.services = 'Selecione pelo menos um serviço';
        }

        if (!currentKm.trim()) {
            newErrors.currentKm = 'Informe a quilometragem atual';
        } else if (isNaN(Number(currentKm.replace(/\./g, '')))) {
            newErrors.currentKm = 'Quilometragem deve ser um número válido';
        } else {
            // Validar KM em relação à última manutenção
            const kmNumber = Number(currentKm.replace(/\./g, ''));
            const kmError = validateKm(kmNumber, selectedVehicle);
            if (kmError) {
                newErrors.currentKm = kmError;
            }
        }

        if (!workshopName.trim()) {
            newErrors.workshopName = 'Informe o nome da oficina';
        }

        if (!value.trim()) {
            newErrors.value = 'Informe o valor da manutenção';
        } else if (isNaN(Number(value.replace(/[^0-9]/g, '')) / 100)) {
            newErrors.value = 'Valor deve ser um número válido';
        }

        // Data não precisa validação pois só permite datas passadas ou atual

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Salvar manutenção
    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('Erro', 'Por favor, corrija os campos destacados em vermelho');
            return;
        }

        try {
            setLoading(true);

            const maintenanceData: Omit<MaintenanceFormData, 'id'> = {
                vehicleId: selectedVehicle,
                services: selectedServices,
                date: date.toISOString(),
                currentKm: Number(currentKm.replace(/\./g, '')),
                workshop: {
                    name: workshopName,
                    cnpj: workshopCnpj || undefined,
                    address: workshopAddress || undefined,
                },
                value: Number(value.replace(/[^0-9]/g, '')) / 100,
                documents: documents.length > 0 ? documents : [],
            };

            // Simular delay de API
            await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));

            const newMaintenance = createMaintenance({
                ...maintenanceData,
                userId: 'user1', // TODO: Pegar do contexto de autenticação
                status: 'pending',
                documents: documents,
            });

            console.log('✅ Manutenção criada:', newMaintenance);

            Alert.alert(
                'Sucesso!',
                `Manutenção registrada com sucesso!\n\nCódigo de validação: ${newMaintenance.validationCode}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );

        } catch (error) {
            console.error('❌ Erro ao salvar manutenção:', error);
            Alert.alert('Erro', 'Não foi possível salvar a manutenção');
        } finally {
            setLoading(false);
        }
    };

    // Renderizar seletor de veículo
    const renderVehicleSelector = () => {
        const selectedVehicleData = mockVehicles.find(v => v.id === selectedVehicle);
        const vehicleLabel = selectedVehicleData
            ? `${selectedVehicleData.brand} ${selectedVehicleData.model} (${selectedVehicleData.year}) - ${selectedVehicleData.plate}`
            : 'Selecione um veículo...';

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="car" size={20} color={AppColors.primary} />
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Veículo
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            console.log('🚗 Abrindo modal de veículos...');
                            setShowVehicleModal(true);
                        }}
                        style={[styles.vehicleSelector, errors.vehicle && styles.vehicleSelectorError]}
                    >
                        <View style={styles.vehicleSelectorContent}>
                            <Text variant="bodySmall" style={styles.vehicleSelectorLabel}>
                                Veículo
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={[
                                    styles.vehicleSelectorText,
                                    !selectedVehicle && styles.vehicleSelectorPlaceholder
                                ]}
                                numberOfLines={1}
                            >
                                {vehicleLabel}
                            </Text>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-down"
                            size={20}
                            color={AppColors.text}
                            style={styles.vehicleSelectorIcon}
                        />
                    </TouchableOpacity>
                    {errors.vehicle && (
                        <Text variant="bodySmall" style={styles.errorText}>
                            {errors.vehicle}
                        </Text>
                    )}

                    {/* Modal de seleção de veículo */}
                    <Modal
                        visible={showVehicleModal}
                        animationType="slide"
                        transparent={false}
                        onRequestClose={() => setShowVehicleModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text variant="headlineSmall" style={styles.modalTitle}>
                                    Selecionar Veículo
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowVehicleModal(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color={AppColors.text} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={mockVehicles}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.vehicleOption,
                                            selectedVehicle === item.id && styles.selectedVehicleOption
                                        ]}
                                        onPress={() => {
                                            setSelectedVehicle(item.id);
                                            setShowVehicleModal(false);
                                        }}
                                    >
                                        <View style={styles.vehicleInfo}>
                                            <Text variant="titleMedium" style={styles.vehicleTitle}>
                                                {item.brand} {item.model} ({item.year})
                                            </Text>
                                            <Text variant="bodyMedium" style={styles.vehiclePlate}>
                                                Placa: {item.plate}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.vehicleKm}>
                                                KM: {item.currentKm.toLocaleString('pt-BR')}
                                            </Text>
                                        </View>
                                        {selectedVehicle === item.id && (
                                            <MaterialCommunityIcons
                                                name="check-circle"
                                                size={24}
                                                color={AppColors.primary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                contentContainerStyle={styles.vehicleList}
                            />
                        </View>
                    </Modal>
                </Card.Content>
            </Card>
        );
    };    // Renderizar chips de serviços
    const renderServicesSelector = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="wrench" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Serviços Realizados
                    </Text>
                </View>

                <View style={styles.servicesContainer}>
                    {COMMON_SERVICES.map((service) => (
                        <Chip
                            key={service}
                            selected={selectedServices.includes(service)}
                            onPress={() => toggleService(service)}
                            style={[
                                styles.serviceChip,
                                selectedServices.includes(service) && styles.selectedServiceChip
                            ]}
                            textStyle={[
                                styles.serviceChipText,
                                selectedServices.includes(service) && styles.selectedServiceChipText
                            ]}
                        >
                            {service}
                        </Chip>
                    ))}
                </View>

                {errors.services && (
                    <Text variant="bodySmall" style={styles.errorText}>
                        {errors.services}
                    </Text>
                )}

                {selectedServices.length > 0 && (
                    <View style={styles.selectedServicesContainer}>
                        <Text variant="bodyMedium" style={styles.selectedServicesTitle}>
                            Serviços selecionados ({selectedServices.length}):
                        </Text>
                        <Text variant="bodySmall" style={styles.selectedServicesList}>
                            {selectedServices.join(', ')}
                        </Text>
                    </View>
                )}
            </Card.Content>
        </Card>
    );

    // Renderizar campos de dados
    const renderDataFields = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="clipboard-text" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Dados da Manutenção
                    </Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfWidth}>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <TextInput
                                label="Data da Manutenção"
                                value={formatDatePtBr(date)}
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.date}
                                editable={false}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                        </TouchableOpacity>
                        {errors.date && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.date}
                            </Text>
                        )}

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                maximumDate={new Date()} // Não permite datas futuras
                                locale="pt-BR"
                            />
                        )}
                    </View>

                    <View style={styles.halfWidth}>
                        <TextInput
                            label="KM Atual"
                            value={currentKm}
                            onChangeText={(text) => setCurrentKm(formatKm(text))}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="numeric"
                            error={!!errors.currentKm}
                            right={<TextInput.Icon icon="speedometer" />}
                        />
                        {errors.currentKm && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.currentKm}
                            </Text>
                        )}
                    </View>
                </View>

                <TextInput
                    label="Valor Total (R$)"
                    value={value}
                    onChangeText={(text) => setValue(formatCurrency(text))}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    error={!!errors.value}
                    right={<TextInput.Icon icon="currency-usd" />}
                />
                {errors.value && (
                    <Text variant="bodySmall" style={styles.errorText}>
                        {errors.value}
                    </Text>
                )}
            </Card.Content>
        </Card>
    );

    // Renderizar dados da oficina
    const renderWorkshopFields = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="store" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Dados da Oficina
                    </Text>
                </View>

                <TextInput
                    label="Nome da Oficina *"
                    value={workshopName}
                    onChangeText={setWorkshopName}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.workshopName}
                />
                {errors.workshopName && (
                    <Text variant="bodySmall" style={styles.errorText}>
                        {errors.workshopName}
                    </Text>
                )}

                <TextInput
                    label="CNPJ (opcional)"
                    value={workshopCnpj}
                    onChangeText={(text) => setWorkshopCnpj(formatCNPJ(text))}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                />

                <TextInput
                    label="Endereço (opcional)"
                    value={workshopAddress}
                    onChangeText={setWorkshopAddress}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    numberOfLines={2}
                />
            </Card.Content>
        </Card>
    );

    // Renderizar documentos
    const renderDocuments = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="paperclip" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Documentos Comprobatórios
                    </Text>
                </View>

                <Text variant="bodySmall" style={styles.documentsHint}>
                    Adicione fotos ou PDFs dos comprovantes (nota fiscal, ordem de serviço, etc.)
                </Text>

                <View style={styles.documentButtonsContainer}>
                    <Button
                        mode="outlined"
                        onPress={pickImage}
                        style={styles.documentButton}
                        icon="camera"
                        textColor="#000000"
                    >
                        Adicionar Foto
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={pickDocument}
                        style={styles.documentButton}
                        icon="file-pdf-box"
                        textColor="#000000"
                    >
                        Adicionar PDF
                    </Button>
                </View>

                {documents.length > 0 && (
                    <View style={styles.documentsListContainer}>
                        <Text variant="bodyMedium" style={styles.documentsListTitle}>
                            Documentos adicionados ({documents.length}):
                        </Text>
                        {documents.map((doc, index) => (
                            <View key={index} style={styles.documentItem}>
                                <MaterialCommunityIcons
                                    name={doc.includes('pdf') ? "file-pdf-box" : "image"}
                                    size={16}
                                    color={AppColors.text}
                                />
                                <Text variant="bodySmall" style={styles.documentName}>
                                    {doc.includes('pdf') ? 'Documento PDF' : 'Imagem'} {index + 1}
                                </Text>
                                <Button
                                    mode="text"
                                    onPress={() => removeDocument(index)}
                                    compact
                                    textColor={AppColors.danger}
                                >
                                    Remover
                                </Button>
                            </View>
                        ))}
                    </View>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderVehicleSelector()}
                {renderServicesSelector()}
                {renderDataFields()}
                {renderWorkshopFields()}
                {renderDocuments()}

                {/* Botões de ação */}
                <View style={styles.actionButtons}>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={styles.cancelButton}
                        disabled={loading}
                        textColor="#000000"
                    >
                        Cancelar
                    </Button>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        style={styles.saveButton}
                        loading={loading}
                        disabled={loading}
                        labelStyle={styles.saveButtonText}
                    >
                        {loading ? 'Salvando...' : 'Registrar'}
                    </Button>
                </View>
            </ScrollView>
        </View>
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
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 16,
        backgroundColor: AppColors.white,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        marginLeft: 8,
        color: AppColors.text,
        fontWeight: '600',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: AppColors.gray,
        borderRadius: 4,
        backgroundColor: AppColors.white,
    },
    errorContainer: {
        borderColor: AppColors.danger,
    },
    picker: {
        height: 50,
        color: AppColors.text,
    },
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    serviceChip: {
        backgroundColor: AppColors.white,
        borderColor: AppColors.gray,
        borderWidth: 1,
        marginBottom: 4,
    },
    selectedServiceChip: {
        backgroundColor: AppColors.primary,
    },
    serviceChipText: {
        color: AppColors.text,
        fontSize: 12,
    },
    selectedServiceChipText: {
        color: AppColors.text,
        fontWeight: '600',
    },
    selectedServicesContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    selectedServicesTitle: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    selectedServicesList: {
        color: AppColors.text,
        opacity: 0.8,
        lineHeight: 18,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    input: {
        marginBottom: 12,
        backgroundColor: AppColors.white,
    },
    documentsHint: {
        color: AppColors.text,
        opacity: 0.7,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    documentButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    documentButton: {
        flex: 1,
        borderColor: AppColors.primary,
    },
    documentsListContainer: {
        marginTop: 8,
    },
    documentsListTitle: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 4,
    },
    documentName: {
        flex: 1,
        marginLeft: 8,
        color: AppColors.text,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        borderColor: AppColors.gray,
    },
    saveButton: {
        flex: 1,
        backgroundColor: AppColors.primary,
    },
    saveButtonText: {
        color: '#000000',
        fontWeight: '600',
    },
    errorText: {
        color: AppColors.danger,
        marginTop: 4,
    },
    // Estilos do seletor customizado de veículo
    vehicleSelector: {
        borderWidth: 1,
        borderColor: AppColors.gray,
        borderRadius: 4,
        backgroundColor: AppColors.white,
        paddingHorizontal: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    vehicleSelectorError: {
        borderColor: AppColors.danger,
    },
    vehicleSelectorContent: {
        flex: 1,
    },
    vehicleSelectorLabel: {
        color: AppColors.text,
        opacity: 0.6,
        marginBottom: 4,
        fontSize: 12,
    },
    vehicleSelectorText: {
        color: AppColors.text,
        fontSize: 16,
    },
    vehicleSelectorPlaceholder: {
        opacity: 0.5,
    },
    vehicleSelectorIcon: {
        marginLeft: 8,
    },
    // Estilos do modal de veículos
    modalContainer: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray,
    },
    modalTitle: {
        color: AppColors.text,
        fontWeight: '600',
    },
    modalCloseButton: {
        padding: 8,
    },
    vehicleList: {
        padding: 16,
    },
    vehicleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: AppColors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.gray,
    },
    selectedVehicleOption: {
        borderColor: AppColors.primary,
        backgroundColor: '#f0f8ff',
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleTitle: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    vehiclePlate: {
        color: AppColors.text,
        marginBottom: 2,
    },
    vehicleKm: {
        color: AppColors.text,
        opacity: 0.7,
    },
    separator: {
        height: 12,
    },
});
