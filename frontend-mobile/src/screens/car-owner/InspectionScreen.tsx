import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, FAB, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getInspectionsByUser, getInspectionStats } from '../../data/mockInspections';
import { AppColors } from '../../styles/colors';
import { Inspection, INSPECTION_RESULTS, INSPECTION_STATUS, InspectionFilters } from '../../types/inspection.types';

export default function InspectionScreen() {
    const navigation = useNavigation();
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        expiring: 0,
        expired: 0,
        approved: 0,
        conditional: 0,
        rejected: 0
    });

    // Filtros ativos
    const [activeFilters, setActiveFilters] = useState<InspectionFilters>({});

    // Carregar dados
    const loadData = useCallback(() => {
        const userInspections = getInspectionsByUser('user1');
        const userStats = getInspectionStats('user1');

        setInspections(userInspections);
        setFilteredInspections(userInspections);
        setStats(userStats);
    }, []);

    // Carregar dados quando a tela ganhar foco
    useFocusEffect(loadData);

    // Função de refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000)); // Simular delay
        loadData();
        setRefreshing(false);
    }, [loadData]);

    // Filtrar inspeções
    const filterInspections = useCallback((
        inspectionsList: Inspection[],
        search: string,
        filters: InspectionFilters
    ) => {
        let filtered = [...inspectionsList];

        // Filtro de busca por placa, marca ou modelo
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(inspection =>
                inspection.vehiclePlate.toLowerCase().includes(searchLower) ||
                inspection.vehicleBrand.toLowerCase().includes(searchLower) ||
                inspection.vehicleModel.toLowerCase().includes(searchLower) ||
                inspection.inspectionCenter.name.toLowerCase().includes(searchLower)
            );
        }

        // Filtro por status
        if (filters.status) {
            filtered = filtered.filter(inspection => inspection.status === filters.status);
        }

        // Filtro por tipo
        if (filters.type) {
            filtered = filtered.filter(inspection => inspection.type === filters.type);
        }

        // Filtro por resultado
        if (filters.result) {
            filtered = filtered.filter(inspection => inspection.result === filters.result);
        }

        // Filtro por veículo
        if (filters.vehicleId) {
            filtered = filtered.filter(inspection => inspection.vehicleId === filters.vehicleId);
        }

        return filtered;
    }, []);

    // Aplicar filtros quando houver mudanças
    React.useEffect(() => {
        const filtered = filterInspections(inspections, searchQuery, activeFilters);
        setFilteredInspections(filtered);
    }, [inspections, searchQuery, activeFilters, filterInspections]);

    // Aplicar/remover filtro
    const toggleFilter = (key: keyof InspectionFilters, value: any) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (newFilters[key] === value) {
                delete newFilters[key];
            } else {
                newFilters[key] = value;
            }
            return newFilters;
        });
    };

    // Navegar para detalhes
    const navigateToDetails = (inspection: Inspection) => {
        (navigation as any).navigate('InspectionDetails', { inspectionId: inspection.id });
    };

    // Obter cor do status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valid': return '#4CAF50';
            case 'expiring_soon': return '#FF9800';
            case 'expired': return '#F44336';
            default: return '#666';
        }
    };

    // Obter cor do resultado
    const getResultColor = (result: string) => {
        switch (result) {
            case 'approved': return '#4CAF50';
            case 'conditional': return '#FF9800';
            case 'rejected': return '#F44336';
            default: return '#666';
        }
    };

    // Renderizar card de vistoria
    const renderInspectionCard = ({ item }: { item: Inspection }) => (
        <Pressable onPress={() => navigateToDetails(item)}>
            <Card style={styles.inspectionCard}>
                <Card.Content>
                    {/* Header do card */}
                    <View style={styles.cardHeader}>
                        <View style={styles.vehicleInfo}>
                            <Text variant="titleMedium" style={styles.vehicleName}>
                                {item.vehicleBrand} {item.vehicleModel}
                            </Text>
                            <Text variant="bodySmall" style={styles.vehiclePlate}>
                                {item.vehiclePlate}
                            </Text>
                        </View>
                        <View style={styles.statusContainer}>
                            <Chip
                                mode="flat"
                                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
                                textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
                            >
                                {INSPECTION_STATUS[item.status]}
                            </Chip>
                        </View>
                    </View>

                    {/* Informações principais */}
                    <View style={styles.inspectionInfo}>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                            <Text variant="bodySmall" style={styles.infoText}>
                                Vistoria: {format(new Date(item.inspectionDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar-clock" size={16} color="#666" />
                            <Text variant="bodySmall" style={styles.infoText}>
                                Validade: {format(new Date(item.expiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="office-building" size={16} color="#666" />
                            <Text variant="bodySmall" style={styles.infoText}>
                                {item.inspectionCenter.name}
                            </Text>
                        </View>
                    </View>

                    {/* Resultado e ações */}
                    <View style={styles.cardFooter}>
                        <Chip
                            mode="flat"
                            style={[styles.resultChip, { backgroundColor: getResultColor(item.result) + '20' }]}
                            textStyle={[styles.resultText, { color: getResultColor(item.result) }]}
                        >
                            {INSPECTION_RESULTS[item.result]}
                        </Chip>
                        <Text variant="bodySmall" style={styles.costText}>
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(item.cost)}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </Pressable>
    );

    // Renderizar estado vazio
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-search" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
                Nenhuma vistoria encontrada
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {inspections.length === 0
                    ? 'Registre a primeira vistoria dos seus veículos'
                    : 'Tente ajustar os filtros de busca'
                }
            </Text>
            {inspections.length === 0 && (
                <Button
                    mode="contained"
                    onPress={() => (navigation as any).navigate('AddInspection')}
                    style={styles.emptyButton}
                    buttonColor={AppColors.primary}
                >
                    Registrar Primeira Vistoria
                </Button>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Barra de busca */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Buscar por placa, veículo ou centro..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            {/* Cards de estatísticas */}
            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    <Pressable
                        style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}
                        onPress={() => toggleFilter('status', 'valid')}
                    >
                        <Text variant="titleLarge" style={[styles.statNumber, { color: '#1976D2' }]}>
                            {stats.valid}
                        </Text>
                        <Text variant="bodySmall" style={styles.statLabel}>Válidas</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}
                        onPress={() => toggleFilter('status', 'expiring_soon')}
                    >
                        <Text variant="titleLarge" style={[styles.statNumber, { color: '#F57C00' }]}>
                            {stats.expiring}
                        </Text>
                        <Text variant="bodySmall" style={styles.statLabel}>Vencendo</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}
                        onPress={() => toggleFilter('status', 'expired')}
                    >
                        <Text variant="titleLarge" style={[styles.statNumber, { color: '#D32F2F' }]}>
                            {stats.expired}
                        </Text>
                        <Text variant="bodySmall" style={styles.statLabel}>Vencidas</Text>
                    </Pressable>
                </View>
            </View>

            {/* Filtros ativos */}
            {Object.keys(activeFilters).length > 0 && (
                <View style={styles.filtersContainer}>
                    <FlatList
                        data={Object.entries(activeFilters)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={([key]) => key}
                        renderItem={({ item: [key, value] }) => (
                            <Chip
                                mode="flat"
                                onClose={() => toggleFilter(key as keyof InspectionFilters, value)}
                                style={styles.filterChip}
                            >
                                {key === 'status' ? INSPECTION_STATUS[value as keyof typeof INSPECTION_STATUS] : value}
                            </Chip>
                        )}
                        contentContainerStyle={styles.filtersList}
                    />
                </View>
            )}

            {/* Lista de vistorias */}
            <FlatList
                data={filteredInspections}
                renderItem={renderInspectionCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContainer,
                    filteredInspections.length === 0 && styles.emptyListContainer
                ]}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* FAB para adicionar vistoria */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => (navigation as any).navigate('AddInspection')}
                label="Nova Vistoria"
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchBar: {
        elevation: 2,
    },
    statsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        elevation: 2,
    },
    statNumber: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#666',
        textAlign: 'center',
    },
    filtersContainer: {
        paddingVertical: 8,
    },
    filtersList: {
        paddingHorizontal: 16,
    },
    filterChip: {
        marginRight: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    inspectionCard: {
        marginBottom: 12,
        elevation: 2,
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontWeight: '600',
        color: '#222',
    },
    vehiclePlate: {
        color: '#666',
        marginTop: 2,
    },
    statusContainer: {
        marginLeft: 12,
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    inspectionInfo: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        marginLeft: 8,
        color: '#666',
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultChip: {
        height: 28,
    },
    resultText: {
        fontSize: 12,
        fontWeight: '500',
    },
    costText: {
        color: '#1976D2',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    emptySubtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 24,
    },
    emptyButton: {
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: AppColors.primary,
    },
});
