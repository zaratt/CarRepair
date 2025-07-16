import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehicles } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { RootStackParamList } from '../navigation/types';
import { Vehicle } from '../types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'VehicleList'>;
};

const VehicleListScreen: React.FC<Props> = ({ navigation }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndVehicles = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (!user?.userId) throw new Error('Usuário não autenticado');
                setUserId(user.userId);
                setProfile(user.profile);
                const data = await getVehicles(user.userId);
                setVehicles(data);
            } catch (error) {
                setSnackbar({ visible: true, message: 'Falha ao carregar veículos' });
            } finally {
                setLoading(false);
            }
        };
        fetchUserAndVehicles();
    }, []);

    if (loading) return <ActivityIndicator animating={true} style={{ marginTop: 40 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }} edges={["top", "left", "right"]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Veículos</Text>
            </View>
            <View style={styles.container}>
                <FlatList
                    data={vehicles}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isInactive = item.active === false;
                        return (
                            <Card
                                style={[
                                    styles.card,
                                    isInactive && styles.inactiveCard,
                                ]}
                                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
                                accessibilityLabel={`Detalhes do veículo ${item.licensePlate}`}
                                elevation={3}
                                mode="elevated"
                            >
                                <Card.Content>
                                    <Text variant="titleMedium">
                                        {item.brand?.name || ''} {item.model?.name || ''}
                                    </Text>
                                    <Text>Ano: {item.modelYear || ''}</Text>
                                    <Text>Renavam: {item.vin}</Text>
                                    <Text>Proprietário: {item.owner?.name || 'N/A'}</Text>
                                    {isInactive && (
                                        <Text style={styles.inactiveText}>Veículo inativo</Text>
                                    )}
                                </Card.Content>
                            </Card>
                        );
                    }}
                    ListEmptyComponent={<Text>Nenhum veículo encontrado.</Text>}
                />
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ visible: false, message: '' })}
                    duration={2000}
                >
                    {snackbar.message}
                </Snackbar>
            </View>
            {profile && <FloatingBottomTabs profile={profile} />}
            {/* FAB para adicionar veículo */}
            <View style={{ position: 'absolute', right: 28, bottom: 100, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('VehicleForm', {})}
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
    inactiveCard: {
        backgroundColor: '#ffeaea',
        borderColor: '#b00020',
        borderWidth: 1,
        opacity: 0.7,
    },
    inactiveText: { color: '#b00020', fontWeight: 'bold', marginTop: 4 },
});

export default VehicleListScreen;