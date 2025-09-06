import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Card, Text } from 'react-native-paper';

import { AppColors } from '../../styles/colors';

interface VehiclePhotosProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    editing: boolean;
    maxPhotos?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - 60) / 2; // 2 fotos por linha com margens

export default function VehiclePhotos({
    photos,
    onPhotosChange,
    editing,
    maxPhotos = 4
}: VehiclePhotosProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    // Solicitar permissões e selecionar foto
    const pickImage = async () => {
        try {
            // Verificar limite de fotos
            if (photos.length >= maxPhotos) {
                Alert.alert(
                    'Limite atingido',
                    `Você pode adicionar no máximo ${maxPhotos} fotos por veículo.`
                );
                return;
            }

            // Solicitar permissões
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permissão necessária',
                    'Precisamos de permissão para acessar suas fotos.'
                );
                return;
            }

            // Selecionar imagem
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const newPhoto = result.assets[0].uri;
                const updatedPhotos = [...photos, newPhoto];
                onPhotosChange(updatedPhotos);
                console.log('✅ Foto adicionada:', newPhoto);
            }
        } catch (error) {
            console.error('❌ Erro ao selecionar foto:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a foto');
        }
    };

    // Tirar foto com câmera
    const takePhoto = async () => {
        try {
            // Verificar limite de fotos
            if (photos.length >= maxPhotos) {
                Alert.alert(
                    'Limite atingido',
                    `Você pode adicionar no máximo ${maxPhotos} fotos por veículo.`
                );
                return;
            }

            // Solicitar permissões
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permissão necessária',
                    'Precisamos de permissão para usar a câmera.'
                );
                return;
            }

            // Tirar foto
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const newPhoto = result.assets[0].uri;
                const updatedPhotos = [...photos, newPhoto];
                onPhotosChange(updatedPhotos);
                console.log('✅ Foto capturada:', newPhoto);
            }
        } catch (error) {
            console.error('❌ Erro ao tirar foto:', error);
            Alert.alert('Erro', 'Não foi possível tirar a foto');
        }
    };

    // Mostrar opções de adicionar foto
    const showAddPhotoOptions = () => {
        Alert.alert(
            'Adicionar Foto',
            'Como você gostaria de adicionar a foto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Galeria', onPress: pickImage },
                { text: 'Câmera', onPress: takePhoto },
            ]
        );
    };

    // Remover foto
    const removePhoto = (index: number) => {
        Alert.alert(
            'Remover Foto',
            'Tem certeza que deseja remover esta foto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                        const updatedPhotos = photos.filter((_, i) => i !== index);
                        onPhotosChange(updatedPhotos);
                        console.log('🗑️ Foto removida');
                    },
                },
            ]
        );
    };

    // Renderizar placeholder para adicionar foto
    const renderAddPhotoPlaceholder = () => (
        <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={showAddPhotoOptions}
            disabled={!editing}
        >
            <MaterialCommunityIcons
                name="camera-plus"
                size={40}
                color={editing ? AppColors.primary : AppColors.gray}
            />
            <Text style={[styles.addPhotoText, { color: editing ? AppColors.text : AppColors.gray }]}>
                Adicionar Foto
            </Text>
        </TouchableOpacity>
    );

    // Renderizar foto individual
    const renderPhoto = (uri: string, index: number) => (
        <View key={index} style={styles.photoContainer}>
            <TouchableOpacity onPress={() => setSelectedPhoto(uri)}>
                <Image source={{ uri }} style={styles.photo} />
            </TouchableOpacity>
            {editing && (
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}
                >
                    <MaterialCommunityIcons
                        name="close-circle"
                        size={24}
                        color={AppColors.danger}
                    />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <Card style={styles.container}>
            <Card.Content>
                <View style={styles.header}>
                    <Text variant="titleMedium" style={styles.title}>
                        Fotos do Veículo
                    </Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
                        {photos.length}/{maxPhotos} fotos
                    </Text>
                </View>

                {photos.length === 0 && !editing ? (
                    // Estado vazio quando não está editando
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons
                            name="camera-off"
                            size={60}
                            color={AppColors.gray}
                        />
                        <Text style={styles.emptyText}>
                            Nenhuma foto cadastrada
                        </Text>
                    </View>
                ) : (
                    // Grid de fotos
                    <View style={styles.photosGrid}>
                        {photos.map((uri, index) => renderPhoto(uri, index))}

                        {/* Botão de adicionar foto se estiver editando e não atingiu o limite */}
                        {editing && photos.length < maxPhotos && renderAddPhotoPlaceholder()}
                    </View>
                )}

                {/* Modal para visualizar foto em tela cheia */}
                <Modal
                    visible={selectedPhoto !== null}
                    transparent={true}
                    onRequestClose={() => setSelectedPhoto(null)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.modalBackground}
                            onPress={() => setSelectedPhoto(null)}
                        >
                            <View style={styles.modalContent}>
                                {selectedPhoto && (
                                    <Image
                                        source={{ uri: selectedPhoto }}
                                        style={styles.fullScreenImage}
                                        resizeMode="contain"
                                    />
                                )}
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setSelectedPhoto(null)}
                                >
                                    <MaterialCommunityIcons
                                        name="close"
                                        size={30}
                                        color={AppColors.white}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 16,
        backgroundColor: AppColors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: AppColors.text,
        fontWeight: 'bold',
    },
    subtitle: {
        color: AppColors.text,
        opacity: 0.7,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: AppColors.text,
        opacity: 0.7,
        marginTop: 12,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    photo: {
        width: photoSize,
        height: photoSize,
        borderRadius: 8,
        backgroundColor: AppColors.gray,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    addPhotoButton: {
        width: photoSize,
        height: photoSize,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: AppColors.gray,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppColors.white,
        marginBottom: 16,
    },
    addPhotoText: {
        marginTop: 8,
        fontSize: 12,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '90%',
        height: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
});
