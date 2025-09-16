import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { DatePickerModal, registerTranslation } from 'react-native-paper-dates';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getVehicles,
    useCreateInspectionMutation,
    useUpdateInspectionMutation
} from '../api/api';
import { RootStackParamList } from '../navigation/types';
import { Vehicle } from '../types';

// Registrar tradução português para DatePicker (simplificada)
registerTranslation('pt', {
    save: 'Salvar',
    selectSingle: 'Selecionar data',
    selectMultiple: 'Selecionar datas',
    selectRange: 'Selecionar período',
    notAccordingToDateFormat: (inputFormat: string) => `Formato de data deve ser ${inputFormat}`,
    mustBeHigherThan: (date: string) => `Deve ser posterior a ${date}`,
    mustBeLowerThan: (date: string) => `Deve ser anterior a ${date}`,
    mustBeBetween: (startDate: string, endDate: string) => `Deve estar entre ${startDate} - ${endDate}`,
    dateIsDisabled: 'Dia não permitido',
    previous: 'Anterior',
    next: 'Próximo',
    typeInDate: 'Digite a data',
    pickDateFromCalendar: 'Escolher data do calendário',
    close: 'Fechar',
    hour: 'hora',
    minute: 'minuto'
});

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionForm'>;

const InspectionFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const inspection = route.params?.inspection;
    const isEditing = !!inspection;

    const [formData, setFormData] = useState({
        vehicleId: inspection?.vehicleId || '',
        status: inspection?.status || 'Pendente',
        company: inspection?.company || '',
        date: inspection?.date ? new Date(inspection.date) : new Date(),
        fileUrl: inspection?.fileUrl || ''
    });

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const createMutation = useCreateInspectionMutation(userId);
    const updateMutation = useUpdateInspectionMutation(userId);

    const statusOptions = [
        { label: 'Pendente', value: 'Pendente' },
        { label: 'Aprovado', value: 'Aprovado' },
        { label: 'Aprovado com apontamentos', value: 'Aprovado com apontamentos' },
        { label: 'Não conforme', value: 'Não conforme' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                const userId = user?.userId;
                setUserId(userId || '');

                if (userId) {
                    const vehiclesData = await getVehicles(userId);
                    setVehicles((vehiclesData as Vehicle[]).filter((v: Vehicle) => v.active !== false));
                }
            } catch (error) {
                Alert.alert('Erro', 'Falha ao carregar dados');
            }
        };
        fetchData();
    }, []);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.vehicleId) newErrors.vehicleId = 'Selecione um veículo';
        if (!formData.status) newErrors.status = 'Selecione um status';
        if (!formData.company.trim()) newErrors.company = 'Nome da empresa é obrigatório';
        if (!formData.date) newErrors.date = 'Data é obrigatória';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const inspectionData = {
                vehicleId: formData.vehicleId,
                status: formData.status,
                company: formData.company,
                date: formData.date.toISOString(),
                fileUrl: formData.fileUrl,
                uploadedById: userId
            };

            if (isEditing && inspection?.id) {
                await updateMutation.mutateAsync({
                    id: inspection.id,
                    data: inspectionData
                });
                Alert.alert('Sucesso', 'Inspeção atualizada com sucesso!');
            } else {
                await createMutation.mutateAsync(inspectionData);
                Alert.alert('Sucesso', 'Inspeção criada com sucesso!');
            }

            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao salvar inspeção');
        } finally {
            setLoading(false);
        }
    };

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>
                    {isEditing ? 'Editar Inspeção' : 'Nova Inspeção'}
                </Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
                    {/* Seleção de Veículo */}
                    <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Veículo *</Text>
                    <Dropdown
                        style={{
                            height: 50,
                            borderColor: errors.vehicleId ? '#b00020' : '#ccc',
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            backgroundColor: '#fff',
                            marginBottom: 16
                        }}
                        data={vehicles.map(v => ({
                            label: `${v.licensePlate} - ${v.yearManufacture}`,
                            value: v.id
                        }))}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Selecione um veículo"
                        value={formData.vehicleId}
                        onChange={item => setFormData(prev => ({ ...prev, vehicleId: item.value }))}
                    />
                    {errors.vehicleId && <Text style={{ color: '#b00020', fontSize: 12, marginTop: -12, marginBottom: 8 }}>{errors.vehicleId}</Text>}

                    {/* Status */}
                    <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Status *</Text>
                    <Dropdown
                        style={{
                            height: 50,
                            borderColor: errors.status ? '#b00020' : '#ccc',
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            backgroundColor: '#fff',
                            marginBottom: 16
                        }}
                        data={statusOptions}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Selecione um status"
                        value={formData.status}
                        onChange={item => setFormData(prev => ({ ...prev, status: item.value }))}
                    />
                    {errors.status && <Text style={{ color: '#b00020', fontSize: 12, marginTop: -12, marginBottom: 8 }}>{errors.status}</Text>}

                    {/* Empresa */}
                    <TextInput
                        label="Empresa *"
                        value={formData.company}
                        onChangeText={text => setFormData(prev => ({ ...prev, company: text }))}
                        style={{ marginBottom: 16, backgroundColor: '#fff' }}
                        error={!!errors.company}
                    />
                    {errors.company && <Text style={{ color: '#b00020', fontSize: 12, marginTop: -12, marginBottom: 8 }}>{errors.company}</Text>}

                    {/* Data */}
                    <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Data da Inspeção *</Text>
                    <Button
                        mode="outlined"
                        onPress={() => setShowDateModal(true)}
                        style={{
                            marginBottom: 16,
                            borderColor: errors.date ? '#b00020' : '#ccc',
                            backgroundColor: '#fff'
                        }}
                    >
                        {formData.date.toLocaleDateString()}
                    </Button>
                    {errors.date && <Text style={{ color: '#b00020', fontSize: 12, marginTop: -12, marginBottom: 8 }}>{errors.date}</Text>}

                    {/* URL do Arquivo */}
                    <TextInput
                        label="URL do Arquivo"
                        value={formData.fileUrl}
                        onChangeText={text => setFormData(prev => ({ ...prev, fileUrl: text }))}
                        style={{ marginBottom: 24, backgroundColor: '#fff' }}
                        placeholder="https://exemplo.com/arquivo.pdf"
                    />

                    {/* Botões */}
                    <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 32 }}>
                        <Button
                            mode="outlined"
                            onPress={() => navigation.goBack()}
                            style={{ flex: 1 }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {isEditing ? 'Atualizar' : 'Criar'}
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* DatePicker Modal */}
            <DatePickerModal
                locale="pt"
                mode="single"
                visible={showDateModal}
                onDismiss={() => setShowDateModal(false)}
                date={formData.date}
                onConfirm={(params) => {
                    setShowDateModal(false);
                    if (params.date) {
                        setFormData(prev => ({ ...prev, date: params.date! }));
                    }
                }}
            />
        </SafeAreaView>
    );
};

export default InspectionFormScreen;