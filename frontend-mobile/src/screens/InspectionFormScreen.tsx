import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, IconButton, Menu, Text, TextInput } from 'react-native-paper';
import { DatePickerModal, registerTranslation } from 'react-native-paper-dates';
import {
    getVehicles,
    uploadInspectionAttachment,
    useCreateInspectionMutation,
    useDeleteInspectionAttachmentMutation,
    useInspectionAttachmentsQuery,
    useUpdateInspectionMutation,
    useUploadInspectionAttachmentMutation
} from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { InspectionAttachment, Vehicle } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionForm'>;

const InspectionFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const inspection = route.params?.inspection;
    const [formData, setFormData] = useState({
        vehicleId: '',
        brand: '',
        model: '',
        licensePlate: '',
        status: '',
        company: '',
        date: new Date(),
    });
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    // Estado de anexos agora aceita id opcional
    const [attachments, setAttachments] = useState<Array<{ uri: string; name: string; type: string; id?: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [showVehicleMenu, setShowVehicleMenu] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const statusOptions = [
        { label: 'Aprovado', value: 'Aprovado' },
        { label: 'Aprovado com apontamentos', value: 'Aprovado com apontamentos' },
        { label: 'Não conforme', value: 'Não conforme' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                let userId = user?.userId;
                setUserId(userId || '');
                // Buscar veículos ativos do usuário
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

    useEffect(() => {
        if (inspection && inspection.attachments) {
            setAttachments(inspection.attachments.map((a: { url: string; name?: string; type: string }) => ({ uri: a.url, name: a.name || '', type: a.type })));
        }
    }, [inspection]);

    // Garante que attachments sempre é array e mapeia corretamente para exibição
    useEffect(() => {
        if (inspection && Array.isArray(inspection.attachments)) {
            setAttachments(
                inspection.attachments.map((a: { url: string; name?: string; type: string }) => ({
                    uri: a.url,
                    name: a.name || a.url.split('/').pop() || 'anexo',
                    type: a.type || '',
                }))
            );
        } else {
            setAttachments([]);
        }
    }, [inspection]);

    // Atualiza marca/modelo/placa ao selecionar veículo OU ao abrir para edição
    useEffect(() => {
        // Prioriza o vehicleId do formData (edição ou seleção)
        const v = vehicles.find(v => v.id === (selectedVehicleId || formData.vehicleId));
        if (v) {
            setFormData(f => ({
                ...f,
                brand: v.brand?.name || '',
                model: v.model?.name || '',
                licensePlate: v.licensePlate || '',
                vehicleId: v.id,
            }));
        }
    }, [selectedVehicleId, formData.vehicleId, vehicles]);

    // Preencher formData ao editar uma inspeção existente
    useEffect(() => {
        if (inspection && inspection.vehicle?.id) {
            setFormData(f => ({
                ...f,
                vehicleId: inspection.vehicle.id,
                brand: inspection.vehicle.brand?.name || '',
                model: inspection.vehicle.model?.name || '',
                licensePlate: inspection.vehicle.licensePlate || '',
                status: inspection.status || '',
                company: inspection.company || '',
                date: inspection.date ? new Date(inspection.date) : new Date(),
            }));
            setSelectedVehicleId(inspection.vehicle.id);
        }
    }, [inspection]);

    // Mover o hook para o topo do componente
    const attachmentsQuery = useInspectionAttachmentsQuery(inspection?.id);

    // Mapear anexos do backend para o formato local
    useEffect(() => {
        if (inspection && inspection.id && attachmentsQuery.data) {
            setAttachments(
                (attachmentsQuery.data as InspectionAttachment[]).map(att => ({
                    uri: att.url,
                    name: att.name || att.url.split('/').pop() || 'anexo',
                    type: att.type,
                    id: att.id,
                }))
            );
        }
    }, [inspection, attachmentsQuery.data]);

    // React Query hooks
    const createInspectionMutation = useCreateInspectionMutation(userId);
    const updateInspectionMutation = useUpdateInspectionMutation(userId);
    const uploadAttachmentMutation = useUploadInspectionAttachmentMutation(inspection?.id || '');
    const deleteAttachmentMutation = useDeleteInspectionAttachmentMutation(inspection?.id || '');
    const queryClient = useQueryClient();

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!attachments[0] || !attachments[0].uri) newErrors.fileUrl = 'Anexe o arquivo principal da inspeção';
        if (!formData.vehicleId) newErrors.vehicleId = 'Selecione um veículo';
        if (!formData.status) newErrors.status = 'Status é obrigatório';
        if (!formData.company) newErrors.company = 'Empresa é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const data = {
                vehicleId: formData.vehicleId,
                status: formData.status,
                company: formData.company,
                date: formData.date instanceof Date ? formData.date.toISOString() : formData.date,
                fileUrl: attachments[0]?.uri,
                uploadedById: userId,
            };
            if (inspection) {
                await updateInspectionMutation.mutateAsync({ id: inspection.id, data });
            } else {
                // Cria inspeção e faz upload dos anexos após obter o ID
                const created = await createInspectionMutation.mutateAsync(data);
                if (created && created.id && attachments.length > 0) {
                    for (const file of attachments) {
                        await uploadInspectionAttachment(created.id, {
                            uri: file.uri,
                            name: file.name,
                            type: file.type,
                        });
                    }
                    // Refaz o fetch da lista após upload dos anexos
                    await queryClient.invalidateQueries({ queryKey: ['inspections', userId] });
                }
                setAttachments([]); // Limpa anexos locais após salvar
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.message || `Falha ao ${inspection ? 'atualizar' : 'criar'} inspeção`);
        } finally {
            setLoading(false);
        }
    };

    // Upload de anexo para inspeção (usando mutation)
    const handlePickAttachment = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (inspection && inspection.id) {
                setLoading(true);
                try {
                    await uploadAttachmentMutation.mutateAsync({
                        uri: asset.uri,
                        name: asset.name || 'anexo',
                        type: asset.mimeType || 'application/octet-stream',
                    });
                } catch (e) {
                    Alert.alert('Erro', 'Falha ao enviar anexo');
                } finally {
                    setLoading(false);
                }
            } else {
                // Para inspeção nova, só adiciona localmente
                setAttachments([...attachments, { uri: asset.uri, name: asset.name || 'anexo', type: asset.mimeType || 'application/octet-stream' }]);
            }
        }
    };

    // Remover anexo: usar id se existir
    const handleRemoveAttachment = (index: number) => {
        const att = attachments[index];
        if (inspection && inspection.id && att.id) {
            deleteAttachmentMutation.mutate(att.id);
        } else {
            setAttachments(attachments.filter((_, i) => i !== index));
        }
    };

    // Registro do locale pt para o calendário
    registerTranslation('pt', {
        save: 'OK',
        selectSingle: 'Selecione a data',
        selectMultiple: 'Selecione as datas',
        selectRange: 'Selecione o período',
        notAccordingToDateFormat: inputFormat => `O formato deve ser ${inputFormat}`,
        mustBeHigherThan: date => `Deve ser depois de ${date}`,
        mustBeLowerThan: date => `Deve ser antes de ${date}`,
        mustBeBetween: (startDate, endDate) => `Deve ser entre ${startDate} - ${endDate}`,
        dateIsDisabled: 'Data não permitida',
        previous: 'Anterior',
        next: 'Próximo',
        typeInDate: 'Digite a data',
        pickDateFromCalendar: 'Escolha a data no calendário',
        close: 'Fechar',
        hour: 'Hora',
        minute: 'Minuto',
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                        <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Inspeção</Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 20, width: '100%', maxWidth: 420, elevation: 4 }}>
                            {/* Dropdown de veículos */}
                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Veículo</Text>
                            <Menu
                                visible={showVehicleMenu}
                                onDismiss={() => setShowVehicleMenu(false)}
                                anchor={
                                    <Button onPress={() => setShowVehicleMenu(true)} mode="outlined" style={{ marginBottom: 8, borderRadius: 8, borderColor: '#1976d2' }} textColor="#1976d2">
                                        {formData.vehicleId
                                            ? (() => {
                                                const v = vehicles.find(v => v.id === formData.vehicleId);
                                                return v ? `${v.licensePlate} - ${v.brand?.name || ''} ${v.model?.name || ''}` : 'Selecionar veículo';
                                            })()
                                            : 'Selecionar veículo'}
                                    </Button>
                                }
                                style={{ maxWidth: 340 }}
                            >
                                <Menu.Item onPress={() => { setSelectedVehicleId(''); setFormData(f => ({ ...f, vehicleId: '' })); }} title="Limpar seleção" />
                                {vehicles.map((v) => (
                                    <Menu.Item
                                        key={v.id}
                                        onPress={() => { setSelectedVehicleId(v.id); setFormData(f => ({ ...f, vehicleId: v.id })); setShowVehicleMenu(false); }}
                                        title={`${v.licensePlate} - ${v.brand?.name || ''} ${v.model?.name || ''}`}
                                    />
                                ))}
                            </Menu>
                            {errors && errors.vehicleId && <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>{errors.vehicleId}</Text>}

                            {/* Marca/Modelo e Placa preenchidos automaticamente */}
                            <Text style={{ fontWeight: 'bold', marginBottom: 2, marginTop: 8 }}>Marca/Modelo</Text>
                            <TextInput value={formData.brand + ' ' + formData.model} editable={false} style={{ marginBottom: 8, backgroundColor: '#f6f6f6' }} left={<TextInput.Icon icon="car" />} />
                            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Placa</Text>
                            <TextInput value={formData.licensePlate} editable={false} style={{ marginBottom: 8, backgroundColor: '#f6f6f6' }} left={<TextInput.Icon icon="card-text" />} />

                            {/* Data da Inspeção */}
                            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Data da Inspeção</Text>
                            <Button mode="outlined" onPress={() => setShowDateModal(true)} style={{ marginBottom: 8, borderRadius: 8 }} icon="calendar">
                                {formData.date ? new Date(formData.date).toLocaleDateString() : 'Selecionar data'}
                            </Button>
                            <DatePickerModal
                                locale="pt"
                                mode="single"
                                visible={showDateModal}
                                onDismiss={() => setShowDateModal(false)}
                                date={formData.date}
                                onConfirm={({ date }) => { setShowDateModal(false); if (date) setFormData(f => ({ ...f, date })); }}
                                saveLabel="OK"
                                label="Selecione a data"
                                animationType="slide"
                            />

                            {/* Status */}
                            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Status</Text>
                            <Dropdown
                                style={{
                                    height: 48,
                                    borderColor: errors.status ? '#b00020' : '#ccc',
                                    borderWidth: 1,
                                    borderRadius: 8,
                                    paddingHorizontal: 8,
                                    backgroundColor: '#fff',
                                    marginBottom: 8,
                                }}
                                placeholderStyle={{ color: '#888' }}
                                selectedTextStyle={{ color: '#222' }}
                                iconStyle={{ width: 24, height: 24 }}
                                data={statusOptions.map(opt => ({ label: opt.label, value: opt.value }))}
                                labelField="label"
                                valueField="value"
                                placeholder="Selecionar status"
                                value={formData.status}
                                onChange={item => setFormData({ ...formData, status: item.value })}
                                renderRightIcon={() => <TextInput.Icon icon="menu-down" />}
                                containerStyle={{ zIndex: 10 }}
                            />
                            {errors.status && <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>{errors.status}</Text>}

                            {/* Empresa */}
                            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Empresa</Text>
                            <TextInput label="Empresa" value={formData.company || ''} onChangeText={text => setFormData({ ...formData, company: text })} style={{ marginBottom: 8, backgroundColor: '#f6f6f6' }} mode="outlined" />

                            {/* Anexos */}
                            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Anexos</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
                                {attachments.map((file, idx) => (
                                    <View key={idx} style={{ marginRight: 10, marginBottom: 8, alignItems: 'center', position: 'relative' }}>
                                        {file.type.startsWith('image') ? (
                                            <TouchableOpacity onPress={() => { }}>
                                                <Image source={{ uri: file.uri }} style={{ width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' }} />
                                            </TouchableOpacity>
                                        ) : (
                                            <IconButton icon="file-pdf-box" size={44} iconColor="#d32f2f" />
                                        )}
                                        <IconButton icon="close" size={18} onPress={() => handleRemoveAttachment(idx)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', zIndex: 2 }} />
                                    </View>
                                ))}
                                <IconButton icon="plus" size={44} onPress={handlePickAttachment} style={{ backgroundColor: '#e3e3e3', borderRadius: 8 }} />
                            </View>
                            {errors.fileUrl && <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>{errors.fileUrl}</Text>}

                            {/* Botões */}
                            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
                                <Button mode="contained" onPress={handleSubmit} style={{ borderRadius: 8, flex: 1, marginRight: 4 }} loading={loading} disabled={loading}>
                                    {inspection ? 'Atualizar' : 'Salvar'}
                                </Button>
                                <Button mode="outlined" onPress={() => { setFormData({ ...formData, status: '', company: '', date: new Date() }); setSelectedVehicleId(''); setAttachments([]); }} style={{ borderRadius: 8, flex: 1, marginHorizontal: 4 }}>
                                    Limpar
                                </Button>
                                <Button mode="text" onPress={() => navigation.goBack()} style={{ borderRadius: 8, flex: 1, marginLeft: 4 }}>
                                    Cancelar
                                </Button>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default InspectionFormScreen;