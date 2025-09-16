import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Badge, Button, Card, Divider, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    useDeleteNotificationMutation,
    useMarkAllNotificationsAsReadMutation,
    useMarkNotificationAsReadMutation,
    useNotificationsQuery,
    useNotificationStatsQuery
} from '../../api/api';
import FloatingBottomTabs from '../../components/FloatingBottomTabs';
import { useAuthContext } from '../../contexts/AuthContext';
import { Notification } from '../../types';

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthContext();
    const [page, setPage] = useState(1);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({
        visible: false,
        message: '',
        error: false
    });

    // ✅ REACT QUERY HOOKS
    const {
        data: notificationsData,
        isLoading,
        isError,
        refetch
    } = useNotificationsQuery(page, 20, showUnreadOnly);

    const { data: stats } = useNotificationStatsQuery();

    const markAsReadMutation = useMarkNotificationAsReadMutation();
    const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();
    const deleteMutation = useDeleteNotificationMutation();

    const notifications = notificationsData?.notifications || [];
    const pagination = notificationsData?.pagination || {};

    // ✅ AÇÕES DE NOTIFICAÇÃO
    const handleNotificationPress = async (notification: Notification) => {
        // Marcar como lida se não foi lida
        if (!notification.isRead) {
            try {
                await markAsReadMutation.mutateAsync(notification.id);
            } catch (error) {
                console.error('Erro ao marcar como lida:', error);
            }
        }

        // Navegar baseado no tipo de notificação
        if (notification.actionUrl) {
            if (notification.actionUrl.includes('/inspections/')) {
                const inspectionId = notification.actionUrl.split('/').pop();
                if (inspectionId && inspectionId !== 'new') {
                    navigation.navigate('InspectionDetail', { inspectionId });
                } else {
                    navigation.navigate('InspectionForm', {});
                }
            } else if (notification.actionUrl.includes('/maintenances/')) {
                const maintenanceId = notification.actionUrl.split('/').pop();
                if (maintenanceId && maintenanceId !== 'new') {
                    navigation.navigate('MaintenanceDetail', { maintenanceId });
                } else {
                    navigation.navigate('MaintenanceForm', {});
                }
            }
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markAsReadMutation.mutateAsync(notificationId);
            setSnackbar({ visible: true, message: 'Notificação marcada como lida' });
        } catch (error) {
            setSnackbar({ visible: true, message: 'Erro ao marcar como lida', error: true });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsReadMutation.mutateAsync();
            setSnackbar({ visible: true, message: 'Todas as notificações marcadas como lidas' });
        } catch (error) {
            setSnackbar({ visible: true, message: 'Erro ao marcar todas como lidas', error: true });
        }
    };

    const handleDelete = (notificationId: string) => {
        Alert.alert(
            'Excluir Notificação',
            'Tem certeza que deseja excluir esta notificação?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMutation.mutateAsync(notificationId);
                            setSnackbar({ visible: true, message: 'Notificação excluída' });
                        } catch (error) {
                            setSnackbar({ visible: true, message: 'Erro ao excluir notificação', error: true });
                        }
                    }
                }
            ]
        );
    };

    // ✅ COMPONENTE DE ITEM DE NOTIFICAÇÃO
    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const getNotificationIcon = (type: string, priority: string) => {
            const iconMap: { [key: string]: string } = {
                'maintenance_reminder': 'build',
                'inspection_reminder': 'assignment',
                'payment_reminder': 'payment',
                'system_update': 'system-update',
                'promotional': 'local-offer',
                'emergency': 'warning'
            };
            return iconMap[type] || 'notifications';
        };

        const getPriorityColor = (priority: string) => {
            const colorMap: { [key: string]: string } = {
                'high': '#d32f2f',
                'medium': '#f57c00',
                'low': '#388e3c'
            };
            return colorMap[priority] || '#666';
        };

        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 60) return `${diffMins}min atrás`;
            if (diffHours < 24) return `${diffHours}h atrás`;
            if (diffDays < 7) return `${diffDays}d atrás`;
            return date.toLocaleDateString('pt-BR');
        };

        return (
            <TouchableOpacity onPress={() => handleNotificationPress(item)}>
                <Card
                    style={[
                        styles.notificationCard,
                        { backgroundColor: item.isRead ? '#fff' : '#f8f9fa' }
                    ]}
                    elevation={item.isRead ? 1 : 3}
                >
                    <Card.Content>
                        <View style={styles.notificationHeader}>
                            <View style={styles.notificationInfo}>
                                <View style={styles.titleRow}>
                                    <IconButton
                                        icon={getNotificationIcon(item.type, item.priority)}
                                        size={24}
                                        iconColor={getPriorityColor(item.priority)}
                                        style={{ margin: 0, padding: 0 }}
                                    />
                                    <Text variant="titleMedium" style={[
                                        styles.notificationTitle,
                                        { fontWeight: item.isRead ? 'normal' : 'bold' }
                                    ]}>
                                        {item.title}
                                    </Text>
                                    {!item.isRead && (
                                        <Badge size={8} style={{ backgroundColor: '#1976d2', marginLeft: 8 }} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.notificationMessage,
                                    { color: item.isRead ? '#666' : '#333' }
                                ]}>
                                    {item.message}
                                </Text>
                                <Text style={styles.notificationTime}>
                                    {formatDate(item.createdAt)}
                                </Text>
                            </View>
                            <View style={styles.notificationActions}>
                                {!item.isRead && (
                                    <IconButton
                                        icon="check"
                                        size={20}
                                        iconColor="#4caf50"
                                        onPress={() => handleMarkAsRead(item.id)}
                                        disabled={markAsReadMutation.isPending}
                                    />
                                )}
                                <IconButton
                                    icon="delete"
                                    size={20}
                                    iconColor="#f44336"
                                    onPress={() => handleDelete(item.id)}
                                    disabled={deleteMutation.isPending}
                                />
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                    <Text variant="titleLarge" style={styles.title}>Notificações</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Carregando notificações...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                    <Text variant="titleLarge" style={styles.title}>Notificações</Text>
                </View>
                <View style={styles.errorContainer}>
                    <IconButton icon="alert-circle" size={64} iconColor="#f44336" />
                    <Text style={{ textAlign: 'center', marginTop: 16, color: '#f44336' }}>
                        Erro ao carregar notificações
                    </Text>
                    <Button mode="contained" style={{ marginTop: 16 }} onPress={() => refetch()}>
                        Tentar Novamente
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={styles.title}>Notificações</Text>
                <IconButton
                    icon="check-all"
                    size={24}
                    onPress={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending || (stats?.unread === 0)}
                />
            </View>

            {/* ✅ ESTATÍSTICAS */}
            {stats && (
                <Card style={styles.statsCard}>
                    <Card.Content>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text variant="titleMedium" style={styles.statNumber}>{stats.total}</Text>
                                <Text style={styles.statLabel}>Total</Text>
                            </View>
                            <Divider style={{ width: 1, height: '100%' }} />
                            <View style={styles.statItem}>
                                <Text variant="titleMedium" style={[styles.statNumber, { color: '#1976d2' }]}>
                                    {stats.unread}
                                </Text>
                                <Text style={styles.statLabel}>Não Lidas</Text>
                            </View>
                            <Divider style={{ width: 1, height: '100%' }} />
                            <View style={styles.statItem}>
                                <Text variant="titleMedium" style={[styles.statNumber, { color: '#4caf50' }]}>
                                    {stats.thisWeek}
                                </Text>
                                <Text style={styles.statLabel}>Esta Semana</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* ✅ FILTROS */}
            <View style={styles.filtersContainer}>
                <Button
                    mode={showUnreadOnly ? "contained" : "outlined"}
                    onPress={() => setShowUnreadOnly(!showUnreadOnly)}
                    style={styles.filterButton}
                    icon="filter"
                >
                    {showUnreadOnly ? 'Mostrar Todas' : 'Apenas Não Lidas'}
                </Button>
            </View>

            {/* ✅ LISTA DE NOTIFICAÇÕES */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconButton icon="notifications-none" size={64} iconColor="#ccc" />
                        <Text style={{ textAlign: 'center', marginTop: 16, color: '#888' }}>
                            {showUnreadOnly ? 'Nenhuma notificação não lida' : 'Nenhuma notificação encontrada'}
                        </Text>
                    </View>
                }
            />

            {/* ✅ FLOATING TABS */}
            {user?.profile && <FloatingBottomTabs profile={user.profile} />}

            {/* ✅ SNACKBAR */}
            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}
                style={snackbar.error ? { backgroundColor: '#f44336' } : {}}
            >
                {snackbar.message}
            </Snackbar>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 8
    },
    title: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    statsCard: {
        margin: 16,
        backgroundColor: '#fff'
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    statItem: {
        flex: 1,
        alignItems: 'center'
    },
    statNumber: {
        fontWeight: 'bold'
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4
    },
    filtersContainer: {
        paddingHorizontal: 16,
        marginBottom: 8
    },
    filterButton: {
        marginVertical: 4
    },
    listContainer: {
        padding: 16
    },
    notificationCard: {
        marginBottom: 12
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    notificationInfo: {
        flex: 1
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    notificationTitle: {
        flex: 1,
        marginLeft: 8
    },
    notificationMessage: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20
    },
    notificationTime: {
        fontSize: 12,
        color: '#999'
    },
    notificationActions: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 64
    }
});

export default NotificationsScreen;