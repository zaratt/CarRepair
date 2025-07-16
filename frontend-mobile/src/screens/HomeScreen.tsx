import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStatistics, useDashboardSummary, useDashboardVehicles } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const [profile, setProfile] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // React Query hooks para dashboard
    const { data: dashboardSummary, isLoading: summaryLoading } = useDashboardSummary(userId || '');
    const { data: dashboardVehicles, isLoading: vehiclesLoading } = useDashboardVehicles(userId || '');

    useEffect(() => {
        AsyncStorage.getItem('user').then((userStr) => {
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setProfile(user.profile);
                    setUserId(user.userId);
                } catch {
                    setProfile(null);
                    setUserId(null);
                }
            } else {
                setProfile(null);
                setUserId(null);
            }
        });
    }, []);

    useEffect(() => {
        if (userId && profile && profile !== 'car_owner') {
            setLoading(true);
            getStatistics(userId, profile)
                .then(setStatistics)
                .catch(() => setStatistics(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [userId, profile]);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.headerRow}>
                <View style={{ width: 40, height: 40 }} />
                <Text variant="headlineMedium" style={styles.title}>Home</Text>
                <IconButton
                    icon="logout"
                    size={28}
                    onPress={handleLogout}
                    style={{ position: 'absolute', right: 0, top: 0 }}
                    accessibilityLabel="Sair"
                    iconColor="#d32f2f"
                />
            </View>
            <ScrollView style={styles.container}>
                {loading || summaryLoading || vehiclesLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" />
                        <Text style={{ marginTop: 8 }}>Carregando dados...</Text>
                    </View>
                ) : profile === 'car_owner' ? (
                    <>
                        {/* Cards de resumo geral */}
                        <View style={styles.cardRow}>
                            <Card style={styles.statCard}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="car-multiple" size={32} color="#1976d2" style={{ marginBottom: 6 }} />
                                    <Text style={styles.cardValue}>{dashboardSummary?.totalVehicles || 0}</Text>
                                    <Text style={styles.cardLabel}>Total Veículos</Text>
                                </Card.Content>
                            </Card>
                            <Card style={styles.statCard}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <MaterialIcons name="build" size={32} color="#388e3c" style={{ marginBottom: 6 }} />
                                    <Text style={styles.cardValue}>{dashboardSummary?.totalMaintenances || 0}</Text>
                                    <Text style={styles.cardLabel}>Total Manutenções</Text>
                                </Card.Content>
                            </Card>
                        </View>

                        <View style={styles.cardRow}>
                            <Card style={styles.statCard}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <MaterialIcons name="attach-money" size={32} color="#f57c00" style={{ marginBottom: 6 }} />
                                    <Text style={styles.cardValue}>
                                        R$ {dashboardSummary?.averageSpending?.toFixed(2) || '0,00'}
                                    </Text>
                                    <Text style={styles.cardLabel}>Gasto Médio</Text>
                                </Card.Content>
                            </Card>
                            <Card style={styles.statCard}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="garage" size={32} color="#7b1fa2" style={{ marginBottom: 6 }} />
                                    <Text style={styles.cardValue}>{dashboardSummary?.totalWorkshopsUsed || 0}</Text>
                                    <Text style={styles.cardLabel}>Oficinas Utilizadas</Text>
                                </Card.Content>
                            </Card>
                        </View>

                        <Divider style={{ marginVertical: 20 }} />

                        {/* Seção de veículos */}
                        <Text style={styles.sectionTitle}>Seus Veículos</Text>
                        {dashboardVehicles && dashboardVehicles.length > 0 ? (
                            dashboardVehicles.map((vehicle) => (
                                <Card key={vehicle.id} style={styles.vehicleCard}>
                                    <Card.Content>
                                        <Text style={styles.vehicleTitle}>
                                            {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                                        </Text>
                                        <View style={styles.vehicleInfoRow}>
                                            <View style={styles.vehicleInfoItem}>
                                                <Text style={styles.vehicleInfoLabel}>Km Atual</Text>
                                                <Text style={styles.vehicleInfoValue}>
                                                    {vehicle.currentKm.toLocaleString()}
                                                </Text>
                                            </View>
                                            <View style={styles.vehicleInfoItem}>
                                                <Text style={styles.vehicleInfoLabel}>Manutenções</Text>
                                                <Text style={styles.vehicleInfoValue}>
                                                    {vehicle.totalMaintenances}
                                                </Text>
                                            </View>
                                            <View style={styles.vehicleInfoItem}>
                                                <Text style={styles.vehicleInfoLabel}>Gasto Médio</Text>
                                                <Text style={styles.vehicleInfoValue}>
                                                    R$ {vehicle.averageSpending.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                        {vehicle.upcomingMaintenances.length > 0 && (
                                            <View style={styles.upcomingSection}>
                                                <Text style={styles.upcomingTitle}>Próximas Manutenções:</Text>
                                                {vehicle.upcomingMaintenances.map((maintenance) => (
                                                    <Text key={maintenance.id} style={styles.upcomingItem}>
                                                        • {maintenance.description} - {new Date(maintenance.scheduledDate).toLocaleDateString()}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))
                        ) : (
                            <Card style={styles.vehicleCard}>
                                <Card.Content style={{ alignItems: 'center', padding: 20 }}>
                                    <MaterialCommunityIcons name="car-off" size={48} color="#999" />
                                    <Text style={{ marginTop: 8, color: '#666' }}>
                                        Nenhum veículo cadastrado
                                    </Text>
                                </Card.Content>
                            </Card>
                        )}
                    </>
                ) : (
                    <View style={{ marginBottom: 16, width: '100%' }}>
                        <Text style={styles.statsTitle}>Resumo Oficina</Text>
                        <Text>Total de clientes: {statistics?.totalClients || 0}</Text>
                        <Text>Total de manutenções: {statistics?.totalMaintenances || 0}</Text>
                        <Text>Média de avaliação: {statistics?.averageRating ?? 'N/A'}</Text>
                        <Text>Serviço mais comum: {statistics?.mostCommonService ?? 'N/A'}</Text>
                        <Text>Faturamento total: R$ {statistics?.totalRevenue?.toFixed(2) ?? '0,00'}</Text>

                        {/* Botão para Manutenções Pendentes */}
                        <Card
                            style={{
                                marginTop: 16,
                                backgroundColor: '#fff3e0',
                                borderLeftWidth: 4,
                                borderLeftColor: '#ff9800'
                            }}
                            onPress={() => navigation.navigate('WorkshopPendingMaintenances')}
                        >
                            <Card.Content>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="clock-alert" size={32} color="#ff9800" />
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#e65100' }}>
                                            ⏳ Manutenções Pendentes
                                        </Text>
                                        <Text style={{ color: '#bf360c', marginTop: 2 }}>
                                            Validar manutenções realizadas
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#ff9800" />
                                </View>
                            </Card.Content>
                        </Card>
                    </View>
                )}
            </ScrollView>
            {profile && <FloatingBottomTabs profile={profile} />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 },
    container: { flex: 1, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginLeft: 4 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statCard: {
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 4,
        marginBottom: 0,
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: 'rgba(154,160,185,0.15)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 16,
    },
    cardValue: { fontSize: 22, fontWeight: 'bold', color: '#222' },
    cardLabel: { fontSize: 13, color: '#555', marginTop: 2 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333'
    },
    vehicleCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    vehicleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    vehicleInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    vehicleInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    vehicleInfoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    vehicleInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    upcomingSection: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    upcomingTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    upcomingItem: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    infoTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    infoValue: { fontSize: 15, color: '#1976d2', marginBottom: 10 },
    statsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    // Botão padrão
    cardButton: {
        backgroundColor: '#E5E5E5',
        borderColor: '#E5E5E5',
        borderWidth: 1,
        borderRadius: 4,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardButtonText: {
        color: '#222',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default HomeScreen;