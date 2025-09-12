import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';

import { CreateMaintenanceRequest } from '../../api/maintenance.api';
import DocumentUploader, { DocumentFile } from '../../components/maintenance/DocumentUploader';
import { useMaintenanceContext } from '../../hooks/useMaintenanceContext';
import { useVehicleContext } from '../../hooks/useVehicleContext';
import { AppColors } from '../../styles/colors';

interface AddMaintenanceScreenProps {
    navigation: any;
}

// 🎯 Componente principal da tela
export default function AddMaintenanceScreen({ navigation }: AddMaintenanceScreenProps) {
    const {
        createMaintenance,
        isCreating,
        createSuccess,
        createError,
        isUsingRealAPI
    } = useMaintenanceContext();

    const { vehicles } = useVehicleContext();

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
    const [description, setDescription] = useState('');
    const [documents, setDocuments] = useState<DocumentFile[]>([]); // ✅ Estado para documentos

    // Validações
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // ✅ Serviços expandidos com categorias
    const COMMON_SERVICES = [
        // Motor e mecânica
        'Troca de óleo',
        'Troca de filtro',
        'Revisão geral',
        'Motor',
        'Câmbio',
        'Embreagem',
        'Suspensão',

        // Sistemas
        'Freios',
        'Sistema elétrico',
        'Ar condicionado',
        'Alinhamento e balanceamento',

        // Vidros e carroceria
        'Vidro',
        'Funilaria',
        'Pintura',

        // Interior e conforto
        'Som',
        'Estofamento',
        'Acessórios',

        // Pneus e rodas
        'Pneus',
        'Rodas',

        // Outros
        'Limpeza detalhada',
        'Inspeção',
    ];

    // Formatação de data para pt-br
    const formatDatePtBr = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // ✅ Validação de data - máximo 60 dias atrás
    const getMinimumDate = () => {
        const today = new Date();
        const sixtyDaysAgo = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
        return sixtyDaysAgo;
    };

    const getMaximumDate = () => {
        return new Date(); // Data de hoje
    };

    // Handler para mudança de data
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const minDate = getMinimumDate();
            const maxDate = getMaximumDate();

            if (selectedDate < minDate) {
                Alert.alert(
                    'Data Inválida',
                    'A data da manutenção não pode ser anterior a 60 dias atrás.',
                    [{ text: 'OK' }]
                );
                return;
            }

            if (selectedDate > maxDate) {
                Alert.alert(
                    'Data Inválida',
                    'A data da manutenção não pode ser posterior à data de hoje.',
                    [{ text: 'OK' }]
                );
                return;
            }

            setDate(selectedDate);
            // Limpar erro de data se houver
            if (errors.date) {
                setErrors(prev => ({ ...prev, date: '' }));
            }
        }
    };

    // Adicionar/remover serviço
    const toggleService = (service: string) => {
        setSelectedServices(prev => {
            if (prev.includes(service)) {
                return prev.filter(s => s !== service);
            } else {
                return [...prev, service];
            }
        });
    };

    // Validar formulário
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!selectedVehicle) {
            newErrors.vehicle = 'Selecione um veículo';
        }

        if (selectedServices.length === 0) {
            newErrors.services = 'Selecione pelo menos um serviço';
        }

        if (!currentKm) {
            newErrors.currentKm = 'Informe a quilometragem atual';
        } else if (!/^\\d+$/.test(currentKm)) {
            newErrors.currentKm = 'Quilometragem deve conter apenas números';
        }

        if (!workshopName.trim()) {
            newErrors.workshopName = 'Informe o nome da oficina';
        }

        if (!workshopCnpj.trim()) {
            newErrors.workshopCnpj = 'Informe o CNPJ da oficina';
        }

        if (!value) {
            newErrors.value = 'Informe o valor da manutenção';
        } else if (!/^\\d+([.,]\\d{1,2})?$/.test(value)) {
            newErrors.value = 'Valor deve ser um número válido';
        }

        // ✅ Validação de documentos obrigatórios
        const notasFiscais = documents.filter(doc => doc.category === 'nota_fiscal');
        if (notasFiscais.length === 0) {
            newErrors.documents = 'É obrigatório adicionar pelo menos uma Nota Fiscal';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Salvar manutenção
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // ✅ Verificar se todos os documentos foram enviados ao servidor
            const pendingUploads = documents.filter(doc => doc.isUploading);
            if (pendingUploads.length > 0) {
                Alert.alert(
                    'Upload em Andamento',
                    'Aguarde todos os documentos serem enviados antes de salvar a manutenção.'
                );
                return;
            }

            const maintenanceData: CreateMaintenanceRequest = {
                vehicleId: selectedVehicle,
                typeId: 'type1', // Valor padrão - será substituído por seleção real
                scheduledDate: date.toISOString(),
                currentKm: parseInt(currentKm),
                // ✅ Novos campos
                services: selectedServices, // Array de serviços selecionados
                workshopName: workshopName.trim(),
                workshopCnpj: workshopCnpj.trim(),
                workshopAddress: workshopAddress.trim(),
                description: description?.trim() || '',
                estimatedCost: parseFloat(value.replace(',', '.')),
                priority: 'MEDIUM',
                workshopId: 'workshop1', // Mock
                // ✅ Documentos com URLs reais do servidor
                attachments: documents.map(doc => ({
                    url: doc.uploadedUrl || doc.uri, // Usar URL do servidor se disponível
                    type: doc.type,
                    category: doc.category,
                    name: doc.name,
                    size: doc.size,
                    mimeType: doc.mimeType,
                })),
            };

            console.log('📝 Criando manutenção:', maintenanceData);
            createMaintenance(maintenanceData);

            if (!isUsingRealAPI) {
                // Se estiver usando mock, simular sucesso
                Alert.alert(
                    'Sucesso',
                    'Manutenção registrada com sucesso!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            }

        } catch (error) {
            console.error('Erro ao salvar manutenção:', error);
            Alert.alert('Erro', 'Erro ao registrar manutenção. Tente novamente.');
        }
    };

    // Efeitos para lidar com sucesso/erro da API real
    React.useEffect(() => {
        if (createSuccess && isUsingRealAPI) {
            Alert.alert(
                'Sucesso',
                'Manutenção registrada com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        }
    }, [createSuccess, isUsingRealAPI, navigation]);

    React.useEffect(() => {
        if (createError && isUsingRealAPI) {
            Alert.alert('Erro', createError);
        }
    }, [createError, isUsingRealAPI]);

    // Renderizar item do veículo
    const renderVehicleItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.vehicleItem,
                selectedVehicle === item.id && styles.selectedVehicleItem
            ]}
            onPress={() => {
                setSelectedVehicle(item.id);
                setShowVehicleModal(false);
            }}
        >
            <View style={styles.vehicleInfo}>
                <Text variant="titleSmall">{item.brand} {item.model}</Text>
                <Text variant="bodySmall" style={styles.vehicleSubtitle}>
                    {item.year} • {item.plate}
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
    );

    // Obter dados do veículo selecionado
    const selectedVehicleData = (vehicles || []).find(v => v.id === selectedVehicle);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineSmall" style={styles.title}>
                        Nova Manutenção
                    </Text>

                    {/* Seleção de Veículo */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Veículo *
                        </Text>

                        <TouchableOpacity
                            style={[styles.input, errors.vehicle && styles.inputError]}
                            onPress={() => setShowVehicleModal(true)}
                        >
                            <View style={styles.inputContent}>
                                <Text style={[
                                    styles.inputText,
                                    !selectedVehicleData && styles.placeholderText
                                ]}>
                                    {selectedVehicleData
                                        ? `${selectedVehicleData.brand} ${selectedVehicleData.model} (${selectedVehicleData.licensePlate || 'N/A'})`
                                        : 'Selecione um veículo'
                                    }
                                </Text>
                                <MaterialCommunityIcons
                                    name="chevron-down"
                                    size={24}
                                    color={AppColors.text}
                                />
                            </View>
                        </TouchableOpacity>
                        {errors.vehicle && (
                            <Text style={styles.errorText}>{errors.vehicle}</Text>
                        )}
                    </View>

                    {/* Modal de Seleção de Veículo */}
                    <Modal
                        visible={showVehicleModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={() => setShowVehicleModal(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <MaterialCommunityIcons
                                        name="close"
                                        size={24}
                                        color={AppColors.text}
                                    />
                                </TouchableOpacity>
                                <Text variant="titleLarge" style={styles.modalTitle}>
                                    Selecionar Veículo
                                </Text>
                                <View style={styles.modalPlaceholder} />
                            </View>

                            <FlatList
                                data={vehicles || []}
                                keyExtractor={(item) => item.id}
                                renderItem={renderVehicleItem}
                                style={styles.vehicleList}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </Modal>

                    {/* Quilometragem Atual */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Quilometragem Atual *
                        </Text>
                        <TextInput
                            value={currentKm}
                            onChangeText={setCurrentKm}
                            placeholder="Ex: 50000"
                            keyboardType="numeric"
                            style={[styles.textInput, errors.currentKm && styles.inputError]}
                            mode="outlined"
                            right={<TextInput.Affix text="km" />}
                        />
                        {errors.currentKm && (
                            <Text style={styles.errorText}>{errors.currentKm}</Text>
                        )}
                    </View>

                    {/* Data da Manutenção */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Data da Manutenção *
                        </Text>

                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <View style={styles.inputContent}>
                                <Text style={styles.inputText}>
                                    {formatDatePtBr(date)}
                                </Text>
                                <MaterialCommunityIcons
                                    name="calendar"
                                    size={24}
                                    color={AppColors.text}
                                />
                            </View>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                minimumDate={getMinimumDate()}
                                maximumDate={getMaximumDate()}
                            />
                        )}
                    </View>

                    {/* Serviços */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Serviços Realizados *
                        </Text>
                        <View style={styles.servicesContainer}>
                            {COMMON_SERVICES.map((service, index) => (
                                <Chip
                                    key={index}
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
                            <Text style={styles.errorText}>{errors.services}</Text>
                        )}
                    </View>

                    {/* Descrição Adicional */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Descrição Adicional
                        </Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Descreva outros detalhes da manutenção..."
                            multiline
                            numberOfLines={3}
                            style={styles.textInput}
                            mode="outlined"
                        />
                    </View>

                    {/* Dados da Oficina */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Dados da Oficina
                        </Text>

                        <TextInput
                            value={workshopName}
                            onChangeText={setWorkshopName}
                            placeholder="Nome da oficina *"
                            style={[styles.textInput, errors.workshopName && styles.inputError]}
                            mode="outlined"
                        />
                        {errors.workshopName && (
                            <Text style={styles.errorText}>{errors.workshopName}</Text>
                        )}

                        <TextInput
                            value={workshopCnpj}
                            onChangeText={setWorkshopCnpj}
                            placeholder="CNPJ da oficina *"
                            keyboardType="numeric"
                            style={[styles.textInput, errors.workshopCnpj && styles.inputError]}
                            mode="outlined"
                        />
                        {errors.workshopCnpj && (
                            <Text style={styles.errorText}>{errors.workshopCnpj}</Text>
                        )}

                        <TextInput
                            value={workshopAddress}
                            onChangeText={setWorkshopAddress}
                            placeholder="Endereço da oficina"
                            multiline
                            style={styles.textInput}
                            mode="outlined"
                        />
                    </View>

                    {/* Valor */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Valor da Manutenção *
                        </Text>
                        <TextInput
                            value={value}
                            onChangeText={setValue}
                            placeholder="Ex: 150,00"
                            keyboardType="numeric"
                            style={[styles.textInput, errors.value && styles.inputError]}
                            mode="outlined"
                            left={<TextInput.Affix text="R$" />}
                        />
                        {errors.value && (
                            <Text style={styles.errorText}>{errors.value}</Text>
                        )}
                    </View>

                    {/* Documentação */}
                    <DocumentUploader
                        documents={documents}
                        onDocumentsChange={setDocuments}
                        maxDocuments={10}
                    />

                    {/* Botões */}
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="outlined"
                            onPress={() => navigation.goBack()}
                            style={styles.cancelButton}
                            disabled={isCreating}
                        >
                            Cancelar
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleSave}
                            style={styles.saveButton}
                            loading={isCreating}
                            disabled={isCreating}
                            textColor={AppColors.text}
                        >
                            {isCreating ? 'Salvando...' : 'Registrar'}
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    card: {
        margin: 16,
        marginBottom: 32,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
        color: AppColors.text,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: AppColors.gray,
        borderRadius: 8,
        backgroundColor: AppColors.white,
        minHeight: 56,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    inputError: {
        borderColor: AppColors.danger,
    },
    inputContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputText: {
        fontSize: 16,
        color: AppColors.text,
    },
    placeholderText: {
        color: AppColors.secondary,
    },
    textInput: {
        marginBottom: 8,
        backgroundColor: AppColors.white,
    },
    errorText: {
        color: AppColors.danger,
        fontSize: 12,
        marginTop: 4,
    },
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    serviceChip: {
        backgroundColor: AppColors.white,
        borderColor: AppColors.gray,
        borderWidth: 1,
    },
    selectedServiceChip: {
        backgroundColor: AppColors.primary,
    },
    serviceChipText: {
        color: AppColors.text,
        fontSize: 12,
    },
    selectedServiceChipText: {
        color: AppColors.white,
        fontSize: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        borderColor: AppColors.gray,
    },
    saveButton: {
        flex: 1,
        backgroundColor: AppColors.primary,
    },
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
        fontWeight: 'bold',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalPlaceholder: {
        width: 32,
    },
    vehicleList: {
        flex: 1,
        padding: 16,
    },
    vehicleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.gray,
        backgroundColor: AppColors.white,
        marginBottom: 8,
    },
    selectedVehicleItem: {
        borderColor: AppColors.primary,
        backgroundColor: `${AppColors.primary}10`,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleSubtitle: {
        color: AppColors.secondary,
        marginTop: 4,
    },
});
