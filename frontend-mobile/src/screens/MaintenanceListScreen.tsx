import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteMaintenance, getMaintenances } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { RootStackParamList } from '../navigation/types';
import { Maintenance } from '../types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MaintenanceList'>;
};

const MaintenanceListScreen: React.FC<Props> = ({ navigation }) => {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndMaintenances = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (!user?.userId) throw new Error('Usuário não autenticado');
                setUserId(user.userId);
                setProfile(user.profile);
                const data = await getMaintenances(user.userId);
                setMaintenances(data);
            } catch (error) {
                setSnackbar({ visible: true, message: 'Falha ao carregar manutenções', error: true });
            } finally {
                setLoading(false);
            }
        };
        fetchUserAndMaintenances();
    }, []);

    const handleDelete = async (id: string) => {
        Alert.alert('Confirmação', 'Tem certeza que deseja excluir esta manutenção?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                onPress: async () => {
                    try {
                        await deleteMaintenance(id);
                        setMaintenances(maintenances.filter((m) => m.id !== id));
                        setSnackbar({ visible: true, message: 'Manutenção excluída com sucesso!', error: false });
                    } catch (error) {
                        setSnackbar({ visible: true, message: 'Falha ao excluir manutenção', error: true });
                    }
                },
            },
        ]);
    };

    if (loading) return <ActivityIndicator animating={true} style={{ marginTop: 40 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }} edges={["top", "left", "right"]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Manutenções</Text>
            </View>
            <View style={styles.container}>
                <FlatList
                    data={maintenances}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Card
                            style={styles.card}
                            elevation={3}
                            mode="elevated"
                            onPress={() => navigation.navigate('MaintenanceDetail', { maintenanceId: item.id })}
                        >
                            <Card.Content>
                                <Text variant="titleMedium" numberOfLines={1} ellipsizeMode="tail">
                                    {item.vehicle?.brand?.name || ''} {item.vehicle?.model?.name || ''}
                                </Text>
                                <Text numberOfLines={1} ellipsizeMode="tail">Placa: {item.vehicle?.licensePlate || 'N/A'}</Text>
                                <Text numberOfLines={1} ellipsizeMode="tail">Serviço: {item.description}</Text>
                                <Text numberOfLines={1} ellipsizeMode="tail">Oficina: {item.workshop?.name || 'N/A'}</Text>
                                <Text>Data: {new Date(item.date).toLocaleDateString()}</Text>
                            </Card.Content>
                        </Card>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Nenhuma manutenção encontrada.</Text>}
                />
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                    duration={2200}
                    style={snackbar.error ? { backgroundColor: '#b00020' } : {}}
                >
                    {snackbar.message}
                </Snackbar>
            </View>
            {profile && <FloatingBottomTabs profile={profile} />}
            {/* FAB para adicionar manutenção */}
            <View style={{ position: 'absolute', right: 28, bottom: 100, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('MaintenanceForm', {})}
                    style={{ backgroundColor: '#1976d2', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={0.8}
                >
                    <IconButton icon="plus" size={32} iconColor="#fff" style={{ margin: 0 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: {
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
});

export default MaintenanceListScreen;