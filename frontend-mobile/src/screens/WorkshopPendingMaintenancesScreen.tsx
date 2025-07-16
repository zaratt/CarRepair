import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWorkshopPendingMaintenances, validateMaintenance } from '../api/api';
import { Maintenance } from '../types';

const WorkshopPendingMaintenancesScreen: React.FC = () => {
    const [pendingMaintenances, setPendingMaintenances] = useState<Maintenance[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const loadPendingMaintenances = async () => {
        try {
            const user = await AsyncStorage.getItem('user');
            if (!user) return;

            const userData = JSON.parse(user);
            setUserId(userData.userId);

            // Para oficinas, precisamos primeiro descobrir o ID da oficina
            // Por simplicidade, vamos usar um endpoint que busca pela userId
            const maintenances = await getWorkshopPendingMaintenances(userData.userId);
            setPendingMaintenances(maintenances);
        } catch (error) {
            console.error('Erro ao carregar manutenções pendentes:', error);
            Alert.alert('Erro', 'Não foi possível carregar as manutenções pendentes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleValidateMaintenance = async (maintenanceId: string) => {
        if (!userId) return;

        try {
            Alert.alert(
                'Confirmar Validação',
                'Tem certeza que deseja validar esta manutenção? Esta ação não pode ser desfeita.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Validar',
                        style: 'default',
                        onPress: async () => {
                            try {
                                await validateMaintenance(maintenanceId, userId);
                                Alert.alert('Sucesso', 'Manutenção validada com sucesso!');
                                loadPendingMaintenances(); // Recarregar lista
                            } catch (error) {
                                console.error('Erro ao validar manutenção:', error);
                                Alert.alert('Erro', 'Não foi possível validar a manutenção');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao validar manutenção:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadPendingMaintenances();
    };

    useEffect(() => {
        loadPendingMaintenances();
    }, []);

    const renderMaintenanceItem = ({ item }: { item: Maintenance }) => (
        <Card style={{ marginVertical: 8, marginHorizontal: 16 }}>
            <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#1976d2' }}>
                            🚗 {item.vehicle?.brand?.name} {item.vehicle?.model?.name}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: '#666', marginTop: 2 }}>
                            Placa: {item.vehicle?.licensePlate}
                        </Text>
                    </View>
                    <Chip icon="clock" mode="outlined" style={{ backgroundColor: '#fff3e0' }}>
                        ⏳ Pendente
                    </Chip>
                </View>

                <Divider style={{ marginVertical: 8 }} />

                <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: '500', marginBottom: 4 }}>📅 Data:</Text>
                    <Text style={{ color: '#666' }}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>

                <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: '500', marginBottom: 4 }}>🔧 Serviços:</Text>
                    <Text style={{ color: '#666' }}>{item.description}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View>
                        <Text style={{ fontWeight: '500', marginBottom: 4 }}>💰 Valor:</Text>
                        <Text style={{ color: '#4caf50', fontWeight: 'bold' }}>
                            R$ {item.value.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>
                    <View>
                        <Text style={{ fontWeight: '500', marginBottom: 4 }}>🛣️ KM:</Text>
                        <Text style={{ color: '#666' }}>{item.mileage.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: '500', marginBottom: 4 }}>👤 Cliente:</Text>
                    <Text style={{ color: '#666' }}>{item.vehicle?.owner?.name}</Text>
                </View>

                <Button
                    mode="contained"
                    onPress={() => handleValidateMaintenance(item.id)}
                    style={{ borderRadius: 8 }}
                    buttonColor="#4caf50"
                    icon="check-circle"
                >
                    Validar Manutenção
                </Button>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Carregando manutenções pendentes...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#1976d2' }}>
                    ⏳ Manutenções Pendentes
                </Text>
                <Text variant="bodyMedium" style={{ color: '#666', marginTop: 4 }}>
                    Validar manutenções realizadas na sua oficina
                </Text>
            </View>

            {pendingMaintenances.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                    <Text variant="headlineSmall" style={{ color: '#4caf50', marginBottom: 8, textAlign: 'center' }}>
                        🎉 Parabéns!
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#666', lineHeight: 20 }}>
                        Não há manutenções pendentes de validação no momento.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={pendingMaintenances}
                    renderItem={renderMaintenanceItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={{ paddingBottom: 16 }}
                />
            )}
        </SafeAreaView>
    );
};

export default WorkshopPendingMaintenancesScreen;
