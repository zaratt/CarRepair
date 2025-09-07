import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useVehicles } from '../../hooks/useVehicles';
import { vehicleApiService } from '../../services/vehicleApi';
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
    const [deleting, setDeleting] = useState(false);

    const { refetch } = useVehicles();

    // Carregar dados do veículo
    useEffect(() => {
        loadVehicleData();
    }, [vehicleId]);

    const loadVehicleData = async () => {
        try {
            setLoading(true);
            const vehicleData = await vehicleApiService.getVehicleById(vehicleId);
            setVehicle(vehicleData);
        } catch (error) {
            console.error('Erro ao carregar veículo:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do veículo.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        Alert.alert(
            'Editar Veículo',
            'A funcionalidade de edição será implementada em breve.\n\nCampos editáveis:\n• Quilometragem\n• Cor\n• RENAVAM (VIN)\n• Ano de Fabricação\n• Ano Modelo',
            [{ text: 'OK' }]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Excluir Veículo',
            `Tem certeza que deseja excluir o veículo ${vehicle?.plate}?\n\nEsta ação não pode ser desfeita.`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        if (!vehicle) return;

        try {
            setDeleting(true);
            await vehicleApiService.deleteVehicle(vehicle.id);

            // Log da ação de exclusão para auditoria
            console.log(`🗑️ [AUDIT_LOG] Veículo excluído:`, {
                vehicleId: vehicle.id,
                plate: vehicle.plate,
                userId: vehicle.userId,
                timestamp: new Date().toISOString(),
                action: 'DELETE_VEHICLE'
            });

            Alert.alert('Sucesso', 'Veículo excluído com sucesso!');
            refetch();
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao excluir veículo:', error);
            Alert.alert('Erro', 'Não foi possível excluir o veículo. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    };

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return 'Não informado';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={styles.loadingText}>Carregando detalhes...</Text>
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
                        size={64}
                        color={AppColors.secondary}
                    />
                    <Text style={styles.errorText}>Veículo não encontrado</Text>
                    <Button mode="outlined" onPress={() => navigation.goBack()}>
                        Voltar
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <Card style={styles.mainCard}>
                    <Card.Content>
                        <View style={styles.vehicleHeader}>
                            <MaterialCommunityIcons
                                name="car"
                                size={48}
                                color={AppColors.primary}
                                style={styles.vehicleIcon}
                            />
                            <View style={styles.vehicleMainInfo}>
                                <Text variant="headlineSmall" style={styles.vehicleTitle}>
                                    {vehicle.brand} {vehicle.model}
                                </Text>
                                <Text variant="bodyLarge" style={styles.vehiclePlate}>
                                    Placa: {vehicle.plate}
                                </Text>
                                <Text variant="bodyMedium" style={styles.vehicleKm}>
                                    {vehicleApiService.formatKm(vehicle.currentKm)}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.detailsCard}>
                    <Card.Title
                        title="Informações Técnicas"
                        left={(props) => <MaterialCommunityIcons name="information" {...props} />}
                    />
                    <Card.Content>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="calendar" size={20} color={AppColors.secondary} />
                            <Text style={styles.detailLabel}>Ano de Fabricação:</Text>
                            <Text style={styles.detailValue}>{vehicle.year}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="calendar-clock" size={20} color={AppColors.secondary} />
                            <Text style={styles.detailLabel}>Ano Modelo:</Text>
                            <Text style={styles.detailValue}>{vehicle.year}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="card-text" size={20} color={AppColors.secondary} />
                            <Text style={styles.detailLabel}>RENAVAM (VIN):</Text>
                            <Text style={styles.detailValue}>{vehicle.vin || 'Não informado'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="currency-usd" size={20} color={AppColors.secondary} />
                            <Text style={styles.detailLabel}>Tabela FIPE:</Text>
                            <Text style={styles.detailValue}>{formatCurrency(vehicle.fipeValue)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="palette" size={20} color={AppColors.secondary} />
                            <Text style={styles.detailLabel}>Cor:</Text>
                            <Text style={styles.detailValue}>{vehicle.color || 'Não informada'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.recommendationsCard}>
                    <Card.Title
                        title="Recomendações do Fabricante"
                        subtitle="Em breve"
                        left={(props) => <MaterialCommunityIcons name="wrench" {...props} />}
                    />
                    <Card.Content>
                        <Text style={styles.comingSoonText}>
                            🔧 Próximas manutenções{'\n'}
                            🛢️ Óleo recomendado{'\n'}
                            🔩 Filtros recomendados{'\n'}
                            📋 Cronograma de manutenção
                        </Text>
                        <Text style={styles.comingSoonSubtext}>
                            Esta funcionalidade estará disponível em breve!
                        </Text>
                    </Card.Content>
                </Card>

                <View style={styles.actionsContainer}>
                    <Button
                        mode="contained"
                        onPress={handleEdit}
                        style={styles.editButton}
                        icon="pencil"
                        textColor={AppColors.text}
                    >
                        Editar
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={handleDelete}
                        style={styles.deleteButton}
                        textColor={AppColors.danger}
                        icon="delete"
                        loading={deleting}
                        disabled={deleting}
                    >
                        {deleting ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </View>
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.white },
    scrollView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    loadingText: { marginTop: 16, color: AppColors.text },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    errorText: { marginTop: 16, marginBottom: 24, textAlign: 'center', color: AppColors.text },
    mainCard: { margin: 16, marginBottom: 8, elevation: 2 },
    vehicleHeader: { flexDirection: 'row', alignItems: 'center' },
    vehicleIcon: { marginRight: 16 },
    vehicleMainInfo: { flex: 1 },
    vehicleTitle: { fontWeight: 'bold', color: AppColors.text, marginBottom: 4 },
    vehiclePlate: { color: AppColors.text, marginBottom: 2 },
    vehicleKm: { color: AppColors.secondary },
    detailsCard: { marginHorizontal: 16, marginBottom: 8, elevation: 2 },
    detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    detailLabel: { flex: 1, marginLeft: 12, color: AppColors.text, fontSize: 14 },
    detailValue: { color: AppColors.text, fontSize: 14, fontWeight: '500' },
    recommendationsCard: { marginHorizontal: 16, marginBottom: 8, elevation: 2, opacity: 0.7 },
    // ✅ Textos em preto para melhor legibilidade
    comingSoonText: { color: AppColors.text, lineHeight: 24, marginBottom: 12 },
    comingSoonSubtext: { color: AppColors.text, fontSize: 12, fontStyle: 'italic' },
    // ✅ Botões lado a lado com espaçamento adequado
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 12,
        paddingBottom: 16
    },
    // ✅ Botão editar com texto preto
    editButton: {
        flex: 1,
        backgroundColor: AppColors.primary,
    },
    deleteButton: {
        flex: 1,
        borderColor: AppColors.danger
    },
    bottomSpacing: { height: 100 }, // ✅ Espaço suficiente para floating tabs
});