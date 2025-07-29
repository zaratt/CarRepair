import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import VehiclePhotos from '../../components/vehicle/VehiclePhotos';
import { mockVehicles, updateVehicle } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { Vehicle } from '../../types/vehicle.types';

interface RouteParams {
    vehicleId: string;
}

export default function VehicleDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { vehicleId } = route.params as RouteParams;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Estados para campos editáveis
    const [editPlate, setEditPlate] = useState('');
    const [editKm, setEditKm] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editPhotos, setEditPhotos] = useState<string[]>([]);

    // Carregar dados do veículo
    useEffect(() => {
        loadVehicleData();
    }, [vehicleId]);

    const loadVehicleData = async () => {
        try {
            setLoading(true);

            // TODO: Remover mock e usar API real
            // const vehicleData = await vehicleApiService.getVehicleById(vehicleId);

            // Simulando delay da API
            await new Promise(resolve => setTimeout(() => resolve(true), 800));
            const vehicleData = mockVehicles.find(v => v.id === vehicleId);

            if (vehicleData) {
                setVehicle(vehicleData);
                // Inicializar campos editáveis
                setEditPlate(vehicleData.plate);
                setEditKm(vehicleData.currentKm.toString());
                setEditColor(vehicleData.color || ''); // Handle optional color
                setEditPhotos(vehicleData.photos || []); // Handle optional photos
                console.log('✅ Dados do veículo carregados:', vehicleData.brand, vehicleData.model);
            } else {
                console.error('❌ Veículo não encontrado');
                Alert.alert('Erro', 'Veículo não encontrado');
                navigation.goBack();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados do veículo:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do veículo');
        } finally {
            setLoading(false);
        }
    };

    // Alternar modo de edição
    const handleEditToggle = () => {
        if (editing) {
            // Cancelar edição - restaurar valores originais
            if (vehicle) {
                setEditPlate(vehicle.plate);
                setEditKm(vehicle.currentKm.toString());
                setEditColor(vehicle.color || ''); // Handle optional color
                setEditPhotos(vehicle.photos || []); // Handle optional photos
            }
            setEditing(false);
        } else {
            // Iniciar edição
            setEditing(true);
        }
    };

    // Salvar alterações
    const handleSave = async () => {
        if (!vehicle) return;

        try {
            setSaving(true);

            // Validações básicas
            if (!editPlate.trim()) {
                Alert.alert('Erro', 'A placa é obrigatória');
                return;
            }

            if (!editKm.trim() || isNaN(Number(editKm))) {
                Alert.alert('Erro', 'KM deve ser um número válido');
                return;
            }

            if (!editColor.trim()) {
                Alert.alert('Erro', 'A cor é obrigatória');
                return;
            }

            // Dados atualizados (apenas campos editáveis)
            const updatedData = {
                plate: editPlate.trim().toUpperCase(),
                currentKm: Number(editKm),
                color: editColor.trim(),
                photos: editPhotos, // Incluir fotos nos dados atualizados
            };

            // TODO: Remover mock e usar API real
            // await vehicleApiService.updateVehicle(vehicleId, updatedData);

            // Simulando API call
            await new Promise(resolve => setTimeout(() => resolve(true), 1000));
            const updatedVehicle = await updateVehicle(vehicleId, updatedData);

            setVehicle(updatedVehicle);
            setEditing(false);

            console.log('✅ Veículo atualizado com sucesso');
            Alert.alert('Sucesso', 'Dados do veículo atualizados com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            Alert.alert('Erro', 'Não foi possível salvar as alterações');
        } finally {
            setSaving(false);
        }
    };

    // Excluir veículo
    const handleDelete = () => {
        if (!vehicle) return;

        Alert.alert(
            'Excluir Veículo',
            `Tem certeza que deseja excluir o ${vehicle.brand} ${vehicle.model}?\n\nEsta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // TODO: Implementar API de exclusão
                            // await vehicleApiService.deleteVehicle(vehicleId);

                            console.log('🗑️ Veículo excluído:', vehicle.brand, vehicle.model);
                            Alert.alert('Sucesso', 'Veículo excluído com sucesso!', [
                                { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                        } catch (error) {
                            console.error('❌ Erro ao excluir veículo:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o veículo');
                        }
                    },
                },
            ]
        );
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons
                        name="car"
                        size={60}
                        color={AppColors.primary}
                    />
                    <Text variant="bodyLarge" style={styles.loadingText}>
                        Carregando dados do veículo...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!vehicle) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons
                        name="car-off"
                        size={80}
                        color={AppColors.danger}
                    />
                    <Text variant="headlineSmall" style={styles.errorTitle}>
                        Veículo não encontrado
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        Voltar
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Componente de fotos do veículo */}
                <VehiclePhotos
                    photos={editPhotos}
                    onPhotosChange={setEditPhotos}
                    editing={editing}
                    maxPhotos={4}
                />

                {/* Card com informações do veículo */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <Text variant="headlineSmall" style={styles.sectionTitle}>
                            Informações do Veículo
                        </Text>

                        {/* Informações fixas (não editáveis) */}
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="car" size={20} color={AppColors.text} />
                            <Text style={styles.infoLabel}>Marca:</Text>
                            <Text style={styles.infoValue}>{vehicle.brand}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="car-sports" size={20} color={AppColors.text} />
                            <Text style={styles.infoLabel}>Modelo:</Text>
                            <Text style={styles.infoValue}>{vehicle.model}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar" size={20} color={AppColors.text} />
                            <Text style={styles.infoLabel}>Ano:</Text>
                            <Text style={styles.infoValue}>{vehicle.year}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="currency-usd" size={20} color={AppColors.text} />
                            <Text style={styles.infoLabel}>Valor FIPE:</Text>
                            <Text style={styles.infoValue}>R$ {vehicle.fipeValue.toLocaleString('pt-BR')}</Text>
                        </View>

                        {/* Campos editáveis */}
                        <View style={styles.editableSection}>
                            <Text variant="titleMedium" style={styles.editableSectionTitle}>
                                Dados Editáveis
                            </Text>

                            {/* Placa */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Placa:</Text>
                                {editing ? (
                                    <TextInput
                                        value={editPlate}
                                        onChangeText={setEditPlate}
                                        style={styles.textInput}
                                        mode="outlined"
                                        placeholder="ABC-1234"
                                        autoCapitalize="characters"
                                        maxLength={8}
                                    />
                                ) : (
                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="card-text" size={20} color={AppColors.text} />
                                        <Text style={styles.infoValue}>{vehicle.plate}</Text>
                                    </View>
                                )}
                            </View>

                            {/* KM Atual */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>KM Atual:</Text>
                                {editing ? (
                                    <TextInput
                                        value={editKm}
                                        onChangeText={setEditKm}
                                        style={styles.textInput}
                                        mode="outlined"
                                        placeholder="85240"
                                        keyboardType="numeric"
                                    />
                                ) : (
                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="speedometer" size={20} color={AppColors.text} />
                                        <Text style={styles.infoValue}>{vehicle.currentKm.toLocaleString('pt-BR')} km</Text>
                                    </View>
                                )}
                            </View>

                            {/* Cor */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Cor:</Text>
                                {editing ? (
                                    <TextInput
                                        value={editColor}
                                        onChangeText={setEditColor}
                                        style={styles.textInput}
                                        mode="outlined"
                                        placeholder="Prata"
                                    />
                                ) : (
                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="palette" size={20} color={AppColors.text} />
                                        <Text style={styles.infoValue}>{vehicle.color || 'Não informado'}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Botões de ação */}
                <View style={styles.actionButtons}>
                    {editing ? (
                        <View style={styles.editingButtons}>
                            <Button
                                mode="outlined"
                                onPress={handleEditToggle}
                                style={styles.cancelButton}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={saving}
                                disabled={saving}
                            >
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </View>
                    ) : (
                        <View style={styles.viewButtons}>
                            <Button
                                mode="contained"
                                onPress={handleEditToggle}
                                style={styles.editButton}
                                icon="pencil"
                                labelStyle={{ color: AppColors.text }}
                            >
                                Editar
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={handleDelete}
                                style={styles.deleteButton}
                                icon="delete"
                                textColor={AppColors.danger}
                            >
                                Excluir
                            </Button>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        color: AppColors.text,
        marginTop: 16,
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: AppColors.primary,
    },
    infoCard: {
        margin: 16,
        backgroundColor: AppColors.white,
    },
    sectionTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        color: AppColors.text,
        fontWeight: '600',
        marginLeft: 8,
        marginRight: 8,
        minWidth: 80,
    },
    infoValue: {
        color: AppColors.text,
        flex: 1,
    },
    editableSection: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: AppColors.gray,
    },
    editableSectionTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: AppColors.white,
    },
    actionButtons: {
        padding: 16,
        paddingBottom: 100, // Espaço maior para bottom tabs + safe area
    },
    editButton: {
        flex: 2,
        backgroundColor: AppColors.primary,
    },
    viewButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteButton: {
        flex: 1,
        borderColor: AppColors.danger,
    },
    editingButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        borderColor: AppColors.gray,
    },
    saveButton: {
        flex: 2,
        backgroundColor: AppColors.primary,
    },
});
