import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardSummary, useDashboardVehicles } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();

    // Queries
    const {
        data: summary,
        isLoading: summaryLoading,
        refetch: refetchSummary
    } = useDashboardSummary(user?.id || '');

    const {
        data: vehicles,
        isLoading: vehiclesLoading,
        refetch: refetchVehicles
    } = useDashboardVehicles(user?.id || '');

    const isLoading = summaryLoading || vehiclesLoading;

    // Refresh control
    const onRefresh = useCallback(async () => {
        await Promise.all([refetchSummary(), refetchVehicles()]);
    }, [refetchSummary, refetchVehicles]);

    // Formatação de valores
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatKm = (km: number) => {
        return new Intl.NumberFormat('pt-BR').format(km);
    };

    // Memoização dos cards de resumo
    const summaryCards = useMemo(() => [
        {
            icon: 'car',
            value: summary?.totalVehicles || 0,
            label: 'Veículos',
            color: '#1976d2',
            backgroundColor: '#e3f2fd',
            onPress: () => (navigation as any).navigate('Vehicles')
        },
        {
            icon: 'wrench',
            value: summary?.totalMaintenances || 0,
            label: 'Manutenções',
            color: '#7b1fa2',
            backgroundColor: '#f3e5f5',
            onPress: () => (navigation as any).navigate('Maintenance')
        },
        {
            icon: 'garage',
            value: summary?.totalWorkshopsUsed || 0,
            label: 'Oficinas',
            color: '#388e3c',
            backgroundColor: '#e8f5e8',
            onPress: () => (navigation as any).navigate('Workshops')
        },
        {
            icon: 'currency-usd',
            value: formatCurrency(summary?.averageSpending || 0),
            label: 'Gasto Médio',
            color: '#f57c00',
            backgroundColor: '#fff3e0',
            onPress: () => (navigation as any).navigate('Maintenance')
        }
    ], [summary, navigation]);

    // Renderização de cards de resumo
    const renderSummaryCard = ({ item, index }: { item: typeof summaryCards[0], index: number }) => (
        <Pressable
            style={[styles.summaryCard, { backgroundColor: item.backgroundColor }]}
            onPress={item.onPress}
        >
            <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
                <Text variant="headlineSmall" style={styles.cardNumber}>
                    {typeof item.value === 'string' ? item.value : item.value.toString()}
                </Text>
                <Text variant="bodySmall" style={styles.cardLabel}>{item.label}</Text>
            </Card.Content>
        </Pressable>
    );

    // Renderização de veículo
    const renderVehicle = ({ item }: { item: any }) => {
        const lastMaintenance = item.lastMaintenance;
        const upcomingMaintenance = item.upcomingMaintenances?.[0];

        return (
            <Pressable
                style={styles.vehicleCard}
                onPress={() => (navigation as any).navigate('VehicleDetails', { vehicleId: item.id })}
            >
                <Card.Content>
                    <View style={styles.vehicleInfo}>
                        <MaterialCommunityIcons name="car-side" size={40} color="#1976d2" />
                        <View style={styles.vehicleDetails}>
                            <Text variant="titleMedium">{item.brand} {item.model}</Text>
                            <Text variant="bodySmall" style={styles.vehicleSubtext}>
                                {formatKm(item.currentKm)} km • Placa: {item.licensePlate}
                            </Text>
                            {lastMaintenance && (
                                <Text variant="bodySmall" style={styles.vehicleSubtext}>
                                    Última manutenção: {format(new Date(lastMaintenance.date), 'dd/MM/yyyy', { locale: ptBR })}
                                </Text>
                            )}
                            {upcomingMaintenance && (
                                <Text variant="bodySmall" style={styles.nextMaintenance}>
                                    📅 Próxima: {upcomingMaintenance.description}
                                </Text>
                            )}
                            <Text variant="bodySmall" style={styles.maintenanceCount}>
                                {item.totalMaintenances} manutenções • {formatCurrency(item.averageSpending)} em média
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Pressable>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text variant="bodyMedium" style={styles.loadingText}>
                        Carregando dashboard...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.welcomeText}>
                        Olá, {user?.name || 'Usuário'}! 👋
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitleText}>
                        Aqui está o resumo dos seus veículos
                    </Text>
                </View>

                {/* Cards de Resumo */}
                <View style={styles.cardsContainer}>
                    <FlatList
                        data={summaryCards}
                        renderItem={renderSummaryCard}
                        keyExtractor={(_, index) => index.toString()}
                        numColumns={2}
                        scrollEnabled={false}
                        contentContainerStyle={styles.cardsGrid}
                        columnWrapperStyle={styles.cardRow}
                    />
                </View>

                {/* Seção Meus Veículos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>
                            Meus Veículos
                        </Text>
                        <Pressable onPress={() => (navigation as any).navigate('Vehicles')}>
                            <Text variant="bodyMedium" style={styles.seeAllText}>
                                Ver todos
                            </Text>
                        </Pressable>
                    </View>

                    {vehicles && vehicles.length > 0 ? (
                        <FlatList
                            data={vehicles}
                            renderItem={renderVehicle}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Card.Content style={styles.emptyContent}>
                                <MaterialCommunityIcons name="car-off" size={48} color="#666" />
                                <Text variant="titleMedium" style={styles.emptyTitle}>
                                    Nenhum veículo cadastrado
                                </Text>
                                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                                    Adicione seu primeiro veículo para começar
                                </Text>
                                <Pressable
                                    style={styles.addButton}
                                    onPress={() => (navigation as any).navigate('Vehicles')}
                                >
                                    <Text variant="bodyMedium" style={styles.addButtonText}>
                                        Adicionar Veículo
                                    </Text>
                                </Pressable>
                            </Card.Content>
                        </Card>
                    )}
                </View>

                {/* Espaço extra para tab bar flutuante */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    welcomeText: {
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    subtitleText: {
        color: '#666',
    },
    cardsContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    cardsGrid: {
        gap: 10,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    summaryCard: {
        flex: 1,
        marginHorizontal: 5,
        elevation: 3,
        borderRadius: 12,
    },
    cardContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    cardNumber: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    cardLabel: {
        color: '#666',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#222',
    },
    seeAllText: {
        color: '#1976d2',
        fontWeight: '500',
    },
    vehicleCard: {
        marginBottom: 15,
        elevation: 2,
        borderRadius: 12,
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleDetails: {
        flex: 1,
        marginLeft: 15,
    },
    vehicleSubtext: {
        color: '#666',
        marginTop: 4,
    },
    nextMaintenance: {
        color: '#1976d2',
        marginTop: 4,
        fontWeight: '500',
    },
    maintenanceCount: {
        color: '#888',
        marginTop: 4,
        fontSize: 12,
    },
    emptyCard: {
        elevation: 2,
        borderRadius: 12,
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        color: '#222',
    },
    emptySubtitle: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    addButton: {
        backgroundColor: '#1976d2',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    bottomSpacer: {
        height: 112, // ✅ Mudança: 120px → 112px (8px a menos devido ao reposicionamento da tab bar)
    },
});
