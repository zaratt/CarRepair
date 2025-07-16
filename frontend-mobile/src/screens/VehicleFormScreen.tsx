import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, Card, Divider, HelperText, IconButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createVehicle, deleteVehiclePhoto, getBrands, getModelsByBrand, getUsers, getVehiclePhotos, updateVehicle, uploadVehiclePhoto } from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Brand, FuelType, Model, User, Vehicle, VehiclePhoto } from '../types';

const FUEL_TYPES: { label: string; value: FuelType }[] = [
    { label: 'Gasolina', value: 'GASOLINE' },
    { label: 'Etanol', value: 'ETHANOL' },
    { label: 'Flex', value: 'FLEX' },
    { label: 'Diesel', value: 'DIESEL' },
    { label: 'GNV', value: 'GNV' },
    { label: 'Elétrico', value: 'ELECTRIC' },
    { label: 'Híbrido', value: 'HYBRID' },
    { label: 'Outro', value: 'OTHER' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleForm'>;

const VehicleFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const vehicle = route.params?.vehicle as Vehicle | undefined;
    const [formData, setFormData] = useState({
        licensePlate: vehicle?.licensePlate || '',
        brandId: vehicle?.brandId || '',
        modelId: vehicle?.modelId || '',
        yearManufacture: vehicle?.yearManufacture ? vehicle.yearManufacture.toString() : '',
        modelYear: vehicle?.modelYear ? vehicle.modelYear.toString() : '',
        fuelType: vehicle?.fuelType || '',
        vin: vehicle?.vin || '',
        ownerId: vehicle?.ownerId || '',
    });
    const [users, setUsers] = useState<User[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [visible, setVisible] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [brandMenuVisible, setBrandMenuVisible] = useState(false);
    const [modelMenuVisible, setModelMenuVisible] = useState(false);
    const [fuelMenuVisible, setFuelMenuVisible] = useState(false);
    const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
    const [uploading, setUploading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });
    const [profile, setProfile] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem('user').then((userStr) => {
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setProfile(user.profile);
                    setUserId(user.userId || user.id);
                    // Se for car_owner, já seta o ownerId
                    if (!vehicle && user.profile === 'car_owner') {
                        setFormData((f) => ({ ...f, ownerId: user.userId || user.id }));
                    }
                } catch {
                    setProfile(null);
                    setUserId(null);
                }
            } else {
                setProfile(null);
                setUserId(null);
            }
        });
    }, []);

    useEffect(() => {
        if (profile === 'wshop_owner') {
            getUsers().then(setUsers).catch(() => Alert.alert('Erro', 'Falha ao carregar usuários'));
        }
        getBrands().then(setBrands).catch(() => Alert.alert('Erro', 'Falha ao carregar marcas'));
    }, [profile]);

    useEffect(() => {
        if (formData.brandId) {
            getModelsByBrand(formData.brandId).then(setModels).catch(() => setModels([]));
        } else {
            setModels([]);
            setFormData((f) => ({ ...f, modelId: '' }));
        }
    }, [formData.brandId]);

    useEffect(() => {
        if (vehicle?.id) {
            getVehiclePhotos(vehicle.id).then(setPhotos).catch(() => setPhotos([]));
        }
    }, [vehicle?.id]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.licensePlate) newErrors.licensePlate = 'Placa é obrigatória';
        else if (!/^[A-Z0-9]{7}$/.test(formData.licensePlate)) newErrors.licensePlate = 'Placa inválida';
        if (!formData.brandId) newErrors.brandId = 'Marca obrigatória';
        if (!formData.modelId) newErrors.modelId = 'Modelo obrigatório';
        if (!formData.yearManufacture) newErrors.yearManufacture = 'Ano de fabricação obrigatório';
        else if (isNaN(parseInt(formData.yearManufacture)) || parseInt(formData.yearManufacture) < 1900 || parseInt(formData.yearManufacture) > new Date().getFullYear() + 1) {
            newErrors.yearManufacture = 'Ano de fabricação inválido';
        }
        if (!formData.modelYear) newErrors.modelYear = 'Ano modelo obrigatório';
        else if (isNaN(parseInt(formData.modelYear)) || parseInt(formData.modelYear) < 1900 || parseInt(formData.modelYear) > new Date().getFullYear() + 1) {
            newErrors.modelYear = 'Ano inválido';
        }
        if (!formData.fuelType) newErrors.fuelType = 'Combustível obrigatório';
        if (!formData.vin) newErrors.vin = 'VIN é obrigatório';
        else if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(formData.vin)) newErrors.vin = 'VIN inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            const ownerIdToSend = profile === 'car_owner' ? userId : (formData.ownerId || undefined);
            const data = {
                licensePlate: formData.licensePlate,
                brandId: formData.brandId,
                modelId: formData.modelId,
                yearManufacture: parseInt(formData.yearManufacture),
                modelYear: parseInt(formData.modelYear),
                fuelType: formData.fuelType as FuelType,
                vin: formData.vin,
                ownerId: ownerIdToSend === null ? undefined : ownerIdToSend,
            };
            if (vehicle) {
                await updateVehicle(vehicle.id, data);
            } else {
                await createVehicle(data);
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.message || `Falha ao ${vehicle ? 'atualizar' : 'criar'} veículo`);
        }
    };

    const handleAddPhoto = async () => {
        if (!vehicle?.id) return;
        if (photos.length >= 4) {
            Alert.alert('Limite de fotos atingido (4)');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' });
        if (!result.canceled && result.assets && result.assets[0].uri) {
            setUploading(true);
            try {
                await uploadVehiclePhoto(vehicle.id, result.assets[0].uri);
                const p = await getVehiclePhotos(vehicle.id);
                setPhotos(p);
                setSnackbar({ visible: true, message: 'Foto enviada com sucesso!', error: false });
            } catch (e: any) {
                let msg = 'Falha ao enviar foto';
                if (e?.response?.data?.message) msg = e.response.data.message;
                else if (e?.message) msg = e.message;
                setSnackbar({ visible: true, message: msg, error: true });
            } finally {
                setUploading(false);
            }
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!vehicle?.id) return;
        try {
            await deleteVehiclePhoto(vehicle.id, photoId);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch {
            Alert.alert('Erro', 'Falha ao remover foto');
        }
    };

    // Função para limpar o formulário
    const handleClearForm = () => {
        setFormData({
            licensePlate: '',
            brandId: '',
            modelId: '',
            yearManufacture: '',
            modelYear: '',
            fuelType: '',
            vin: '',
            ownerId: profile === 'car_owner' ? (userId || '') : '',
        });
        setErrors({});
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }} edges={['top', 'bottom', 'left', 'right']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginLeft: 4, flex: 1 }}>Cadastro de Veículo</Text>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <Card style={{ margin: 16, borderRadius: 16, elevation: 3, padding: 0 }}>
                    <Card.Content style={{ paddingBottom: 0 }}>
                        <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: '600' }}>
                            Dados do veículo
                        </Text>
                        {/* Placa */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>Placa do veículo</Text>
                        <TextInput
                            placeholder="Ex: ABC1D23"
                            value={formData.licensePlate}
                            onChangeText={(text) => setFormData({ ...formData, licensePlate: text.toUpperCase() })}
                            style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                            error={!!errors.licensePlate}
                            autoCapitalize="characters"
                            maxLength={7}
                            mode="flat"
                            left={<TextInput.Icon icon="car" />}
                        />
                        <HelperText type="error" visible={!!errors.licensePlate}>{errors.licensePlate}</HelperText>

                        {/* Marca e Modelo na mesma linha */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Marca</Text>
                                <Dropdown
                                    data={brands.map(b => ({ label: b.name, value: b.id }))}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Selecionar marca"
                                    search
                                    value={formData.brandId}
                                    onChange={item => {
                                        setFormData({ ...formData, brandId: item.value, modelId: '' });
                                    }}
                                    style={{ borderRadius: 8, borderWidth: 1, borderColor: errors.brandId ? '#b00020' : '#ccc', paddingHorizontal: 8, backgroundColor: '#fff', marginBottom: 4, height: 48 }}
                                    placeholderStyle={{ color: '#888' }}
                                    selectedTextStyle={{ color: '#222' }}
                                    searchPlaceholder="Buscar marca..."
                                    iconStyle={{ width: 24, height: 24 }}
                                />
                                <HelperText type="error" visible={!!errors.brandId}>{errors.brandId}</HelperText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Modelo</Text>
                                <Dropdown
                                    data={models.map(m => ({ label: m.name, value: m.id }))}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Selecionar modelo"
                                    search
                                    value={formData.modelId}
                                    onChange={item => setFormData({ ...formData, modelId: item.value })}
                                    style={{ borderRadius: 8, borderWidth: 1, borderColor: errors.modelId ? '#b00020' : '#ccc', paddingHorizontal: 8, backgroundColor: '#fff', marginBottom: 4, height: 48 }}
                                    placeholderStyle={{ color: '#888' }}
                                    selectedTextStyle={{ color: '#222' }}
                                    searchPlaceholder="Buscar modelo..."
                                    iconStyle={{ width: 24, height: 24 }}
                                    disable={!formData.brandId}
                                />
                                <HelperText type="error" visible={!!errors.modelId}>{errors.modelId}</HelperText>
                            </View>
                        </View>

                        {/* Anos lado a lado */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Ano de fabricação</Text>
                                <TextInput
                                    placeholder="Ex: 2023"
                                    value={formData.yearManufacture}
                                    onChangeText={(text) => setFormData({ ...formData, yearManufacture: text })}
                                    keyboardType="numeric"
                                    style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                                    error={!!errors.yearManufacture}
                                    maxLength={4}
                                    mode="flat"
                                    left={<TextInput.Icon icon="calendar" />}
                                />
                                <HelperText type="error" visible={!!errors.yearManufacture}>{errors.yearManufacture}</HelperText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Ano modelo</Text>
                                <TextInput
                                    placeholder="Ex: 2024"
                                    value={formData.modelYear}
                                    onChangeText={(text) => setFormData({ ...formData, modelYear: text })}
                                    keyboardType="numeric"
                                    style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                                    error={!!errors.modelYear}
                                    maxLength={4}
                                    mode="flat"
                                    left={<TextInput.Icon icon="calendar-range" />}
                                />
                                <HelperText type="error" visible={!!errors.modelYear}>{errors.modelYear}</HelperText>
                            </View>
                        </View>

                        {/* Combustível */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>Combustível</Text>
                        <Dropdown
                            data={FUEL_TYPES.map(f => ({ label: f.label, value: f.value }))}
                            labelField="label"
                            valueField="value"
                            placeholder="Selecionar combustível"
                            value={formData.fuelType}
                            onChange={item => setFormData({ ...formData, fuelType: item.value })}
                            style={{ borderRadius: 8, borderWidth: 1, borderColor: errors.fuelType ? '#b00020' : '#ccc', paddingHorizontal: 8, backgroundColor: '#fff', marginBottom: 4, height: 48 }}
                            placeholderStyle={{ color: '#888' }}
                            selectedTextStyle={{ color: '#222' }}
                            iconStyle={{ width: 24, height: 24 }}
                        />
                        <HelperText type="error" visible={!!errors.fuelType}>{errors.fuelType}</HelperText>

                        {/* RENAVAM */}
                        <Text style={{ marginBottom: 2, fontWeight: '500' }}>RENAVAM</Text>
                        <TextInput
                            placeholder="11 dígitos"
                            value={formData.vin}
                            onChangeText={(text) => setFormData({ ...formData, vin: text.replace(/\D/g, '').slice(0, 11) })}
                            style={{ marginVertical: 5, backgroundColor: 'transparent' }}
                            error={!!errors.vin}
                            maxLength={11}
                            keyboardType="numeric"
                            mode="flat"
                            left={<TextInput.Icon icon="file-document-outline" />}
                        />
                        <HelperText type="error" visible={!!errors.vin}>{errors.vin}</HelperText>

                        {/* Proprietário */}
                        {profile === 'wshop_owner' && (
                            <>
                                <Text style={{ marginBottom: 2, fontWeight: '500' }}>Proprietário</Text>
                                <Dropdown
                                    data={users.map(u => ({ label: u.name, value: u.id }))}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Selecionar proprietário"
                                    value={formData.ownerId}
                                    onChange={item => setFormData({ ...formData, ownerId: item.value })}
                                    style={{ borderRadius: 8, borderWidth: 1, borderColor: errors.ownerId ? '#b00020' : '#ccc', paddingHorizontal: 8, backgroundColor: '#fff', marginBottom: 4, height: 48 }}
                                    placeholderStyle={{ color: '#888' }}
                                    selectedTextStyle={{ color: '#222' }}
                                    iconStyle={{ width: 24, height: 24 }}
                                />
                                <HelperText type="error" visible={!!errors.ownerId}>{errors.ownerId}</HelperText>
                            </>
                        )}
                    </Card.Content>
                    {vehicle?.id && (
                        <>
                            <Divider style={{ marginVertical: 8 }} />
                            <Card.Content>
                                <Text style={{ marginBottom: 8 }}>Fotos do veículo ({photos.length}/4):</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                                    {photos.map((photo) => (
                                        <View key={photo.id} style={{ width: 120, alignItems: 'center', marginBottom: 8 }}>
                                            <Image source={{ uri: photo.url }} style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 4, backgroundColor: '#eee' }} />
                                            <Button mode="text" onPress={() => handleDeletePhoto(photo.id)} compact textColor="red">Remover</Button>
                                        </View>
                                    ))}
                                    {photos.length < 4 && (
                                        <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
                                            <Button icon="camera" mode="outlined" onPress={handleAddPhoto} disabled={uploading}>
                                                {uploading ? 'Enviando...' : 'Adicionar Foto'}
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
                        </>
                    )}
                    <Card.Actions style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8, gap: 8 }}>
                        <Button mode="contained" onPress={handleSubmit} style={{ borderRadius: 8, flex: 1, marginHorizontal: 2, paddingVertical: 4 }} labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>
                            Salvar
                        </Button>
                        <Button mode="outlined" onPress={handleClearForm} style={{ borderRadius: 8, flex: 1, marginHorizontal: 2, paddingVertical: 4 }} labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>
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

export default VehicleFormScreen;