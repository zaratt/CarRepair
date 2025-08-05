import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createInspection } from '../../data/mockInspections';
import { mockVehicles } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { BRAZILIAN_STATES, INSPECTION_RESULTS, INSPECTION_TYPES } from '../../types/inspection.types';

interface AddInspectionScreenProps {
    navigation: any;
}

interface DocumentFile {
    uri: string;
    name: string;
    type: string;
}

export default function AddInspectionScreen({ navigation }: AddInspectionScreenProps) {
    // Estados do formulário
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [inspectionType, setInspectionType] = useState<'regular' | 'transfer' | 'special'>('regular');
    const [inspectionDate, setInspectionDate] = useState(new Date());
    const [expiryDate, setExpiryDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
    const [currentKm, setCurrentKm] = useState('');
    const [centerName, setCenterName] = useState('');
    const [centerCode, setCenterCode] = useState('');
    const [centerAddress, setCenterAddress] = useState('');
    const [centerCity, setCenterCity] = useState('');
    const [centerState, setCenterState] = useState<string>('SP');
    const [inspectionResult, setInspectionResult] = useState<'approved' | 'rejected' | 'conditional'>('approved');
    const [observations, setObservations] = useState('');
    const [defects, setDefects] = useState<string[]>([]);
    const [newDefect, setNewDefect] = useState('');
    const [cost, setCost] = useState('');
    const [documents, setDocuments] = useState<DocumentFile[]>([]);

    // Estados de UI
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showInspectionDatePicker, setShowInspectionDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Formatação de data
    const formatDatePtBr = (date: Date) => {
        return date.toLocaleDateString('pt-BR');
    };

    // Handler para mudança de data de vistoria
    const onInspectionDateChange = (event: any, selectedDate?: Date) => {
        setShowInspectionDatePicker(false);
        if (selectedDate) {
            setInspectionDate(selectedDate);
            // Automaticamente definir data de expiração (1 ano depois)
            const newExpiryDate = new Date(selectedDate);
            newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
            setExpiryDate(newExpiryDate);
        }
    };

    // Handler para mudança de data de expiração
    const onExpiryDateChange = (event: any, selectedDate?: Date) => {
        setShowExpiryDatePicker(false);
        if (selectedDate) {
            setExpiryDate(selectedDate);
        }
    };

    // Formatação de valor monetário
    const formatCurrency = (text: string) => {
        const numbers = text.replace(/[^0-9]/g, '');
        const value = parseFloat(numbers) / 100;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Formatação de KM
    const formatKm = (text: string) => {
        const numbers = text.replace(/[^0-9]/g, '');
        return new Intl.NumberFormat('pt-BR').format(parseInt(numbers) || 0);
    };

    // Adicionar defeito
    const addDefect = () => {
        if (newDefect.trim() && !defects.includes(newDefect.trim())) {
            setDefects([...defects, newDefect.trim()]);
            setNewDefect('');
        }
    };

    // Remover defeito
    const removeDefect = (defect: string) => {
        setDefects(defects.filter(d => d !== defect));
    };

    // Seleção de documentos
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const document: DocumentFile = {
                    uri: asset.uri,
                    name: asset.name || 'documento',
                    type: asset.mimeType || 'application/pdf'
                };
                setDocuments([...documents, document]);
            }
        } catch (error) {
            console.error('Erro ao selecionar documento:', error);
            Alert.alert('Erro', 'Não foi possível selecionar o documento');
        }
    };

    // Seleção de foto
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const photo: DocumentFile = {
                    uri: asset.uri,
                    name: `foto_vistoria_${documents.length + 1}.jpg`,
                    type: 'image/jpeg'
                };
                setDocuments([...documents, photo]);
            }
        } catch (error) {
            console.error('Erro ao selecionar foto:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a foto');
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

        if (!currentKm.trim()) {
            newErrors.currentKm = 'Informe a quilometragem atual';
        } else if (isNaN(Number(currentKm.replace(/\./g, '')))) {
            newErrors.currentKm = 'Quilometragem deve ser um número válido';
        }

        if (!centerName.trim()) {
            newErrors.centerName = 'Informe o nome do centro de vistoria';
        }

        if (!centerCode.trim()) {
            newErrors.centerCode = 'Informe o código do centro de vistoria';
        }

        if (!centerCity.trim()) {
            newErrors.centerCity = 'Informe a cidade do centro de vistoria';
        }

        if (!cost.trim()) {
            newErrors.cost = 'Informe o valor da vistoria';
        } else if (isNaN(Number(cost.replace(/[^0-9]/g, '')) / 100)) {
            newErrors.cost = 'Valor deve ser um número válido';
        }

        // Validar se data de expiração é posterior à data de vistoria
        if (expiryDate <= inspectionDate) {
            newErrors.expiryDate = 'Data de expiração deve ser posterior à data da vistoria';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Salvar vistoria
    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('Erro', 'Por favor, corrija os campos obrigatórios');
            return;
        }

        setLoading(true);

        try {
            // Simular delay de API
            await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));

            const selectedVehicleData = mockVehicles.find(v => v.id === selectedVehicle);
            if (!selectedVehicleData) {
                throw new Error('Veículo não encontrado');
            }

            const inspectionData = {
                vehicleId: selectedVehicle,
                vehicleBrand: selectedVehicleData.brand,
                vehicleModel: selectedVehicleData.model,
                vehiclePlate: selectedVehicleData.plate,
                type: inspectionType,
                inspectionDate: inspectionDate.toISOString(),
                expiryDate: expiryDate.toISOString(),
                currentKm: Number(currentKm.replace(/\./g, '')),
                inspectionCenter: {
                    name: centerName,
                    code: centerCode,
                    address: centerAddress,
                    city: centerCity,
                    state: centerState,
                },
                result: inspectionResult,
                observations: observations || undefined,
                defects: defects.length > 0 ? defects : undefined,
                cost: Number(cost.replace(/[^0-9]/g, '')) / 100,
                attachments: documents.map((doc, index) => ({
                    id: `att_${Date.now()}_${index}`,
                    type: doc.type.startsWith('image/') ? 'photo' as const : 'pdf' as const,
                    url: doc.uri,
                    name: doc.name,
                    uploadedAt: new Date().toISOString(),
                })),
                userId: 'user1',
            };

            const newInspection = createInspection(inspectionData);

            console.log('✅ Vistoria criada:', newInspection);

            Alert.alert(
                'Sucesso!',
                `Vistoria registrada com sucesso!\n\nCódigo de validação: ${newInspection.validationCode}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );

        } catch (error) {
            console.error('❌ Erro ao salvar vistoria:', error);
            Alert.alert('Erro', 'Não foi possível salvar a vistoria');
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
                        onPress={() => setShowVehicleModal(true)}
                        style={[styles.selector, errors.vehicle && styles.selectorError]}
                    >
                        <View style={styles.selectorContent}>
                            <Text variant="bodySmall" style={styles.selectorLabel}>
                                Veículo
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={[
                                    styles.selectorText,
                                    !selectedVehicle && styles.selectorPlaceholder
                                ]}
                                numberOfLines={1}
                            >
                                {vehicleLabel}
                            </Text>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-down"
                            size={20}
                            color="#666"
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
                        <SafeAreaView style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text variant="headlineSmall" style={styles.modalTitle}>
                                    Selecionar Veículo
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowVehicleModal(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color="#666" />
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
                        </SafeAreaView>
                    </Modal>
                </Card.Content>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Seletor de Veículo */}
                {renderVehicleSelector()}

                {/* Dados da Vistoria */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="clipboard-check" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Dados da Vistoria
                            </Text>
                        </View>

                        {/* Tipo de Vistoria */}
                        <TouchableOpacity
                            onPress={() => setShowTypeModal(true)}
                            style={styles.selector}
                        >
                            <View style={styles.selectorContent}>
                                <Text variant="bodySmall" style={styles.selectorLabel}>
                                    Tipo de Vistoria
                                </Text>
                                <Text variant="bodyMedium" style={styles.selectorText}>
                                    {INSPECTION_TYPES[inspectionType]}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        {/* Datas */}
                        <View style={styles.dateContainer}>
                            <TouchableOpacity
                                onPress={() => setShowInspectionDatePicker(true)}
                                style={[styles.dateSelector, { flex: 1, marginRight: 8 }]}
                            >
                                <Text variant="bodySmall" style={styles.selectorLabel}>
                                    Data da Vistoria
                                </Text>
                                <Text variant="bodyMedium" style={styles.selectorText}>
                                    {formatDatePtBr(inspectionDate)}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowExpiryDatePicker(true)}
                                style={[styles.dateSelector, { flex: 1, marginLeft: 8 }]}
                            >
                                <Text variant="bodySmall" style={styles.selectorLabel}>
                                    Data de Expiração
                                </Text>
                                <Text variant="bodyMedium" style={styles.selectorText}>
                                    {formatDatePtBr(expiryDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {errors.expiryDate && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.expiryDate}
                            </Text>
                        )}

                        {/* KM Atual */}
                        <TextInput
                            label="Quilometragem Atual"
                            value={currentKm}
                            onChangeText={(text) => setCurrentKm(formatKm(text))}
                            keyboardType="numeric"
                            style={styles.input}
                            error={!!errors.currentKm}
                            left={<TextInput.Icon icon="speedometer" />}
                        />
                        {errors.currentKm && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.currentKm}
                            </Text>
                        )}
                    </Card.Content>
                </Card>

                {/* Centro de Vistoria */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="office-building" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Centro de Vistoria
                            </Text>
                        </View>

                        <TextInput
                            label="Nome do Centro *"
                            value={centerName}
                            onChangeText={setCenterName}
                            style={styles.input}
                            error={!!errors.centerName}
                            left={<TextInput.Icon icon="office-building" />}
                        />
                        {errors.centerName && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.centerName}
                            </Text>
                        )}

                        <TextInput
                            label="Código do Centro *"
                            value={centerCode}
                            onChangeText={setCenterCode}
                            style={styles.input}
                            error={!!errors.centerCode}
                            left={<TextInput.Icon icon="identifier" />}
                        />
                        {errors.centerCode && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.centerCode}
                            </Text>
                        )}

                        <TextInput
                            label="Endereço"
                            value={centerAddress}
                            onChangeText={setCenterAddress}
                            style={styles.input}
                            left={<TextInput.Icon icon="map-marker" />}
                        />

                        <View style={styles.cityStateContainer}>
                            <TextInput
                                label="Cidade *"
                                value={centerCity}
                                onChangeText={setCenterCity}
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                error={!!errors.centerCity}
                                left={<TextInput.Icon icon="city" />}
                            />

                            <TouchableOpacity
                                onPress={() => setShowStateModal(true)}
                                style={[styles.stateSelector, errors.centerState && styles.selectorError]}
                            >
                                <Text variant="bodySmall" style={styles.selectorLabel}>
                                    Estado
                                </Text>
                                <Text variant="bodyMedium" style={styles.selectorText}>
                                    {centerState}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {errors.centerCity && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.centerCity}
                            </Text>
                        )}
                    </Card.Content>
                </Card>

                {/* Resultado da Vistoria */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="check-circle" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Resultado da Vistoria
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowResultModal(true)}
                            style={styles.selector}
                        >
                            <View style={styles.selectorContent}>
                                <Text variant="bodySmall" style={styles.selectorLabel}>
                                    Resultado
                                </Text>
                                <Text variant="bodyMedium" style={styles.selectorText}>
                                    {INSPECTION_RESULTS[inspectionResult]}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        <TextInput
                            label="Valor da Vistoria *"
                            value={cost}
                            onChangeText={(text) => setCost(formatCurrency(text))}
                            keyboardType="numeric"
                            style={styles.input}
                            error={!!errors.cost}
                            left={<TextInput.Icon icon="currency-usd" />}
                        />
                        {errors.cost && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {errors.cost}
                            </Text>
                        )}

                        <TextInput
                            label="Observações"
                            value={observations}
                            onChangeText={setObservations}
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            left={<TextInput.Icon icon="note-text" />}
                        />

                        {/* Defeitos (só se resultado for condicional ou rejeitado) */}
                        {(inspectionResult === 'conditional' || inspectionResult === 'rejected') && (
                            <View style={styles.defectContainer}>
                                <Text variant="titleSmall" style={styles.defectTitle}>
                                    Defeitos Encontrados:
                                </Text>

                                <View style={styles.defectInputContainer}>
                                    <TextInput
                                        label="Novo defeito"
                                        value={newDefect}
                                        onChangeText={setNewDefect}
                                        style={styles.defectInput}
                                        onSubmitEditing={addDefect}
                                    />
                                    <Button
                                        mode="contained"
                                        onPress={addDefect}
                                        style={styles.addDefectButton}
                                        buttonColor={AppColors.primary}
                                        disabled={!newDefect.trim()}
                                    >
                                        +
                                    </Button>
                                </View>

                                <View style={styles.defectsList}>
                                    {defects.map((defect, index) => (
                                        <Chip
                                            key={index}
                                            style={styles.defectChip}
                                            onClose={() => removeDefect(defect)}
                                        >
                                            {defect}
                                        </Chip>
                                    ))}
                                </View>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Documentos e Fotos */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="paperclip" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Documentos e Fotos
                            </Text>
                        </View>

                        <View style={styles.documentButtons}>
                            <Button
                                mode="outlined"
                                onPress={pickDocument}
                                style={styles.documentButton}
                                icon="file-pdf-box"
                            >
                                PDF
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={pickImage}
                                style={styles.documentButton}
                                icon="camera"
                            >
                                Foto
                            </Button>
                        </View>

                        {documents.length > 0 && (
                            <View style={styles.documentsList}>
                                {documents.map((doc, index) => (
                                    <View key={index} style={styles.documentItem}>
                                        <MaterialCommunityIcons
                                            name={doc.type.startsWith('image/') ? 'image' : 'file-pdf-box'}
                                            size={24}
                                            color={doc.type.startsWith('image/') ? '#4CAF50' : '#F44336'}
                                        />
                                        <Text variant="bodyMedium" style={styles.documentName}>
                                            {doc.name}
                                        </Text>
                                        <Pressable
                                            onPress={() => removeDocument(index)}
                                            style={styles.removeDocumentButton}
                                        >
                                            <MaterialCommunityIcons name="close" size={20} color="#666" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Modais */}
                {/* Modal de Tipo de Vistoria */}
                <Modal
                    visible={showTypeModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowTypeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text variant="titleLarge" style={styles.modalTitle}>
                                Tipo de Vistoria
                            </Text>
                            {Object.entries(INSPECTION_TYPES).map(([key, label]) => (
                                <Pressable
                                    key={key}
                                    style={[
                                        styles.modalOption,
                                        inspectionType === key && styles.selectedModalOption
                                    ]}
                                    onPress={() => {
                                        setInspectionType(key as any);
                                        setShowTypeModal(false);
                                    }}
                                >
                                    <Text variant="bodyLarge">{label as string}</Text>
                                    {inspectionType === key && (
                                        <MaterialCommunityIcons name="check" size={20} color={AppColors.primary} />
                                    )}
                                </Pressable>
                            ))}
                            <Button onPress={() => setShowTypeModal(false)}>Cancelar</Button>
                        </View>
                    </View>
                </Modal>

                {/* Modal de Resultado */}
                <Modal
                    visible={showResultModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowResultModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text variant="titleLarge" style={styles.modalTitle}>
                                Resultado da Vistoria
                            </Text>
                            {Object.entries(INSPECTION_RESULTS).map(([key, label]) => (
                                <Pressable
                                    key={key}
                                    style={[
                                        styles.modalOption,
                                        inspectionResult === key && styles.selectedModalOption
                                    ]}
                                    onPress={() => {
                                        setInspectionResult(key as any);
                                        setShowResultModal(false);
                                    }}
                                >
                                    <Text variant="bodyLarge">{label as string}</Text>
                                    {inspectionResult === key && (
                                        <MaterialCommunityIcons name="check" size={20} color={AppColors.primary} />
                                    )}
                                </Pressable>
                            ))}
                            <Button onPress={() => setShowResultModal(false)}>Cancelar</Button>
                        </View>
                    </View>
                </Modal>

                {/* Modal de Estado */}
                <Modal
                    visible={showStateModal}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setShowStateModal(false)}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text variant="headlineSmall" style={styles.modalTitle}>
                                Selecionar Estado
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowStateModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={BRAZILIAN_STATES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.vehicleOption,
                                        centerState === item && styles.selectedVehicleOption
                                    ]}
                                    onPress={() => {
                                        setCenterState(item);
                                        setShowStateModal(false);
                                    }}
                                >
                                    <Text variant="titleMedium" style={styles.vehicleTitle}>
                                        {item}
                                    </Text>
                                    {centerState === item && (
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
                    </SafeAreaView>
                </Modal>

                {/* Date Pickers */}
                {showInspectionDatePicker && (
                    <DateTimePicker
                        value={inspectionDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onInspectionDateChange}
                        maximumDate={new Date()}
                    />
                )}

                {showExpiryDatePicker && (
                    <DateTimePicker
                        value={expiryDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onExpiryDateChange}
                        minimumDate={inspectionDate}
                    />
                )}

                {/* Espaço extra para o FAB */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Botão de Salvar */}
            <View style={styles.saveButtonContainer}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    disabled={loading}
                    style={styles.saveButton}
                    buttonColor={AppColors.primary}
                >
                    {loading ? 'Salvando...' : 'Salvar Vistoria'}
                </Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#222',
    },
    selector: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    selectorError: {
        borderColor: '#F44336',
    },
    selectorContent: {
        flex: 1,
    },
    selectorLabel: {
        color: '#666',
        marginBottom: 4,
    },
    selectorText: {
        color: '#222',
        fontSize: 16,
    },
    selectorPlaceholder: {
        color: '#999',
    },
    dateContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    dateSelector: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    defectContainer: {
        marginBottom: 16,
    },
    defectInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    defectInput: {
        flex: 1,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    addDefectButton: {
        borderRadius: 8,
    },
    defectsList: {
        marginTop: 8,
    },
    defectChip: {
        marginRight: 8,
        marginBottom: 8,
    },
    documentsContainer: {
        marginBottom: 16,
    },
    documentButtons: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    documentButton: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    documentsList: {
        marginTop: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 8,
    },
    documentName: {
        flex: 1,
        marginLeft: 8,
        color: '#333',
    },
    removeDocumentButton: {
        padding: 4,
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 16,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontWeight: '600',
        color: '#222',
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
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
    },
    selectedVehicleOption: {
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: AppColors.primary,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleTitle: {
        fontWeight: '600',
        color: '#222',
        marginBottom: 4,
    },
    vehiclePlate: {
        color: '#666',
        marginBottom: 2,
    },
    vehicleKm: {
        color: '#999',
    },
    separator: {
        height: 8,
    },
    bottomSpacer: {
        height: 80,
    },
    saveButtonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    saveButton: {
        borderRadius: 8,
        paddingVertical: 4,
    },
    cityStateContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    stateSelector: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        width: 80,
        marginLeft: 8,
    },
    defectTitle: {
        marginBottom: 8,
        fontWeight: '600',
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        minWidth: 280,
        maxWidth: 320,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    selectedModalOption: {
        backgroundColor: '#E3F2FD',
    },
});
