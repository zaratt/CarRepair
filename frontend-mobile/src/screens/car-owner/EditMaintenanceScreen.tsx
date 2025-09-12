import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';

import { UpdateMaintenanceRequest } from '../../api/maintenance.api';
import DocumentUploader, { DocumentFile } from '../../components/maintenance/DocumentUploader';
import { useMaintenanceContext } from '../../hooks/useMaintenanceContext';
import { useVehicleContext } from '../../hooks/useVehicleContext';
import { getMaintenanceById, updateMaintenance } from '../../services/maintenanceApi';
import { AppColors } from '../../styles/colors';
import { Maintenance } from '../../types/maintenance.types';

interface EditMaintenanceScreenProps {
    route: {
        params: {
            maintenanceId: string;
        };
    };
    navigation: any;
}

// 🎯 Componente principal da tela de edição
export default function EditMaintenanceScreen({ route, navigation }: EditMaintenanceScreenProps) {
    const { maintenanceId } = route.params;

    const {
        updateMaintenance: updateMaintenanceAPI,
        isUpdating,
        updateSuccess,
        updateError,
        isUsingRealAPI
    } = useMaintenanceContext();

    const { vehicles } = useVehicleContext();

    // Buscar dados da manutenção
    const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
    const [loading, setLoading] = useState(true);

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
    const [documents, setDocuments] = useState<DocumentFile[]>([]);

    // Validações
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // ✅ Serviços expandidos com categorias
    const COMMON_SERVICES = [
        // Motor e mecânica
        'Troca de óleo',
        'Troca de filtro',
        'Filtro de óleo',
        'Filtro de ar',
        'Filtro de combustível',
        'Velas de ignição',
        'Correia dentada',
        'Correia do alternador',
        'Bateria',
        'Radiador',
        'Bomba d\'água',
        'Termostato',
        'Válvulas',
        'Pistões',
        'Bielas',
        'Virabrequim',
        'Cabeçote',
        'Junta do cabeçote',

        // Suspensão e direção
        'Alinhamento',
        'Balanceamento',
        'Amortecedores',
        'Molas',
        'Suspensão',
        'Coxins',
        'Buchas',
        'Bieletas',
        'Bandeja',
        'Pivô',
        'Terminal de direção',
        'Caixa de direção',
        'Bomba hidráulica',
        'Fluido direção',

        // Freios
        'Freios dianteiros',
        'Freios traseiros',
        'Pastilhas de freio',
        'Discos de freio',
        'Tambor de freio',
        'Lonas de freio',
        'Cilindro de freio',
        'Fluido de freio',
        'Freio de mão',
        'Servo freio',

        // Pneus e rodas
        'Troca de pneus',
        'Calibragem',
        'Rodízio de pneus',
        'Conserto de pneu',
        'Válvulas',
        'Rodas',

        // Transmissão
        'Embreagem',
        'Disco de embreagem',
        'Platô',
        'Rolamento',
        'Cabo de embreagem',
        'Cilindro de embreagem',
        'Câmbio',
        'Óleo do câmbio',
        'Diferencial',
        'Cardã',
        'Homocinética',

        // Ar condicionado
        'Ar condicionado',
        'Compressor A/C',
        'Condensador',
        'Evaporador',
        'Filtro do ar condicionado',
        'Gás refrigerante',
        'Correia do compressor',

        // Sistema elétrico
        'Sistema elétrico',
        'Alternador',
        'Motor de partida',
        'Bobina de ignição',
        'Cabos de vela',
        'Fusíveis',
        'Relés',
        'Fiação',
        'Faróis',
        'Lanternas',
        'Pisca-pisca',
        'Bateria auxiliar',

        // Escapamento
        'Escapamento',
        'Silencioso',
        'Coletor de escape',
        'Catalisador',
        'Sonda lambda',

        // Outros
        'Revisão geral',
        'Lavagem',
        'Enceramento',
        'Diagnóstico',
        'Scanner',
        'Teste de emissões',
        'Inspeção técnica',
        'Documentação',
    ];

    // Carregar dados da manutenção
    useEffect(() => {
        const loadMaintenance = () => {
            const maintenanceData = getMaintenanceById(maintenanceId);
            if (maintenanceData) {
                setMaintenance(maintenanceData);

                // Pré-popular o formulário
                setSelectedVehicle(maintenanceData.vehicleId);
                setSelectedServices(maintenanceData.services);
                setDate(new Date(maintenanceData.date));
                setCurrentKm(maintenanceData.currentKm.toString());
                setWorkshopName(maintenanceData.workshop.name);
                setWorkshopCnpj(maintenanceData.workshop.cnpj || '');
                setWorkshopAddress(maintenanceData.workshop.address || '');
                setValue(maintenanceData.value.toString());
                // Não há campo description na interface Maintenance

                // Converter URLs de documentos para DocumentFile
                const documentsFiles: DocumentFile[] = maintenanceData.documents.map((url, index) => ({
                    id: `doc_${index}`,
                    uri: url,
                    name: `documento_${index + 1}.${url.includes('pdf') ? 'pdf' : 'jpg'}`,
                    type: url.includes('pdf') ? 'pdf' : 'image',
                    category: 'outros'
                }));
                setDocuments(documentsFiles);
            } else {
                Alert.alert('Erro', 'Manutenção não encontrada');
                navigation.goBack();
            }
            setLoading(false);
        };

        loadMaintenance();
    }, [maintenanceId, navigation]);

    // ✅ Configurar header com botão cancelar
    useEffect(() => {
        navigation.setOptions({
            title: 'Editar Manutenção',
            headerLeft: () => (
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleCancel}
                >
                    <MaterialCommunityIcons
                        name="close"
                        size={24}
                        color={AppColors.primary}
                    />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // ✅ Função para cancelar edição
    const handleCancel = () => {
        Alert.alert(
            'Cancelar Edição',
            'Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.',
            [
                { text: 'Continuar Editando', style: 'cancel' },
                {
                    text: 'Cancelar',
                    style: 'destructive',
                    onPress: () => navigation.goBack()
                }
            ]
        );
    };

    // ✅ Validações do formulário
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!selectedVehicle) {
            newErrors.vehicle = 'Selecione um veículo';
        }

        if (selectedServices.length === 0) {
            newErrors.services = 'Selecione pelo menos um serviço';
        }

        // ✅ Validação de data (não pode ser futura e não pode ser anterior a 60 dias)
        const today = new Date();
        const maxPastDate = new Date(today);
        maxPastDate.setDate(today.getDate() - 60);

        if (date > today) {
            newErrors.date = 'A data não pode ser futura';
        } else if (date < maxPastDate) {
            newErrors.date = 'A data não pode ser anterior a 60 dias';
        }

        if (!currentKm || isNaN(Number(currentKm)) || Number(currentKm) <= 0) {
            newErrors.currentKm = 'Quilometragem deve ser um número válido maior que zero';
        }

        if (!workshopName.trim()) {
            newErrors.workshopName = 'Nome da oficina é obrigatório';
        }

        // ✅ Validação de CNPJ (opcional, mas se preenchido deve estar correto)
        if (workshopCnpj.trim()) {
            const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
            if (!cnpjRegex.test(workshopCnpj)) {
                newErrors.workshopCnpj = 'CNPJ deve estar no formato 00.000.000/0000-00';
            }
        }

        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
            newErrors.value = 'Valor deve ser um número válido maior que zero';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ Função para salvar alterações
    const handleSaveChanges = async () => {
        if (!validateForm()) {
            Alert.alert('Erro de Validação', 'Por favor, corrija os campos destacados');
            return;
        }

        if (!maintenance) return;

        try {
            // ✅ Verificar se todos os documentos foram enviados ao servidor
            const pendingUploads = documents.filter(doc => doc.isUploading);
            if (pendingUploads.length > 0) {
                Alert.alert(
                    'Upload em Andamento',
                    'Aguarde todos os documentos serem enviados antes de salvar as alterações.'
                );
                return;
            }

            const updateData: Partial<Maintenance> = {
                vehicleId: selectedVehicle,
                services: selectedServices,
                date: date.toISOString(),
                currentKm: Number(currentKm),
                workshop: {
                    name: workshopName,
                    cnpj: workshopCnpj,
                    address: workshopAddress,
                },
                value: Number(value),
                documents: documents.map(doc => doc.uploadedUrl || doc.uri), // ✅ Usar URL do servidor
                updatedAt: new Date().toISOString(),
            };

            if (isUsingRealAPI && updateMaintenanceAPI) {
                // Usar API real
                await updateMaintenanceAPI(maintenanceId, updateData as UpdateMaintenanceRequest);
            } else {
                // Usar mock
                const updatedMaintenance = updateMaintenance(maintenanceId, updateData);
                if (!updatedMaintenance) {
                    throw new Error('Falha ao atualizar manutenção');
                }
            }

            Alert.alert(
                'Sucesso',
                'Manutenção atualizada com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao atualizar manutenção:', error);
            Alert.alert('Erro', 'Não foi possível atualizar a manutenção. Tente novamente.');
        }
    };

    // ✅ Renderizar loading
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text variant="bodyMedium">Carregando dados da manutenção...</Text>
            </View>
        );
    }

    if (!maintenance) {
        return (
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={48} color={AppColors.danger} />
                <Text variant="headlineSmall" style={styles.errorTitle}>
                    Manutenção não encontrada
                </Text>
                <Button mode="contained" onPress={() => navigation.goBack()}>
                    Voltar
                </Button>
            </View>
        );
    }

    // ✅ Renderizar seletor de veículo
    const renderVehicleSelector = () => {
        const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Veículo
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.vehicleSelector,
                            errors.vehicle && styles.inputError
                        ]}
                        onPress={() => setShowVehicleModal(true)}
                    >
                        <View style={styles.vehicleSelectorContent}>
                            <MaterialCommunityIcons
                                name="car"
                                size={20}
                                color={selectedVehicleData ? AppColors.primary : AppColors.text}
                            />
                            <Text
                                variant="bodyMedium"
                                style={[
                                    styles.vehicleSelectorText,
                                    !selectedVehicleData && styles.placeholder
                                ]}
                            >
                                {selectedVehicleData
                                    ? `${selectedVehicleData.brand?.name} ${selectedVehicleData.model?.name} - ${selectedVehicleData.licensePlate}`
                                    : 'Selecionar veículo'
                                }
                            </Text>
                            <MaterialCommunityIcons
                                name="chevron-down"
                                size={20}
                                color={AppColors.text}
                            />
                        </View>
                    </TouchableOpacity>

                    {errors.vehicle && (
                        <Text style={styles.errorText}>{errors.vehicle}</Text>
                    )}
                </Card.Content>
            </Card>
        );
    };

    // ✅ Modal de seleção de veículo
    const renderVehicleModal = () => (
        <Modal
            visible={showVehicleModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowVehicleModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text variant="headlineSmall">Selecionar Veículo</Text>
                        <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={AppColors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={vehicles}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.vehicleItem,
                                    selectedVehicle === item.id && styles.vehicleItemSelected
                                ]}
                                onPress={() => {
                                    setSelectedVehicle(item.id);
                                    setShowVehicleModal(false);
                                    setErrors(prev => ({ ...prev, vehicle: '' }));
                                }}
                            >
                                <MaterialCommunityIcons
                                    name="car"
                                    size={24}
                                    color={selectedVehicle === item.id ? AppColors.primary : AppColors.text}
                                />
                                <View style={styles.vehicleItemInfo}>
                                    <Text variant="titleMedium">
                                        {item.brand?.name} {item.model?.name}
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.vehicleItemDetails}>
                                        {item.modelYear} • {item.licensePlate}
                                    </Text>
                                </View>
                                {selectedVehicle === item.id && (
                                    <MaterialCommunityIcons
                                        name="check"
                                        size={20}
                                        color={AppColors.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    // ✅ Renderizar seletor de serviços
    const renderServicesSelector = () => (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Serviços Realizados
                </Text>

                <Text variant="bodySmall" style={styles.sectionDescription}>
                    Selecione os serviços que foram realizados na manutenção:
                </Text>

                <View style={styles.servicesContainer}>
                    {COMMON_SERVICES.map((service) => (
                        <Chip
                            key={service}
                            selected={selectedServices.includes(service)}
                            onPress={() => {
                                if (selectedServices.includes(service)) {
                                    setSelectedServices(prev => prev.filter(s => s !== service));
                                } else {
                                    setSelectedServices(prev => [...prev, service]);
                                    setErrors(prev => ({ ...prev, services: '' }));
                                }
                            }}
                            style={[
                                styles.serviceChip,
                                selectedServices.includes(service) && styles.serviceChipSelected
                            ]}
                            textStyle={[
                                styles.serviceChipText,
                                selectedServices.includes(service) && styles.serviceChipTextSelected
                            ]}
                        >
                            {service}
                        </Chip>
                    ))}
                </View>

                {selectedServices.length > 0 && (
                    <View style={styles.selectedServicesInfo}>
                        <Text variant="bodySmall" style={styles.selectedServicesText}>
                            {selectedServices.length} serviço(s) selecionado(s)
                        </Text>
                    </View>
                )}

                {errors.services && (
                    <Text style={styles.errorText}>{errors.services}</Text>
                )}
            </Card.Content>
        </Card>
    );

    // ✅ Renderizar seletor de data
    const renderDateSelector = () => (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Data da Manutenção
                </Text>

                <TouchableOpacity
                    style={[
                        styles.dateSelector,
                        errors.date && styles.inputError
                    ]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <MaterialCommunityIcons name="calendar" size={20} color={AppColors.primary} />
                    <Text variant="bodyMedium" style={styles.dateSelectorText}>
                        {date.toLocaleDateString('pt-BR')}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={AppColors.text} />
                </TouchableOpacity>

                {errors.date && (
                    <Text style={styles.errorText}>{errors.date}</Text>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                                setDate(selectedDate);
                                setErrors(prev => ({ ...prev, date: '' }));
                            }
                        }}
                        maximumDate={new Date()}
                        minimumDate={new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)} // 60 dias atrás
                    />
                )}
            </Card.Content>
        </Card>
    );

    // ✅ Renderizar campos de detalhes
    const renderDetailsFields = () => (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Detalhes da Manutenção
                </Text>

                <TextInput
                    label="Quilometragem Atual"
                    value={currentKm}
                    onChangeText={(text) => {
                        setCurrentKm(text);
                        setErrors(prev => ({ ...prev, currentKm: '' }));
                    }}
                    keyboardType="numeric"
                    style={styles.input}
                    error={!!errors.currentKm}
                    left={<TextInput.Icon icon="speedometer" />}
                />
                {errors.currentKm && (
                    <Text style={styles.errorText}>{errors.currentKm}</Text>
                )}

                <TextInput
                    label="Nome da Oficina"
                    value={workshopName}
                    onChangeText={(text) => {
                        setWorkshopName(text);
                        setErrors(prev => ({ ...prev, workshopName: '' }));
                    }}
                    style={styles.input}
                    error={!!errors.workshopName}
                    left={<TextInput.Icon icon="store" />}
                />
                {errors.workshopName && (
                    <Text style={styles.errorText}>{errors.workshopName}</Text>
                )}

                <TextInput
                    label="CNPJ da Oficina (opcional)"
                    value={workshopCnpj}
                    onChangeText={(text) => {
                        setWorkshopCnpj(text);
                        setErrors(prev => ({ ...prev, workshopCnpj: '' }));
                    }}
                    placeholder="00.000.000/0000-00"
                    style={styles.input}
                    error={!!errors.workshopCnpj}
                    left={<TextInput.Icon icon="identifier" />}
                />
                {errors.workshopCnpj && (
                    <Text style={styles.errorText}>{errors.workshopCnpj}</Text>
                )}

                <TextInput
                    label="Endereço da Oficina (opcional)"
                    value={workshopAddress}
                    onChangeText={setWorkshopAddress}
                    style={styles.input}
                    left={<TextInput.Icon icon="map-marker" />}
                />

                <TextInput
                    label="Valor Total"
                    value={value}
                    onChangeText={(text) => {
                        setValue(text);
                        setErrors(prev => ({ ...prev, value: '' }));
                    }}
                    keyboardType="numeric"
                    style={styles.input}
                    error={!!errors.value}
                    left={<TextInput.Icon icon="currency-brl" />}
                />
                {errors.value && (
                    <Text style={styles.errorText}>{errors.value}</Text>
                )}
            </Card.Content>
        </Card>
    );

    // ✅ Renderizar uploader de documentos
    const renderDocumentUploader = () => (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Documentos Comprobatórios
                </Text>

                <Text variant="bodySmall" style={styles.sectionDescription}>
                    Adicione fotos, notas fiscais ou outros documentos que comprovem a manutenção:
                </Text>

                <DocumentUploader
                    documents={documents}
                    onDocumentsChange={setDocuments}
                    maxDocuments={10}
                />
            </Card.Content>
        </Card>
    );

    // ✅ Renderizar botões de ação
    const renderActionButtons = () => (
        <View style={styles.actionButtons}>
            <Button
                mode="outlined"
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
                labelStyle={styles.cancelButtonText}
            >
                Cancelar
            </Button>

            <Button
                mode="contained"
                onPress={handleSaveChanges}
                loading={isUpdating}
                disabled={isUpdating}
                style={[styles.button, styles.saveButton]}
                labelStyle={styles.saveButtonText}
            >
                Salvar Alterações
            </Button>
        </View>
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
                {renderDateSelector()}
                {renderDetailsFields()}
                {renderDocumentUploader()}
                {renderActionButtons()}
            </ScrollView>

            {renderVehicleModal()}
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
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
        color: AppColors.danger,
    },
    headerButton: {
        marginLeft: 16,
        padding: 8,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    sectionTitle: {
        marginBottom: 12,
        color: AppColors.text,
        fontWeight: '600',
    },
    sectionDescription: {
        marginBottom: 16,
        color: AppColors.text,
        opacity: 0.7,
        lineHeight: 20,
    },

    // Vehicle selector styles
    vehicleSelector: {
        borderWidth: 1,
        borderColor: AppColors.gray,
        borderRadius: 8,
        padding: 12,
        backgroundColor: AppColors.white,
    },
    vehicleSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleSelectorText: {
        flex: 1,
        marginLeft: 12,
        color: AppColors.text,
    },
    placeholder: {
        opacity: 0.6,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray,
    },
    vehicleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray,
    },
    vehicleItemSelected: {
        backgroundColor: '#f0f9ff',
    },
    vehicleItemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    vehicleItemDetails: {
        color: AppColors.text,
        opacity: 0.7,
        marginTop: 2,
    },

    // Services styles
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    serviceChip: {
        backgroundColor: AppColors.gray,
        borderColor: AppColors.gray,
    },
    serviceChipSelected: {
        backgroundColor: AppColors.primary,
    },
    serviceChipText: {
        color: AppColors.text,
        fontSize: 12,
    },
    serviceChipTextSelected: {
        color: AppColors.white,
    },
    selectedServicesInfo: {
        padding: 8,
        backgroundColor: '#f0f9ff',
        borderRadius: 6,
        marginTop: 8,
    },
    selectedServicesText: {
        color: AppColors.primary,
        textAlign: 'center',
    },

    // Date selector styles
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AppColors.gray,
        borderRadius: 8,
        padding: 12,
        backgroundColor: AppColors.white,
    },
    dateSelectorText: {
        flex: 1,
        marginLeft: 12,
        color: AppColors.text,
    },

    // Input styles
    input: {
        marginBottom: 12,
        backgroundColor: AppColors.white,
    },
    inputError: {
        borderColor: AppColors.danger,
    },
    errorText: {
        color: AppColors.danger,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },

    // Action buttons styles
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
    },
    cancelButton: {
        borderColor: AppColors.gray,
    },
    cancelButtonText: {
        color: AppColors.text,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: AppColors.primary,
    },
    saveButtonText: {
        color: '#000000', // ✅ Texto preto conforme solicitado
        fontWeight: '600',
    },
});
