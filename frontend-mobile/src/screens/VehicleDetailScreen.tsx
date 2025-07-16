import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteVehicle, deleteVehiclePhoto, getVehicle, getVehiclePhotos, uploadVehiclePhoto } from '../api/api';
import { RootStackParamList } from '../navigation/types';
import { Vehicle, VehiclePhoto } from '../types';

const MAX_PHOTOS = 4;

type VehicleDetailRouteProp = RouteProp<any, 'VehicleDetail'>;

const VehicleDetailScreen: React.FC = () => {
    const route = useRoute<VehicleDetailRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const vehicleId = (route.params as any)?.vehicleId;
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });
    const [userId, setUserId] = useState<string | null>(null);
    const [modalPhoto, setModalPhoto] = useState<VehiclePhoto | null>(null);

    useEffect(() => {
        AsyncStorage.getItem('user').then((userStr) => {
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserId(user.userId || user.id);
                } catch {
                    setUserId(null);
                }
            } else {
                setUserId(null);
            }
        });
    }, []);

    // Função para buscar dados do veículo e fotos
    const fetchVehicleData = useCallback(async () => {
        if (!vehicleId || !userId) return;
        setLoading(true);
        try {
            const v = await getVehicle(vehicleId, userId);
            setVehicle(v);
            const p = await getVehiclePhotos(vehicleId);
            setPhotos(p);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao carregar dados do veículo');
        } finally {
            setLoading(false);
        }
    }, [vehicleId, userId]);

    useEffect(() => {
        fetchVehicleData();
    }, [fetchVehicleData]);

    // Atualiza ao voltar para a tela
    useFocusEffect(
        useCallback(() => {
            fetchVehicleData();
        }, [fetchVehicleData])
    );

    const handleDeletePhoto = async (photoId: string) => {
        // Fecha o modal ANTES de atualizar as fotos
        if (modalPhoto && modalPhoto.id === photoId) setModalPhoto(null);
        try {
            await deleteVehiclePhoto(vehicleId, photoId);
            // Aguarda o modal fechar antes de atualizar as fotos
            setTimeout(async () => {
                const p = await getVehiclePhotos(vehicleId);
                setPhotos(p);
            }, 200);
        } catch {
            Alert.alert('Erro', 'Falha ao remover foto');
        }
    };

    const handleAddPhoto = async () => {
        if (photos.length >= MAX_PHOTOS) {
            Alert.alert('Limite de fotos atingido (4)');
            return;
        }
        // Corrigido: valor correto para mediaTypes
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' });
        if (!result.canceled && result.assets && result.assets[0].uri) {
            setUploading(true);
            try {
                await uploadVehiclePhoto(vehicleId, result.assets[0].uri);
                const p = await getVehiclePhotos(vehicleId);
                setPhotos(p);
                setSnackbar({ visible: true, message: 'Foto enviada com sucesso!', error: false });
            } catch (e: any) {
                // Tenta extrair mensagem detalhada do backend
                let msg = 'Falha ao enviar foto';
                if (e?.response?.data?.message) msg = e.response.data.message;
                else if (e?.message) msg = e.message;
                setSnackbar({ visible: true, message: msg, error: true });
            } finally {
                setUploading(false);
            }
        }
    };

    const handleDeleteVehicle = async () => {
        Alert.alert('Confirmação', 'Tem certeza que deseja excluir este veículo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteVehicle(vehicleId);
                        setSnackbar({ visible: true, message: 'Veículo excluído com sucesso!', error: false });
                        navigation.goBack();
                    } catch (error) {
                        setSnackbar({ visible: true, message: 'Falha ao excluir veículo', error: true });
                    }
                }
            }
        ]);
    };

    if (loading || !vehicle) return <Text>Carregando...</Text>;

    // Exibe aviso se veículo estiver inativo
    const isInactive = vehicle.active === false;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes do Veículo</Text>
            </View>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
                {isInactive && (
                    <Card style={{ marginBottom: 16, backgroundColor: '#ffeaea', borderColor: '#b00020', borderWidth: 1 }}>
                        <Card.Content>
                            <Text style={{ color: '#b00020', fontWeight: 'bold' }}>Veículo inativo (vendido ou removido do seu perfil).</Text>
                            <Text style={{ color: '#b00020' }}>Ações de edição, exclusão, manutenção e inspeção estão desabilitadas.</Text>
                        </Card.Content>
                    </Card>
                )}
                <Card style={{ marginBottom: 16 }}>
                    <Card.Title
                        title={`${vehicle.brand?.name || ''} ${vehicle.model?.name || ''}`}
                        subtitle={vehicle.licensePlate}
                        right={() => !isInactive && (
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                                <IconButton icon="pencil" onPress={() => navigation.navigate('VehicleForm', { vehicle })} disabled={isInactive} />
                                <IconButton icon="delete" onPress={handleDeleteVehicle} disabled={isInactive} />
                            </View>
                        )}
                    />
                    <Card.Content>
                        <Text>Ano Fabricação: {vehicle.yearManufacture}</Text>
                        <Text>Ano Modelo: {vehicle.modelYear}</Text>
                        <Text>Combustível: {vehicle.fuelType}</Text>
                        <Text>Renavam: {vehicle.vin}</Text>
                        <Text>Proprietário: {vehicle.owner?.name || 'N/A'}</Text>
                        {/* Thumbnails das fotos */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                            {photos.map((photo) => (
                                <TouchableOpacity key={photo.id} onPress={() => setModalPhoto(photo)}>
                                    <Image source={{ uri: photo.url }} style={{ width: 48, height: 48, borderRadius: 6, marginRight: 4, backgroundColor: '#eee' }} />
                                </TouchableOpacity>
                            ))}
                            {!isInactive && photos.length < MAX_PHOTOS && (
                                <Button
                                    icon="camera"
                                    mode="outlined"
                                    onPress={handleAddPhoto}
                                    disabled={uploading}
                                    compact
                                    style={[{ height: 48, justifyContent: 'center' }, styles.addPhotoShadow]}
                                >
                                    {uploading ? 'Enviando...' : 'Adicionar'}
                                </Button>
                            )}
                        </View>
                    </Card.Content>
                </Card>
                {/* Modal para visualização da foto ampliada */}
                <Modal visible={!!modalPhoto} transparent animationType="fade" onRequestClose={() => setModalPhoto(null)}>
                    <TouchableWithoutFeedback onPress={() => setModalPhoto(null)}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                            {modalPhoto && (
                                <TouchableWithoutFeedback onPress={() => { }}>
                                    <View style={{ width: 345, height: 360, backgroundColor: '#222', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        <IconButton icon="close" size={28} style={{ position: 'absolute', top: 2, right: 2, zIndex: 2 }} onPress={() => setModalPhoto(null)} accessibilityLabel="Fechar imagem" />
                                        <Image source={{ uri: modalPhoto.url }} style={{ width: 345, height: 360, resizeMode: 'contain' }} />
                                    </View>
                                </TouchableWithoutFeedback>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                    duration={2500}
                    style={snackbar.error ? { backgroundColor: '#b00020' } : {}}
                >
                    {snackbar.message}
                </Snackbar>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    photoItem: {
        width: 120,
        alignItems: 'center',
        marginBottom: 8,
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: '#eee',
    },
    addPhoto: {
        justifyContent: 'center',
    },
    addPhotoShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default VehicleDetailScreen;
