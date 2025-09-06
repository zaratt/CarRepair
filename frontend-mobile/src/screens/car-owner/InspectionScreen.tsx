import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Card, Chip, FAB, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InspectionProvider, useInspectionContext } from '../../hooks/useInspectionContext';
import { useVehicleContext, VehicleProvider } from '../../hooks/useVehicleContext';
import { AppColors } from '../../styles/colors';

// 🎯 Componente principal da tela (com provider)
export default function InspectionScreen() {
    return (
        <VehicleProvider>
            <InspectionProvider>
                <InspectionScreenContent />
            </InspectionProvider>
        </VehicleProvider>
    );
}

// 🎯 Conteúdo da tela
function InspectionScreenContent() {
    const navigation = useNavigation();
    const {
        inspections,
        inspectionsCount,
        stats,
        isLoading,
        error,
        refetch,
        isUsingRealAPI,
    } = useInspectionContext();

    const { vehicles } = useVehicleContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredInspections, setFilteredInspections] = useState<any[]>([]);

    // Função de filtro
    const filterInspections = useCallback(() => {
        let filtered = inspections || [];

        // Filtrar por busca de texto
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(inspection => {
                // Usar dados do backend ou fazer lookup como fallback
                const vehicleName = inspection.vehicleName ||
                    inspection.vehicleBrand && inspection.vehicleModel ? `${inspection.vehicleBrand} ${inspection.vehicleModel}` :
                    (() => {
                        const vehicle = (vehicles || []).find(v => v.id === inspection.vehicleId);
                        return vehicle ? `${vehicle.brand} ${vehicle.model}` : '';
                    })();

                const certificateNumber = inspection.certificateNumber?.toLowerCase() || '';
                const location = inspection.location?.toLowerCase() || '';

                return (
                    vehicleName.toLowerCase().includes(query) ||
                    certificateNumber.includes(query) ||
                    location.includes(query)
                );
            });
        }

        // Ordenar por data (mais recente primeiro)
        filtered.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

        setFilteredInspections(filtered);
    }, [inspections, vehicles, searchQuery]);    // Aplicar filtros quando os dados mudarem
    React.useEffect(() => {
        filterInspections();
    }, [filterInspections]);

    // Função de refresh
    const onRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // Navegar para detalhes
    const navigateToDetails = (inspection: any) => {
        (navigation as any).navigate('InspectionDetails', { inspectionId: inspection.id });
    };

    // Navegar para nova inspeção
    const navigateToNewInspection = () => {
        (navigation as any).navigate('AddInspection');
    };

    // Obter cor do status
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
                return AppColors.primary;
            case 'in_progress':
                return '#2196F3';
            case 'completed':
                return '#4CAF50';
            case 'cancelled':
                return AppColors.danger;
            default:
                return AppColors.gray;
        }
    };

    // Obter cor do resultado
    const getResultColor = (result: string) => {
        switch (result?.toLowerCase()) {
            case 'approved':
            case 'pass':
                return '#4CAF50';
            case 'conditional':
            case 'warning':
                return '#FF9800';
            case 'rejected':
            case 'fail':
                return AppColors.danger;
            default:
                return AppColors.gray;
        }
    };

    // Renderizar card de inspeção
    const renderInspectionCard = ({ item }: { item: any }) => {
        // Usar o nome do veículo que vem do backend, ou tentar fazer lookup como fallback
        const vehicle = (vehicles || []).find(v => v.id === item.vehicleId);
        const vehicleName = item.vehicleName ||
            item.vehicleBrand && item.vehicleModel ? `${item.vehicleBrand} ${item.vehicleModel}` :
            vehicle ? `${vehicle.brand} ${vehicle.model}` :
                'Veículo não identificado';

        return (
            <Pressable onPress={() => navigateToDetails(item)}>
                <Card style={styles.inspectionCard}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardTitleContainer}>
                                <Text variant="titleMedium" style={styles.cardTitle}>
                                    {vehicleName}
                                </Text>
                                <Text variant="bodySmall" style={styles.cardSubtitle}>
                                    {item.typeName || item.type || 'Inspeção Geral'}
                                </Text>
                            </View>

                            <Chip
                                style={[
                                    styles.statusChip,
                                    { backgroundColor: getStatusColor(item.status) }
                                ]}
                                textStyle={styles.statusChipText}
                            >
                                {item.status === 'scheduled' ? 'Agendada' :
                                    item.status === 'in_progress' ? 'Em Andamento' :
                                        item.status === 'completed' ? 'Concluída' :
                                            item.status === 'cancelled' ? 'Cancelada' :
                                                item.status}
                            </Chip>
                        </View>

                        <View style={styles.cardDetails}>
                            <View style={styles.cardDetailRow}>
                                <MaterialCommunityIcons
                                    name="calendar"
                                    size={16}
                                    color={AppColors.text}
                                />
                                <Text variant="bodySmall" style={styles.cardDetailText}>
                                    {format(new Date(item.scheduledDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </Text>
                            </View>

                            {item.location && (
                                <View style={styles.cardDetailRow}>
                                    <MaterialCommunityIcons
                                        name="map-marker"
                                        size={16}
                                        color={AppColors.text}
                                    />
                                    <Text variant="bodySmall" style={styles.cardDetailText}>
                                        {item.location}
                                    </Text>
                                </View>
                            )}

                            {item.certificateNumber && (
                                <View style={styles.cardDetailRow}>
                                    <MaterialCommunityIcons
                                        name="certificate"
                                        size={16}
                                        color={AppColors.text}
                                    />
                                    <Text variant="bodySmall" style={styles.cardDetailText}>
                                        Certificado: {item.certificateNumber}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {item.overallRating && (
                            <View style={styles.cardFooter}>
                                <Chip
                                    style={[
                                        styles.resultChip,
                                        { backgroundColor: getResultColor(item.overallRating) }
                                    ]}
                                    textStyle={styles.resultChipText}
                                >
                                    {item.overallRating === 'EXCELLENT' ? 'Excelente' :
                                        item.overallRating === 'GOOD' ? 'Bom' :
                                            item.overallRating === 'FAIR' ? 'Regular' :
                                                item.overallRating === 'POOR' ? 'Ruim' :
                                                    item.overallRating === 'CRITICAL' ? 'Crítico' :
                                                        item.overallRating}
                                </Chip>
                            </View>
                        )}
                    </Card.Content>
                </Card>
            </Pressable>
        );
    };

    // Componente vazio
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={64}
                color={AppColors.gray}
                style={styles.emptyIcon}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
                {searchQuery
                    ? 'Nenhuma inspeção encontrada'
                    : 'Nenhuma inspeção registrada'
                }
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {searchQuery
                    ? 'Tente ajustar os filtros de busca'
                    : 'Agende sua primeira inspeção'
                }
            </Text>
        </View>
    );

    // Header com estatísticas
    const renderHeader = () => (
        <View style={styles.header}>
            {/* Barra de busca */}
            <Searchbar
                placeholder="Buscar por veículo, certificado ou local..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                iconColor={AppColors.primary}
            />

            {/* Estatísticas */}
            {stats && (
                <View style={styles.statsContainer}>
                    <Text variant="titleMedium" style={styles.statsTitle}>
                        Resumo das Inspeções
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text variant="headlineSmall" style={styles.statNumber}>
                                {stats.total}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                Total
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text variant="headlineSmall" style={styles.statNumber}>
                                {stats.completed}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                Concluídas
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text variant="headlineSmall" style={styles.statNumber}>
                                {stats.upcomingDue}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                Próximas
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text variant="headlineSmall" style={[styles.statNumber, { color: AppColors.danger }]}>
                                {stats.overdueInspections}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                Vencidas
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredInspections}
                keyExtractor={(item) => item.id}
                renderItem={renderInspectionCard}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefresh}
                        colors={[AppColors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    filteredInspections.length === 0 && styles.emptyListContent
                ]}
            />

            {/* FAB para nova inspeção */}
            <FAB
                icon="plus"
                onPress={navigateToNewInspection}
                style={styles.fab}
                color={AppColors.white}
            />

            {/* Debug info */}
            {!isUsingRealAPI && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>
                        🔧 Modo Mock - {(inspections || []).length} inspeções
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    header: {
        padding: 16,
        backgroundColor: AppColors.white,
    },
    searchbar: {
        marginBottom: 16,
        backgroundColor: AppColors.white,
        elevation: 2,
    },
    statsContainer: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        marginBottom: 8,
    },
    statsTitle: {
        color: AppColors.text,
        marginBottom: 12,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    statLabel: {
        color: AppColors.text,
        marginTop: 4,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 100,
    },
    emptyListContent: {
        flexGrow: 1,
    },
    inspectionCard: {
        margin: 8,
        marginHorizontal: 16,
        elevation: 2,
        backgroundColor: AppColors.white,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitleContainer: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        color: AppColors.text,
        fontWeight: '600',
    },
    cardSubtitle: {
        color: AppColors.secondary,
        marginTop: 2,
    },
    statusChip: {
        height: 32,
    },
    statusChipText: {
        color: AppColors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    cardDetails: {
        marginBottom: 12,
    },
    cardDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardDetailText: {
        color: AppColors.text,
        marginLeft: 8,
        flex: 1,
    },
    cardFooter: {
        alignItems: 'flex-start',
    },
    resultChip: {
        height: 28,
    },
    resultChipText: {
        color: AppColors.white,
        fontSize: 11,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 64,
    },
    emptyIcon: {
        opacity: 0.5,
        marginBottom: 16,
    },
    emptyTitle: {
        color: AppColors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: AppColors.secondary,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
        backgroundColor: AppColors.primary,
    },
    debugContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 4,
        borderRadius: 4,
    },
    debugText: {
        color: 'white',
        fontSize: 10,
    },
});
