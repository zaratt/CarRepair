import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Chip, FAB, Searchbar, Text } from 'react-native-paper';

import MaintenanceCard from '../../components/maintenance/MaintenanceCard';
import { getAllMaintenances } from '../../services/maintenanceApi';
import { getVehicleById } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { Maintenance, MaintenanceStatus } from '../../types/maintenance.types';
import { Vehicle } from '../../types/vehicle.types';

export default function MaintenanceScreen({ navigation }: any) {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [filteredMaintenances, setFilteredMaintenances] = useState<Maintenance[]>([]);
    const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | 'all'>('all');
    const [loading, setLoading] = useState(true);

    // Função para buscar dados
    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            // Buscar manutenções
            const maintenanceData = getAllMaintenances();
            setMaintenances(maintenanceData);

            // Buscar veículos para cada manutenção (individual para tratar erros)
            const vehicleMap: { [key: string]: Vehicle } = {};

            for (const maintenance of maintenanceData) {
                try {
                    const vehicle = await getVehicleById(maintenance.vehicleId);
                    if (vehicle) {
                        vehicleMap[maintenance.vehicleId] = vehicle;
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar veículo ${maintenance.vehicleId}:`, error);
                }
            }

            setVehicles(vehicleMap);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Alert.alert('Erro', 'Não foi possível carregar as manutenções');
        } finally {
            setLoading(false);
        }
    }, []);    // Recarregar dados quando a tela receber foco
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Função para filtrar manutenções
    const filterMaintenances = useCallback(() => {
        let filtered = maintenances;

        // Filtrar por status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(maintenance => maintenance.status === selectedStatus);
        }

        // Filtrar por busca de texto
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(maintenance => {
                const vehicle = vehicles[maintenance.vehicleId];
                const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}`.toLowerCase() : '';
                const workshopName = maintenance.workshop.name.toLowerCase();
                const services = maintenance.services.join(' ').toLowerCase();
                const validationCode = maintenance.validationCode.toLowerCase();

                return (
                    vehicleName.includes(query) ||
                    workshopName.includes(query) ||
                    services.includes(query) ||
                    validationCode.includes(query)
                );
            });
        }

        // Ordenar por data (mais recente primeiro)
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFilteredMaintenances(filtered);
    }, [maintenances, vehicles, searchQuery, selectedStatus]);

    // Aplicar filtros quando os dados mudarem
    React.useEffect(() => {
        filterMaintenances();
    }, [filterMaintenances]);

    // Navegar para detalhes da manutenção
    const handleMaintenancePress = (maintenance: Maintenance) => {
        // TODO: Implementar navegação para detalhes da manutenção
        console.log('Manutenção selecionada:', maintenance);
    };

    // Navegar para adicionar nova manutenção
    const handleAddMaintenance = () => {
        navigation.navigate('AddMaintenance');
    };

    // Contar manutenções por status
    const getStatusCount = (status: MaintenanceStatus) => {
        return maintenances.filter(m => m.status === status).length;
    };

    // Renderizar item da lista
    const renderMaintenanceItem = ({ item }: { item: Maintenance }) => (
        <MaintenanceCard
            maintenance={item}
            vehicle={vehicles[item.vehicleId]}
            onPress={handleMaintenancePress}
        />
    );

    // Header da lista com estatísticas
    const renderListHeader = () => (
        <View style={styles.header}>
            {/* Barra de busca */}
            <Searchbar
                placeholder="Buscar por veículo, oficina, serviço ou código..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                iconColor={AppColors.primary}
            />

            {/* Filtros de status */}
            <View style={styles.filtersContainer}>
                <Text variant="bodyMedium" style={styles.filtersLabel}>
                    Filtrar por status:
                </Text>
                <View style={styles.chipContainer}>
                    <Chip
                        selected={selectedStatus === 'all'}
                        onPress={() => setSelectedStatus('all')}
                        style={[styles.chip, selectedStatus === 'all' && styles.selectedChip]}
                        textStyle={selectedStatus === 'all' ? styles.selectedChipText : styles.chipText}
                    >
                        Todas ({maintenances.length})
                    </Chip>
                    <Chip
                        selected={selectedStatus === 'pending'}
                        onPress={() => setSelectedStatus('pending')}
                        style={[styles.chip, selectedStatus === 'pending' && styles.selectedChip]}
                        textStyle={selectedStatus === 'pending' ? styles.selectedChipText : styles.chipText}
                    >
                        Pendentes ({getStatusCount('pending')})
                    </Chip>
                    <Chip
                        selected={selectedStatus === 'validated'}
                        onPress={() => setSelectedStatus('validated')}
                        style={[styles.chip, selectedStatus === 'validated' && styles.selectedChip]}
                        textStyle={selectedStatus === 'validated' ? styles.selectedChipText : styles.chipText}
                    >
                        Validadas ({getStatusCount('validated')})
                    </Chip>
                    <Chip
                        selected={selectedStatus === 'rejected'}
                        onPress={() => setSelectedStatus('rejected')}
                        style={[styles.chip, selectedStatus === 'rejected' && styles.selectedChip]}
                        textStyle={selectedStatus === 'rejected' ? styles.selectedChipText : styles.chipText}
                    >
                        Rejeitadas ({getStatusCount('rejected')})
                    </Chip>
                </View>
            </View>
        </View>
    );

    // Estado vazio
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
                name="wrench-outline"
                size={64}
                color={AppColors.text}
                style={styles.emptyIcon}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
                {searchQuery || selectedStatus !== 'all'
                    ? 'Nenhuma manutenção encontrada'
                    : 'Nenhuma manutenção registrada'
                }
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {searchQuery || selectedStatus !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Registre suas primeiras manutenções'
                }
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredMaintenances}
                keyExtractor={(item) => item.id}
                renderItem={renderMaintenanceItem}
                ListHeaderComponent={renderListHeader}
                ListEmptyComponent={renderEmptyComponent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={loadData}
                contentContainerStyle={[
                    styles.listContent,
                    filteredMaintenances.length === 0 && styles.emptyListContent
                ]}
            />

            {/* Botão de adicionar */}
            <FAB
                icon="plus"
                onPress={handleAddMaintenance}
                style={styles.fab}
                color={AppColors.white}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    listContent: {
        paddingBottom: 100, // Espaço para o FAB e bottom tabs
    },
    emptyListContent: {
        flexGrow: 1,
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
    filtersContainer: {
        marginBottom: 8,
    },
    filtersLabel: {
        color: AppColors.text,
        marginBottom: 8,
        fontWeight: '500',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: AppColors.white,
        borderColor: AppColors.gray,
        borderWidth: 1,
    },
    selectedChip: {
        backgroundColor: AppColors.primary,
    },
    chipText: {
        color: AppColors.text,
        fontSize: 12,
    },
    selectedChipText: {
        color: AppColors.white,
        fontSize: 12,
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
        color: AppColors.text,
        opacity: 0.7,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80, // Posicionamento acima das bottom tabs
        backgroundColor: AppColors.primary,
    },
});
