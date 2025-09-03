import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import ErrorState from '../../components/common/ErrorState';
import { NotificationProvider, useNotificationContext } from '../../hooks/useNotificationContext';
import { AppColors } from '../../styles/colors';

// 🎯 Componente principal da tela (com provider)
export default function NotificationScreen() {
    return (
        <NotificationProvider>
            <NotificationScreenContent />
        </NotificationProvider>
    );
}

// 🎯 Conteúdo da tela
function NotificationScreenContent() {
    const navigation = useNavigation();
    const {
        notifications,
        notificationsCount,
        unreadCount,
        stats,
        preferences,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        updatePreferences,
        testNotification,
        refetch,
        isUsingRealAPI,
    } = useNotificationContext();

    const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');

    // Função de filtro
    const filterNotifications = useCallback(() => {
        let filtered = notifications || []; // Garantir que sempre seja um array

        switch (selectedFilter) {
            case 'unread':
                filtered = filtered.filter(n => !n.isRead);
                break;
            case 'read':
                filtered = filtered.filter(n => n.isRead);
                break;
            default:
                // 'all' - sem filtro
                break;
        }

        // Ordenar por data (mais recente primeiro)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setFilteredNotifications(filtered);
    }, [notifications, selectedFilter]);

    // Aplicar filtros quando os dados mudarem
    React.useEffect(() => {
        filterNotifications();
    }, [filterNotifications]);

    // Função de refresh
    const onRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // Navegar para configurações
    const navigateToSettings = () => {
        (navigation as any).navigate('NotificationSettings');
    };

    // Obter cor da prioridade
    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return AppColors.danger;
            case 'high':
                return '#FF5722';
            case 'medium':
                return '#FF9800';
            case 'low':
                return '#4CAF50';
            default:
                return AppColors.gray;
        }
    };

    // Obter ícone do tipo
    const getTypeIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'maintenance':
                return 'wrench';
            case 'inspection':
                return 'clipboard-check';
            case 'reminder':
                return 'bell';
            case 'promotion':
                return 'tag';
            case 'security':
                return 'shield-check';
            default:
                return 'information';
        }
    };

    // Renderizar item de notificação
    const renderNotificationItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => {
                if (!item.isRead) {
                    markAsRead(item.id);
                }
            }}
            activeOpacity={0.7}
        >
            <Card style={[
                styles.notificationCard,
                !item.isRead && styles.unreadCard
            ]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={styles.typeContainer}>
                            <MaterialCommunityIcons
                                name={getTypeIcon(item.type)}
                                size={24}
                                color={getPriorityColor(item.priority)}
                            />
                            <View style={styles.titleContainer}>
                                <Text variant="titleMedium" style={[
                                    styles.cardTitle,
                                    !item.isRead && styles.unreadTitle
                                ]}>
                                    {item.title}
                                </Text>
                                <Text variant="bodySmall" style={styles.timeText}>
                                    {format(new Date(item.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.badgeContainer}>
                            {!item.isRead && (
                                <View style={styles.unreadBadge} />
                            )}
                            <Chip
                                style={[
                                    styles.priorityChip,
                                    { backgroundColor: getPriorityColor(item.priority) }
                                ]}
                                textStyle={styles.priorityChipText}
                            >
                                {item.priority === 'URGENT' ? 'Urgente' :
                                    item.priority === 'HIGH' ? 'Alta' :
                                        item.priority === 'MEDIUM' ? 'Média' :
                                            item.priority === 'LOW' ? 'Baixa' :
                                                item.priority}
                            </Chip>
                        </View>
                    </View>

                    <Text variant="bodyMedium" style={styles.cardMessage}>
                        {item.message}
                    </Text>

                    {item.data?.vehicleId && (
                        <View style={styles.extraInfo}>
                            <MaterialCommunityIcons
                                name="car"
                                size={16}
                                color={AppColors.secondary}
                            />
                            <Text variant="bodySmall" style={styles.extraInfoText}>
                                Veículo relacionado
                            </Text>
                        </View>
                    )}
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    // Header com filtros e estatísticas
    const renderHeader = () => (
        <View style={styles.header}>
            {/* Estatísticas */}
            {stats && (
                <Card style={styles.statsCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.statsTitle}>
                            Resumo das Notificações
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
                                <Text variant="headlineSmall" style={[styles.statNumber, { color: AppColors.primary }]}>
                                    {stats.unread}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>
                                    Não Lidas
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text variant="headlineSmall" style={styles.statNumber}>
                                    {stats.scheduled}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>
                                    Agendadas
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text variant="headlineSmall" style={[styles.statNumber, { color: AppColors.danger }]}>
                                    {stats.failed}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>
                                    Falharam
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* Filtros */}
            <View style={styles.filtersContainer}>
                <Text variant="titleMedium" style={styles.filtersTitle}>
                    Filtros
                </Text>
                <View style={styles.chipContainer}>
                    <Chip
                        selected={selectedFilter === 'all'}
                        onPress={() => setSelectedFilter('all')}
                        style={[
                            styles.filterChip,
                            selectedFilter === 'all' && styles.selectedFilterChip
                        ]}
                        textStyle={[
                            styles.filterChipText,
                            selectedFilter === 'all' && styles.selectedFilterChipText
                        ]}
                    >
                        Todas ({notificationsCount})
                    </Chip>
                    <Chip
                        selected={selectedFilter === 'unread'}
                        onPress={() => setSelectedFilter('unread')}
                        style={[
                            styles.filterChip,
                            selectedFilter === 'unread' && styles.selectedFilterChip
                        ]}
                        textStyle={[
                            styles.filterChipText,
                            selectedFilter === 'unread' && styles.selectedFilterChipText
                        ]}
                    >
                        Não Lidas ({unreadCount})
                    </Chip>
                    <Chip
                        selected={selectedFilter === 'read'}
                        onPress={() => setSelectedFilter('read')}
                        style={[
                            styles.filterChip,
                            selectedFilter === 'read' && styles.selectedFilterChip
                        ]}
                        textStyle={[
                            styles.filterChipText,
                            selectedFilter === 'read' && styles.selectedFilterChipText
                        ]}
                    >
                        Lidas ({notificationsCount - unreadCount})
                    </Chip>
                </View>
            </View>

            {/* Ações rápidas */}
            <View style={styles.actionsContainer}>
                <Button
                    mode="outlined"
                    onPress={markAllAsRead}
                    disabled={unreadCount === 0}
                    style={styles.actionButton}
                >
                    Marcar Todas Como Lidas
                </Button>

                {!isUsingRealAPI && (
                    <Button
                        mode="contained"
                        onPress={() => {
                            testNotification({
                                type: 'maintenance',
                                title: 'Teste de Notificação',
                                message: 'Esta é uma notificação de teste',
                                channels: ['push'],
                            });
                        }}
                        style={styles.actionButton}
                    >
                        Testar Notificação
                    </Button>
                )}
            </View>
        </View>
    );

    // Componente vazio
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
                name="bell-outline"
                size={64}
                color={AppColors.gray}
                style={styles.emptyIcon}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
                {selectedFilter === 'all'
                    ? 'Nenhuma notificação'
                    : selectedFilter === 'unread'
                        ? 'Nenhuma notificação não lida'
                        : 'Nenhuma notificação lida'
                }
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {selectedFilter === 'all'
                    ? 'Suas notificações aparecerão aqui'
                    : 'Tente alterar o filtro selecionado'
                }
            </Text>
        </View>
    );

    // Estado de loading inicial
    if (isLoading && (!notifications || notifications.length === 0)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text variant="bodyMedium" style={styles.loadingText}>
                        Carregando notificações...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Estado de erro
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorState
                    title="Erro ao carregar notificações"
                    message="Não foi possível carregar suas notificações. Verifique sua conexão e tente novamente."
                    onRetry={refetch}
                    icon="bell-alert-outline"
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
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
                    filteredNotifications.length === 0 && styles.emptyListContent
                ]}
            />

            {/* FAB para configurações - DESABILITADO TEMPORARIAMENTE */}
            {/* 
            <FAB
                icon="cog"
                onPress={navigateToSettings}
                style={styles.fab}
                color={AppColors.white}
            />
            */}

            {/* Debug info */}
            {!isUsingRealAPI && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>
                        🔔 Modo Mock - {notifications.length} notificações
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
    statsCard: {
        marginBottom: 16,
        elevation: 2,
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
        color: AppColors.text,
        fontWeight: 'bold',
    },
    statLabel: {
        color: AppColors.secondary,
        marginTop: 4,
        textAlign: 'center',
    },
    filtersContainer: {
        marginBottom: 16,
    },
    filtersTitle: {
        color: AppColors.text,
        marginBottom: 8,
        fontWeight: '600',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        backgroundColor: AppColors.white,
        borderColor: AppColors.gray,
        borderWidth: 1,
    },
    selectedFilterChip: {
        backgroundColor: AppColors.primary,
    },
    filterChipText: {
        color: AppColors.text,
        fontSize: 12,
    },
    selectedFilterChipText: {
        color: AppColors.white,
        fontSize: 12,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    actionButton: {
        flex: 1,
        minWidth: 120,
    },
    listContent: {
        paddingBottom: 100,
    },
    emptyListContent: {
        flexGrow: 1,
    },
    notificationCard: {
        margin: 8,
        marginHorizontal: 16,
        elevation: 2,
        backgroundColor: AppColors.white,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: AppColors.primary,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    titleContainer: {
        marginLeft: 12,
        flex: 1,
    },
    cardTitle: {
        color: AppColors.text,
        fontWeight: '500',
    },
    unreadTitle: {
        fontWeight: '600',
    },
    timeText: {
        color: AppColors.secondary,
        marginTop: 2,
    },
    badgeContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    unreadBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AppColors.primary,
    },
    priorityChip: {
        height: 24,
    },
    priorityChipText: {
        color: AppColors.white,
        fontSize: 10,
        fontWeight: '600',
    },
    cardMessage: {
        color: AppColors.text,
        marginBottom: 8,
        lineHeight: 20,
    },
    extraInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    extraInfoText: {
        color: AppColors.secondary,
        marginLeft: 4,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 16,
        color: AppColors.text,
        textAlign: 'center',
    },
});
