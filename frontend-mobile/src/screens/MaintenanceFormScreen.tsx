import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, Card, Chip, Divider, IconButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaintenance, createWorkshop, getVehicleLastMaintenance, getVehicles, getWorkshops, updateMaintenance } from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Vehicle, Workshop } from '../types';

interface LastMaintenanceInfo {
    hasLastMaintenance: boolean;
    lastMaintenance?: {
        id: string;
        date: string;
        mileage: number;
        description: string;
        workshopName?: string;
    };
}

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceForm'>;

const MaintenanceFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const maintenance = route.params?.maintenance;
    const [formData, setFormData] = useState({
        vehicleId: maintenance?.vehicleId || '',
        workshopId: maintenance?.workshopId || '',
        date: maintenance?.date ? new Date(maintenance.date) : new Date(),
        description: maintenance?.description || '',
        value: maintenance?.value ? maintenance.value.toString() : '',
        serviceStatus: maintenance?.serviceStatus || 'concluido', // Status do serviço (sempre concluído)
        validationStatus: maintenance?.validationStatus || 'registrado', // Status de validação
        mileage: maintenance?.mileage ? maintenance.mileage.toString() : '', // KM
    });
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [userId, setUserId] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<any[]>([]); // [{ uri, name, type }]
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [lastMaintenance, setLastMaintenance] = useState<LastMaintenanceInfo | null>(null);
    const [customWorkshopName, setCustomWorkshopName] = useState('');

    // Serviços predefinidos para seleção
    const predefinedServices = [
        'Troca de óleo',
        'Troca de filtros',
        'Alinhamento',
        'Balanceamento',
        'Freios',
        'Suspensão',
        'Revisão completa',
        'Troca de pneus',
        'Sistema elétrico',
        'Ar condicionado',
        'Embreagem',
        'Câmbio'
    ];
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (!user?.userId) throw new Error('Usuário não autenticado');
                setUserId(user.userId);
                const [vehiclesData, workshopsData] = await Promise.all([
                    getVehicles(user.userId),
                    getWorkshops()
                ]);
                setVehicles(vehiclesData);
                setWorkshops(workshopsData);

                // Se estiver editando uma manutenção, verificar se a oficina existe na lista
                if (maintenance?.workshopId) {
                    const workshopExists = workshopsData.find(w => w.id === maintenance.workshopId);
                    if (!workshopExists) {
                        // Se a oficina não existe na lista, marcar como "Oficina não listada"
                        setFormData(prev => ({ ...prev, workshopId: 'not_listed' }));
                        // Tentar obter o nome da oficina do campo workshop se disponível
                        if (maintenance.workshop?.name) {
                            setCustomWorkshopName(maintenance.workshop.name);
                        }
                    }
                }

                // Se estiver editando uma manutenção, extrair os serviços predefinidos da descrição
                if (maintenance?.description) {
                    const description = maintenance.description;
                    const foundServices = predefinedServices.filter(service =>
                        description.toLowerCase().includes(service.toLowerCase())
                    );
                    setSelectedServices(foundServices);

                    // Remover os serviços predefinidos da descrição para mostrar apenas detalhes adicionais
                    let remainingDescription = description;
                    foundServices.forEach(service => {
                        remainingDescription = remainingDescription.replace(service, '');
                    });
                    // Limpar caracteres extras
                    remainingDescription = remainingDescription.replace(/^[,\s-]+|[,\s-]+$/g, '').trim();
                    setFormData(prev => ({ ...prev, description: remainingDescription }));
                }
            } catch (error) {
                Alert.alert('Erro', 'Falha ao carregar dados');
            }
        };
        fetchData();
    }, [maintenance]);

    // useEffect para buscar última manutenção quando veículo for selecionado
    useEffect(() => {
        const fetchLastMaintenance = async () => {
            if (formData.vehicleId) {
                try {
                    const data = await getVehicleLastMaintenance(formData.vehicleId);
                    setLastMaintenance(data);
                } catch (error) {
                    console.error('Erro ao buscar última manutenção:', error);
                    setLastMaintenance(null);
                }
            } else {
                setLastMaintenance(null);
            }
        };
        fetchLastMaintenance();
    }, [formData.vehicleId]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.vehicleId) newErrors.vehicleId = 'Veículo é obrigatório';
        if (!formData.workshopId) newErrors.workshopId = 'Oficina é obrigatória';
        if (formData.workshopId === 'not_listed' && !customWorkshopName.trim()) {
            newErrors.workshopId = 'Nome da oficina é obrigatório';
        }
        if (!formData.date) newErrors.date = 'Data é obrigatória';

        // Verificar se pelo menos um serviço foi selecionado OU há descrição
        if (selectedServices.length === 0 && !formData.description.trim()) {
            newErrors.description = 'Selecione pelo menos um serviço ou descreva o serviço realizado';
        }

        if (!formData.value) newErrors.value = 'Valor é obrigatório';
        else if (isNaN(parseFloat(formData.value)) || parseFloat(formData.value) < 0) {
            newErrors.value = 'Valor inválido';
        }
        if (!formData.mileage) {
            newErrors.mileage = 'KM é obrigatório';
        } else if (isNaN(parseInt(formData.mileage)) || parseInt(formData.mileage) < 0) {
            newErrors.mileage = 'KM inválido';
        } else if (lastMaintenance && lastMaintenance.hasLastMaintenance &&
            lastMaintenance.lastMaintenance &&
            parseInt(formData.mileage) < lastMaintenance.lastMaintenance.mileage) {
            newErrors.mileage = `KM deve ser maior que ${lastMaintenance.lastMaintenance.mileage.toLocaleString()} (última manutenção em ${new Date(lastMaintenance.lastMaintenance.date).toLocaleDateString()})`;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            let workshopId = formData.workshopId;

            // Se "Oficina não listada" foi selecionada, criar uma nova oficina
            if (formData.workshopId === 'not_listed' && customWorkshopName.trim()) {
                if (!userId) throw new Error('Usuário não autenticado');

                const newWorkshop = await createWorkshop({
                    name: customWorkshopName.trim(),
                    userId: userId,
                    address: customWorkshopName.trim(), // Usar o nome como endereço temporário
                    phone: 'Não informado', // Valor padrão para oficinas não listadas
                    subdomain: undefined
                });
                workshopId = newWorkshop.id;
            }

            // Combinar serviços selecionados com descrição adicional
            const servicesText = selectedServices.length > 0 ? selectedServices.join(', ') : '';
            const finalDescription = servicesText + (formData.description.trim() ?
                (servicesText ? ' - ' + formData.description.trim() : formData.description.trim()) : '');

            const data = {
                vehicleId: formData.vehicleId,
                workshopId: workshopId,
                date: formData.date.toISOString().split('T')[0],
                description: finalDescription,
                value: parseFloat(formData.value),
                serviceStatus: 'concluido', // Status do serviço sempre concluído
                validationStatus: maintenance ? formData.validationStatus : 'registrado', // Status de validação
                mileage: parseInt(formData.mileage),
            };
            if (maintenance) {
                await updateMaintenance(maintenance.id, data);
            } else {
                await createMaintenance(data);
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.message || `Falha ao ${maintenance ? 'atualizar' : 'criar'} manutenção`);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || formData.date;
        setShowDatePicker(Platform.OS === 'ios');
        setFormData({ ...formData, date: currentDate });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }} edges={['top', 'bottom', 'left', 'right']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginLeft: 4, flex: 1 }}>
                    {maintenance ? 'Editar Manutenção' : 'Registrar Manutenção'}
                </Text>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <Card style={{ margin: 16, borderRadius: 16, elevation: 3, padding: 0 }}>
                    <Card.Content style={{ paddingBottom: 0 }}>
                        {/* SEÇÃO: VEÍCULO E OFICINA */}
                        <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600', color: '#1976d2' }}>
                            📋 Informações Gerais
                        </Text>
                        {/* Veículo - linha única com formato Marca/Modelo - Placa */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>Veículo</Text>
                        <Dropdown
                            data={vehicles.map(v => ({
                                label: `${v.brand?.name || 'N/A'} ${v.model?.name || 'N/A'} - ${v.licensePlate}`,
                                value: v.id
                            }))}
                            labelField="label"
                            valueField="value"
                            placeholder="Selecionar veículo"
                            search
                            value={formData.vehicleId}
                            onChange={item => setFormData({ ...formData, vehicleId: item.value })}
                            style={{
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: errors.vehicleId ? '#b00020' : '#ccc',
                                paddingHorizontal: 8,
                                backgroundColor: '#fff',
                                marginBottom: 8,
                                height: 48
                            }}
                            placeholderStyle={{ color: '#888' }}
                            selectedTextStyle={{ color: '#222' }}
                            searchPlaceholder="Buscar veículo..."
                            iconStyle={{ width: 24, height: 24 }}
                        />
                        {errors.vehicleId && <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{errors.vehicleId}</Text>}

                        {/* Oficina - abaixo do veículo */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>Oficina</Text>
                        <Dropdown
                            data={[
                                ...workshops.map(w => ({
                                    label: w.name || w.address,
                                    value: w.id
                                })),
                                { label: '🏪 Oficina não listada', value: 'not_listed' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Selecionar oficina"
                            search
                            value={formData.workshopId}
                            onChange={item => {
                                setFormData({ ...formData, workshopId: item.value });
                                // Limpar o nome da oficina personalizada se uma oficina da lista for selecionada
                                if (item.value !== 'not_listed') {
                                    setCustomWorkshopName('');
                                }
                            }}
                            style={{
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: errors.workshopId ? '#b00020' : '#ccc',
                                paddingHorizontal: 8,
                                backgroundColor: '#fff',
                                marginBottom: 8,
                                height: 48
                            }}
                            placeholderStyle={{ color: '#888' }}
                            selectedTextStyle={{ color: '#222' }}
                            searchPlaceholder="Buscar oficina..."
                            iconStyle={{ width: 24, height: 24 }}
                        />
                        {errors.workshopId && <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{errors.workshopId}</Text>}

                        {/* Campo para nome da oficina quando "Oficina não listada" for selecionada */}
                        {formData.workshopId === 'not_listed' && (
                            <>
                                <Text style={{ marginBottom: 2, fontWeight: '500', marginTop: 8 }}>Nome da Oficina</Text>
                                <TextInput
                                    value={customWorkshopName}
                                    onChangeText={setCustomWorkshopName}
                                    placeholder="Digite o nome da oficina"
                                    style={{ marginBottom: 8 }}
                                    mode="outlined"
                                />
                                {!customWorkshopName.trim() && formData.workshopId === 'not_listed' && (
                                    <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>
                                        Nome da oficina é obrigatório
                                    </Text>
                                )}
                            </>
                        )}

                        {/* SEÇÃO: DETALHES DA MANUTENÇÃO */}
                        <Divider style={{ marginVertical: 16 }} />
                        <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600', color: '#1976d2' }}>
                            🔧 Detalhes da Manutenção
                        </Text>

                        {/* Data e Valor */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Data</Text>
                                <TextInput
                                    placeholder="Selecione a data"
                                    value={formData.date.toLocaleDateString()}
                                    onFocus={() => setShowDatePicker(true)}
                                    editable={false}
                                    style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                                    error={!!errors.date}
                                    left={<TextInput.Icon icon="calendar" />}
                                />
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.date}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeDate}
                                        maximumDate={new Date()} // Permite apenas datas até hoje
                                    />
                                )}
                                {errors.date && <Text style={{ color: 'red', fontSize: 12 }}>{errors.date}</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Valor</Text>
                                <TextInput
                                    placeholder="Ex: 250.00"
                                    value={formData.value}
                                    onChangeText={(text) => setFormData({ ...formData, value: text })}
                                    keyboardType="numeric"
                                    style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                                    error={!!errors.value}
                                    left={<TextInput.Icon icon="currency-brl" />}
                                />
                                {errors.value && <Text style={{ color: 'red', fontSize: 12 }}>{errors.value}</Text>}
                            </View>
                        </View>
                        {/* Serviços Realizados */}
                        <Text style={{ marginBottom: 8, fontWeight: '500', fontSize: 16 }}>Serviços Realizados</Text>
                        <Text style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>Selecione os serviços realizados:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {predefinedServices.map((service) => (
                                <Chip
                                    key={service}
                                    selected={selectedServices.includes(service)}
                                    onPress={() => {
                                        if (selectedServices.includes(service)) {
                                            setSelectedServices(selectedServices.filter(s => s !== service));
                                        } else {
                                            setSelectedServices([...selectedServices, service]);
                                        }
                                    }}
                                    style={{
                                        marginBottom: 4,
                                        backgroundColor: selectedServices.includes(service) ? '#e3f2fd' : '#f5f5f5'
                                    }}
                                    textStyle={{
                                        color: selectedServices.includes(service) ? '#1976d2' : '#666'
                                    }}
                                >
                                    {service}
                                </Chip>
                            ))}
                        </View>

                        {/* Descrição adicional */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>Detalhes adicionais</Text>
                        <TextInput
                            placeholder="Descreva detalhes específicos do serviço realizado..."
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            numberOfLines={3}
                            style={{
                                marginVertical: 5,
                                backgroundColor: 'transparent',
                                minHeight: 80
                            }}
                            error={!!errors.description}
                            left={<TextInput.Icon icon="wrench" />}
                        />
                        {errors.description && <Text style={{ color: 'red', fontSize: 12 }}>{errors.description}</Text>}
                        {/* KM */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>KM</Text>
                        <TextInput
                            placeholder="Ex: 12345(Sem virgula ou ponto)"
                            value={formData.mileage}
                            onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                            keyboardType="numeric"
                            style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                            error={!!errors.mileage}
                            left={<TextInput.Icon icon="counter" />}
                        />
                        {errors.mileage && <Text style={{ color: 'red', fontSize: 12 }}>{errors.mileage}</Text>}

                        {/* Informações da última manutenção */}
                        {lastMaintenance && lastMaintenance.hasLastMaintenance && lastMaintenance.lastMaintenance && (
                            <View style={{
                                backgroundColor: '#e8f5e8',
                                padding: 12,
                                borderRadius: 8,
                                marginTop: 8,
                                borderLeftWidth: 4,
                                borderLeftColor: '#4caf50'
                            }}>
                                <Text style={{ fontWeight: '500', color: '#2e7d32', marginBottom: 4 }}>
                                    📊 Última Manutenção
                                </Text>
                                <Text style={{ color: '#2e7d32', fontSize: 14 }}>
                                    Data: {new Date(lastMaintenance.lastMaintenance.date).toLocaleDateString()}
                                </Text>
                                <Text style={{ color: '#2e7d32', fontSize: 14 }}>
                                    KM: {lastMaintenance.lastMaintenance.mileage.toLocaleString()}
                                </Text>
                                <Text style={{ color: '#2e7d32', fontSize: 14 }}>
                                    Serviço: {lastMaintenance.lastMaintenance.description}
                                </Text>
                                {lastMaintenance.lastMaintenance.workshopName && (
                                    <Text style={{ color: '#2e7d32', fontSize: 14 }}>
                                        Oficina: {lastMaintenance.lastMaintenance.workshopName}
                                    </Text>
                                )}
                            </View>
                        )}

                        {lastMaintenance && !lastMaintenance.hasLastMaintenance && (
                            <View style={{
                                backgroundColor: '#e3f2fd',
                                padding: 12,
                                borderRadius: 8,
                                marginTop: 8,
                                borderLeftWidth: 4,
                                borderLeftColor: '#2196f3'
                            }}>
                                <Text style={{ fontWeight: '500', color: '#1976d2', marginBottom: 4 }}>
                                    🎉 Primeira Manutenção
                                </Text>
                                <Text style={{ color: '#1976d2', fontSize: 14 }}>
                                    Esta será a primeira manutenção registrada para este veículo.
                                </Text>
                            </View>
                        )}

                        {/* Status automático - apenas exibição */}
                        <View style={{
                            backgroundColor: '#e8f5e8',
                            padding: 12,
                            borderRadius: 8,
                            marginVertical: 8,
                            borderLeftWidth: 4,
                            borderLeftColor: '#4caf50'
                        }}>
                            <Text style={{ fontWeight: '500', color: '#2e7d32', marginBottom: 4 }}>Status da Manutenção</Text>
                            <Text style={{ color: '#2e7d32', fontSize: 14 }}>
                                {maintenance ?
                                    `Serviço: ✅ Concluído | Validação: ${maintenance.validationStatus === 'registrado' ? '📝 Registrado' :
                                        maintenance.validationStatus === 'pendente' ? '⏳ Pendente' :
                                            maintenance.validationStatus === 'validado' ? '✅ Validado' : 'Desconhecido'
                                    }` :
                                    'Serviço: ✅ Concluído | Validação: 📝 Registrado (após cadastro)'
                                }
                            </Text>
                        </View>

                        {/* SEÇÃO: ANEXOS */}
                        <Divider style={{ marginVertical: 16 }} />
                        <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: '600', color: '#1976d2' }}>
                            📎 Anexos
                        </Text>
                        <Text style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>
                            Adicione fotos ou PDFs (máximo 4 arquivos)
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                            {attachments.map((file, idx) => (
                                <View key={file.uri} style={{ width: 120, alignItems: 'center', marginBottom: 8 }}>
                                    {file.type.startsWith('image') ? (
                                        <Image source={{ uri: file.uri }} style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 4, backgroundColor: '#eee' }} />
                                    ) : (
                                        <IconButton icon="file-pdf-box" size={48} />
                                    )}
                                    <Button mode="text" onPress={() => setAttachments(attachments.filter((_, i) => i !== idx))} compact textColor="red">Remover</Button>
                                </View>
                            ))}
                            {attachments.length < 4 && (
                                <View style={{ width: 120 * 2 + 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Button icon="attachment" mode="outlined" onPress={async () => {
                                        const doc = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
                                        if (!doc.canceled && doc.assets && doc.assets[0].uri) {
                                            setAttachments([
                                                ...attachments,
                                                {
                                                    uri: doc.assets[0].uri,
                                                    name: doc.assets[0].name || 'arquivo',
                                                    type: doc.assets[0].mimeType || '',
                                                },
                                            ]);
                                        }
                                    }} disabled={uploading} style={{ flex: 1 }}>
                                        Adicionar Arquivo
                                    </Button>
                                </View>
                            )}
                        </View>
                        <Snackbar
                            visible={snackbar.visible}
                            onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                            duration={2500}
                            style={snackbar.error ? { backgroundColor: '#b00020' } : {}}
                        >
                            {snackbar.message}
                        </Snackbar>
                    </Card.Content>
                    <Card.Actions style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8, gap: 8 }}>
                        <Button mode="contained" onPress={handleSubmit} style={{ borderRadius: 8, flex: 1, marginHorizontal: 2, paddingVertical: 4 }} labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>
                            Salvar
                        </Button>
                        <Button mode="outlined" onPress={() => {
                            setFormData({
                                vehicleId: '',
                                workshopId: '',
                                date: new Date(),
                                description: '',
                                value: '',
                                serviceStatus: 'concluido',
                                validationStatus: 'registrado',
                                mileage: '',
                            });
                            setSelectedServices([]);
                            setErrors({});
                            setAttachments([]);
                        }} style={{ borderRadius: 8, flex: 1, marginHorizontal: 2, paddingVertical: 4 }} labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>
                            Limpar
                        </Button>
                        <Button onPress={() => navigation.goBack()} mode="text" style={{ borderRadius: 8, flex: 1, marginHorizontal: 2, paddingVertical: 4 }} labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>
                            Cancelar
                        </Button>
                    </Card.Actions>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MaintenanceFormScreen;