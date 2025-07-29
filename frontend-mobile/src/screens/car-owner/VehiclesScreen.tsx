import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import VehicleCard from '../../components/vehicle/VehicleCard';
import { mockVehicles } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { Vehicle } from '../../types/vehicle.types';

export default function VehiclesScreen() {
    const navigation = useNavigation();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Carregar veículos
    const loadVehicles = async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // TODO: Remover mock e usar API real
            // const vehiclesData = await vehicleApiService.getUserVehicles();

            // Simulando delay da API
            await new Promise(resolve => setTimeout(() => resolve(true), 1000));
            const vehiclesData = mockVehicles;

            setVehicles(vehiclesData);
            console.log(`✅ ${vehiclesData.length} veículos carregados`);
        } catch (error) {
            console.error('❌ Erro ao carregar veículos:', error);
            // TODO: Mostrar toast/snackbar de erro
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Carregar dados quando a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            loadVehicles();
        }, [])
    );

    // Pull to refresh
    const handleRefresh = () => {
        loadVehicles(true);
    };

    // Navegar para detalhes do veículo
    const handleVehiclePress = (vehicle: Vehicle) => {
        console.log('🚗 Navegando para detalhes do veículo:', vehicle.id);
        (navigation as any).navigate('VehicleDetails', { vehicleId: vehicle.id });
    };

    // Navegar para adicionar veículo
    const handleAddVehicle = () => {
        console.log('➕ Navegando para adicionar veículo');
        // (navigation as any).navigate('AddVehicle');
        console.log('⚠️ AddVehicle ainda não implementado');
    };

    // Renderizar item da lista
    const renderVehicleItem = ({ item }: { item: Vehicle }) => (
        <VehicleCard
            vehicle={item}
            onPress={handleVehiclePress}
        />
    );

    // Empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
                name="car-off"
                size={80}
                color={AppColors.primary}
                style={styles.emptyIcon}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
                Nenhum veículo cadastrado
            </Text>
            <Text variant="bodyLarge" style={styles.emptyMessage}>
                Adicione seu primeiro veículo usando o botão abaixo
            </Text>
        </View>
    );

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
                        Carregando veículos...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={vehicles}
                renderItem={renderVehicleItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[AppColors.primary]}
                        tintColor={AppColors.primary}
                    />
                }
                ListEmptyComponent={renderEmptyState}
            />

            {/* FAB para adicionar veículo */}
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={handleAddVehicle}
                label="Adicionar"
                color={AppColors.text}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 120, // Espaço para FAB + tabs
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    emptyIcon: {
        marginBottom: 24,
    },
    emptyTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyMessage: {
        color: AppColors.text,
        opacity: 0.8,
        textAlign: 'center',
        lineHeight: 24,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 130, // 122px + 8px (subir como solicitado)
        backgroundColor: AppColors.primary,
        borderRadius: 28,
    },
});
