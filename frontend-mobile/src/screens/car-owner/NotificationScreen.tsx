import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, FAB, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MockNotificationData from '../../data/mockNotifications';
import { AppColors } from '../../styles/colors';
import {
    NotificationCategory,
    NotificationHistory,
    NotificationPriority,
    NotificationSettings,
    NotificationStats,
    NotificationStatus
} from '../../types/notification.types';

export default function NotificationScreen() {
    const navigation = useNavigation();

    // Estados
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [recentNotifications, setRecentNotifications] = useState<NotificationHistory[]>([]);
    const [upcomingNotifications, setUpcomingNotifications] = useState<NotificationHistory[]>([]);
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Carregar dados
    const loadData = useCallback(async () => {
        try {
            const userId = 'user1'; // Em produção, vem do contexto de auth

            const [
                userSettings,
                recentHistory,
                upcomingHistory,
                userStats
            ] = await Promise.all([
                MockNotificationData.getSettings(userId),
                MockNotificationData.getHistory(userId, 10),
                MockNotificationData.getUpcomingNotifications(userId, 30),
                MockNotificationData.getStats(userId)
            ]);

            setSettings(userSettings);
            setRecentNotifications(recentHistory);
            setUpcomingNotifications(upcomingHistory);
            setStats(userStats);
        } catch (error) {
            console.error('Erro ao carregar dados de notificações:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carregar dados quando a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Função de refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    // Alternar configuração global
    const toggleGlobalNotifications = async (enabled: boolean) => {
        if (!settings) return;

        const updatedSettings = {
            ...settings,
            general: {
                ...settings.general,
                pushEnabled: enabled
            }
        };

        await MockNotificationData.saveSettings(updatedSettings);
        setSettings(updatedSettings);
    };

    // Alternar categoria de notificação
    const toggleCategory = async (category: 'maintenance' | 'inspection' | 'tips', enabled: boolean) => {
        if (!settings) return;

        let updatedSettings = { ...settings };

        switch (category) {
            case 'maintenance':
                updatedSettings.maintenanceNotifications.enabled = enabled;
                break;
            case 'inspection':
                updatedSettings.inspectionNotifications.enabled = enabled;
                break;
            case 'tips':
                updatedSettings.tipsNotifications.enabled = enabled;
                break;
        }

        await MockNotificationData.saveSettings(updatedSettings);
        setSettings(updatedSettings);
    };

    // Obter cor da prioridade
    const getPriorityColor = (priority: NotificationPriority): string => {
        switch (priority) {
            case NotificationPriority.CRITICAL: return '#D32F2F';
            case NotificationPriority.HIGH: return '#F57C00';
            case NotificationPriority.MEDIUM: return '#1976D2';
            case NotificationPriority.LOW: return '#388E3C';
            default: return '#757575';
        }
    };

    // Obter ícone da categoria
    const getCategoryIcon = (category: NotificationCategory): keyof typeof MaterialCommunityIcons.glyphMap => {
        switch (category) {
            case NotificationCategory.MAINTENANCE: return 'wrench';
            case NotificationCategory.INSPECTION: return 'clipboard-check';
            case NotificationCategory.TIPS: return 'lightbulb';
            case NotificationCategory.DOCUMENTS: return 'file-document';
            default: return 'bell';
        }
    };

    // Marcar notificação como vista
    const markAsViewed = async (notificationId: string) => {
        await MockNotificationData.markNotificationAction('user1', notificationId, 'viewed');
        loadData(); // Recarregar para atualizar
    };

    // Renderizar item de notificação
    const renderNotificationItem = ({ item }: { item: NotificationHistory }) => (
        <Card style={styles.notificationCard} mode="elevated">
            <Card.Content>
                <View style={styles.notificationHeader}>
                    <View style={styles.notificationTitleRow}>
                        <MaterialCommunityIcons
                            name={getCategoryIcon(item.category)}
                            size={20}
                            color={getPriorityColor(item.priority)}
                        />
                        <Text variant="titleSmall" style={styles.notificationTitle}>
                            {item.title}
                        </Text>
                    </View>
                    <View style={styles.notificationMeta}>
                        <Chip
                            icon={item.status === NotificationStatus.SCHEDULED ? 'clock' : 'check'}
                            mode="outlined"
                            compact
                            style={[
                                styles.statusChip,
                                { borderColor: getPriorityColor(item.priority) }
                            ]}
                        >
                            {item.status === NotificationStatus.SCHEDULED ? 'Agendada' : 'Enviada'}
                        </Chip>
                    </View>
                </View>

                <Text variant="bodyMedium" style={styles.notificationMessage}>
                    {item.message}
                </Text>

                <View style={styles.notificationFooter}>
                    <Text variant="bodySmall" style={styles.notificationDate}>
                        {item.status === NotificationStatus.SCHEDULED
                            ? `Agendada para: ${format(new Date(item.scheduledFor), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}`
                            : `Enviada: ${format(new Date(item.sentAt!), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}`
                        }
                    </Text>

                    {item.status === NotificationStatus.DELIVERED && !item.actionTaken && (
                        <Button
                            mode="outlined"
                            compact
                            onPress={() => markAsViewed(item.id)}
                            style={styles.actionButton}
                        >
                            Marcar como vista
                        </Button>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Carregando notificações...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={[]} // Lista vazia para usar apenas header e footer
                renderItem={() => null}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListHeaderComponent={
                    <>
                        {/* Configurações Principais */}
                        <Card style={styles.settingsCard} mode="elevated">
                            <Card.Content>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    🔔 Configurações de Notificações
                                </Text>

                                {/* Toggle global */}
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text variant="bodyLarge">Notificações Push</Text>
                                        <Text variant="bodySmall" style={styles.settingDescription}>
                                            Receber notificações no dispositivo
                                        </Text>
                                    </View>
                                    <Switch
                                        value={settings?.general.pushEnabled || false}
                                        onValueChange={toggleGlobalNotifications}
                                        thumbColor={AppColors.primary}
                                    />
                                </View>

                                {settings?.general.pushEnabled && (
                                    <>
                                        {/* Manutenções */}
                                        <View style={styles.settingRow}>
                                            <View style={styles.settingInfo}>
                                                <View style={styles.settingTitleRow}>
                                                    <MaterialCommunityIcons name="wrench" size={18} color="#1976D2" />
                                                    <Text variant="bodyLarge">Manutenções</Text>
                                                </View>
                                                <Text variant="bodySmall" style={styles.settingDescription}>
                                                    Lembretes por quilometragem e tempo
                                                </Text>
                                            </View>
                                            <Switch
                                                value={settings?.maintenanceNotifications.enabled || false}
                                                onValueChange={(enabled) => toggleCategory('maintenance', enabled)}
                                                thumbColor={AppColors.primary}
                                            />
                                        </View>

                                        {/* Vistorias */}
                                        <View style={styles.settingRow}>
                                            <View style={styles.settingInfo}>
                                                <View style={styles.settingTitleRow}>
                                                    <MaterialCommunityIcons name="clipboard-check" size={18} color="#F57C00" />
                                                    <Text variant="bodyLarge">Vistorias</Text>
                                                </View>
                                                <Text variant="bodySmall" style={styles.settingDescription}>
                                                    Lembretes situacionais (venda/compra)
                                                </Text>
                                            </View>
                                            <Switch
                                                value={settings?.inspectionNotifications.enabled || false}
                                                onValueChange={(enabled) => toggleCategory('inspection', enabled)}
                                                thumbColor={AppColors.primary}
                                            />
                                        </View>

                                        {/* Dicas */}
                                        <View style={styles.settingRow}>
                                            <View style={styles.settingInfo}>
                                                <View style={styles.settingTitleRow}>
                                                    <MaterialCommunityIcons name="lightbulb" size={18} color="#388E3C" />
                                                    <Text variant="bodyLarge">Dicas e Cuidados</Text>
                                                </View>
                                                <Text variant="bodySmall" style={styles.settingDescription}>
                                                    Dicas sazonais e personalizadas
                                                </Text>
                                            </View>
                                            <Switch
                                                value={settings?.tipsNotifications.enabled || false}
                                                onValueChange={(enabled) => toggleCategory('tips', enabled)}
                                                thumbColor={AppColors.primary}
                                            />
                                        </View>
                                    </>
                                )}
                            </Card.Content>
                        </Card>

                        {/* Estatísticas */}
                        {stats && (
                            <Card style={styles.statsCard} mode="elevated">
                                <Card.Content>
                                    <Text variant="titleMedium" style={styles.sectionTitle}>
                                        📊 Estatísticas
                                    </Text>

                                    <View style={styles.statsGrid}>
                                        <View style={styles.statItem}>
                                            <Text variant="titleLarge" style={[styles.statNumber, { color: '#1976D2' }]}>
                                                {stats.total}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.statLabel}>Total</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text variant="titleLarge" style={[styles.statNumber, { color: '#388E3C' }]}>
                                                {stats.actionTaken}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.statLabel}>Ações</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text variant="titleLarge" style={[styles.statNumber, { color: '#F57C00' }]}>
                                                {stats.effectiveness}%
                                            </Text>
                                            <Text variant="bodySmall" style={styles.statLabel}>Efetividade</Text>
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        )}

                        {/* Próximas Notificações */}
                        {upcomingNotifications.length > 0 && (
                            <>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    📅 Próximas Notificações ({upcomingNotifications.length})
                                </Text>
                                {upcomingNotifications.slice(0, 3).map(notification => (
                                    <View key={notification.id}>
                                        {renderNotificationItem({ item: notification })}
                                    </View>
                                ))}
                            </>
                        )}

                        {/* Histórico Recente */}
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            📋 Histórico Recente
                        </Text>
                    </>
                }
                ListFooterComponent={
                    <View style={styles.historyContainer}>
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map(notification => (
                                <View key={notification.id}>
                                    {renderNotificationItem({ item: notification })}
                                </View>
                            ))
                        ) : (
                            <Card style={styles.emptyCard} mode="outlined">
                                <Card.Content>
                                    <View style={styles.emptyContainer}>
                                        <MaterialCommunityIcons
                                            name="bell-off"
                                            size={48}
                                            color="#757575"
                                        />
                                        <Text variant="bodyLarge" style={styles.emptyText}>
                                            Nenhuma notificação ainda
                                        </Text>
                                        <Text variant="bodySmall" style={styles.emptySubtext}>
                                            Configure suas preferências acima para começar a receber lembretes
                                        </Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        )}

                        <View style={styles.bottomPadding} />
                    </View>
                }
            />

            {/* FAB para configurações avançadas */}
            <FAB
                icon="cog"
                style={[styles.fab, { backgroundColor: AppColors.primary }]}
                onPress={() => {
                    // Navegar para configurações avançadas
                    console.log('Configurações avançadas');
                }}
                label="Configurações"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsCard: {
        margin: 16,
        marginBottom: 12,
    },
    statsCard: {
        margin: 16,
        marginTop: 8,
        marginBottom: 12,
    },
    notificationCard: {
        margin: 16,
        marginVertical: 6,
    },
    emptyCard: {
        margin: 16,
        marginVertical: 8,
    },
    sectionTitle: {
        marginHorizontal: 16,
        marginVertical: 12,
        fontWeight: 'bold',
        color: '#222',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingDescription: {
        color: '#666',
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#666',
        marginTop: 2,
    },
    notificationHeader: {
        marginBottom: 8,
    },
    notificationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    notificationTitle: {
        fontWeight: '600',
        flex: 1,
    },
    notificationMeta: {
        alignItems: 'flex-end',
    },
    notificationMessage: {
        marginBottom: 12,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationDate: {
        color: '#666',
        flex: 1,
    },
    statusChip: {
        alignSelf: 'flex-start',
    },
    actionButton: {
        marginLeft: 8,
    },
    historyContainer: {
        paddingBottom: 100, // Espaço para o FAB
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: '500',
        color: '#666',
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#999',
        lineHeight: 18,
    },
    bottomPadding: {
        height: 32,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
