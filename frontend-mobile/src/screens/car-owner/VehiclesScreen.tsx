import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import VehicleCard from '../../components/vehicle/VehicleCard';
import { useVehicleContext } from '../../hooks/useVehicleContext';
import { AppColors } from '../../styles/colors';
import { Vehicle } from '../../types/vehicle.types';

// 🏗️ Componente interno que usa o contexto
const VehiclesContent = () => {
    const navigation = useNavigation();
    const {
        vehicles,
        isLoading,
        error,
        refetch,
        isUsingRealAPI
    } = useVehicleContext();

    // 🔍 Debug logs
    console.log('📱 VehiclesScreen - Loading:', isLoading, 'Error:', error, 'Vehicles:', vehicles);
    console.log('📊 VehiclesScreen - Count:', vehicles?.length || 0);

    // Navegar para detalhes do veículo
    const handleVehiclePress = (vehicle: any) => { // Temporary any type to avoid conflicts
        console.log('🚗 Navegando para detalhes do veículo:', vehicle.id);
        (navigation as any).navigate('VehicleDetails', { vehicleId: vehicle.id });
    };

    // Navegar para adicionar veículo
    const handleAddVehicle = () => {
        console.log('➕ Navegando para adicionar veículo');
        (navigation as any).navigate('AddVehicle');
    };

    // Pull to refresh
    const handleRefresh = useCallback(() => {
        console.log('🔄 Atualizando lista de veículos...');
        refetch();
    }, [refetch]);

    // Renderizar item da lista
    const renderVehicleItem = ({ item }: { item: any }) => ( // Temporary any type
        <VehicleCard
            vehicle={item as Vehicle} // Cast to expected type
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
            {/* Debug info */}
            <Text variant="bodySmall" style={styles.debugText}>
                Sistema ativo: {isUsingRealAPI ? '🌐 API Real' : '🔧 Mock'}
            </Text>
        </View>
    );

    // Error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons
                        name="alert-circle"
                        size={60}
                        color={AppColors.danger}
                    />
                    <Text variant="headlineSmall" style={styles.errorTitle}>
                        Erro ao carregar veículos
                    </Text>
                    <Text variant="bodyLarge" style={styles.errorMessage}>
                        {error}
                    </Text>
                    <FAB
                        style={styles.retryFab}
                        icon="refresh"
                        onPress={handleRefresh}
                        label="Tentar novamente"
                        color={AppColors.text}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // Loading state
    if (isLoading) {
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
                    <Text variant="bodySmall" style={styles.debugText}>
                        Sistema: {isUsingRealAPI ? '🌐 API Real' : '🔧 Mock'}
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
                        refreshing={false}
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
};

// 🏗️ Componente principal (Provider já está no VehicleStackNavigator)
export default function VehiclesScreen() {
    return <VehiclesContent />;
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
        marginBottom: 8,
    },
    errorMessage: {
        color: AppColors.text,
        opacity: 0.8,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16,
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
        marginBottom: 16,
    },
    debugText: {
        color: AppColors.primary,
        fontSize: 12,
        opacity: 0.8,
        textAlign: 'center',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 130, // 122px + 8px (subir como solicitado)
        backgroundColor: AppColors.primary,
        borderRadius: 28,
    },
    retryFab: {
        backgroundColor: AppColors.primary,
        borderRadius: 28,
        marginTop: 16,
    },
});

