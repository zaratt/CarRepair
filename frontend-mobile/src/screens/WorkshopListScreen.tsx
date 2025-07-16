import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteWorkshop, getFavoriteWorkshops, getWorkshops } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import StarRating from '../components/StarRating';
import { RootStackParamList } from '../navigation/types';
import { Workshop } from '../types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'WorkshopList'>;
};

const WorkshopListScreen: React.FC<Props> = ({ navigation }) => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });
    const [profile, setProfile] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                setProfile(user?.profile || null);
                setUserId(user?.id || '');
                const data = await getWorkshops();
                setWorkshops(data);
                if (user?.id) {
                    const favs = await getFavoriteWorkshops(user.id);
                    setFavorites(favs.map((w) => w.id));
                }
            } catch (error) {
                setSnackbar({ visible: true, message: 'Falha ao carregar oficinas', error: true });
            } finally {
                setLoading(false);
            }
        };
        fetchWorkshops();
        // Listener de foco para atualizar lista ao voltar
        const unsubscribe = navigation.addListener('focus', fetchWorkshops);
        return unsubscribe;
    }, [navigation]);

    const handleDelete = async (id: string) => {
        Alert.alert('Confirmação', 'Tem certeza que deseja excluir esta oficina?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                onPress: async () => {
                    try {
                        await deleteWorkshop(id);
                        setWorkshops(workshops.filter((w) => w.id !== id));
                        setSnackbar({ visible: true, message: 'Oficina excluída com sucesso!', error: false });
                    } catch (error) {
                        setSnackbar({ visible: true, message: 'Falha ao excluir oficina', error: true });
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
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Oficinas</Text>
            </View>
            <View style={styles.container}>
                <FlatList
                    data={workshops}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Card style={styles.card} elevation={3} mode="elevated">
                            <Card.Content>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text variant="titleMedium">{item.user?.name || 'N/A'}</Text>
                                    {favorites.includes(item.id) && (
                                        <IconButton icon="star" iconColor="#FFD600" size={20} style={{ marginLeft: 2 }} />
                                    )}
                                </View>
                                <Text>Nome da Oficina: {item.address}</Text>
                                <Text>Proprietário: {item.user?.name || 'N/A'}</Text>
                                <Text>Telefone: {item.phone}</Text>
                                <Text>Endereço: {item.address}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
                                    <StarRating rating={item.rating || 0} disabled size={20} />
                                    <Text style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
                                        {item.rating ? item.rating.toFixed(1) : 'N/A'} / 5
                                    </Text>
                                </View>
                                <Button mode="text" onPress={() => navigation.navigate('WorkshopDetail', { workshopId: item.id })} style={{ marginVertical: 4 }}>
                                    Ver Detalhes
                                </Button>
                                {profile === 'wshop_owner' && (
                                    <View style={styles.buttonsRow}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => navigation.navigate('WorkshopForm', { workshop: item })}
                                        >
                                            <View style={styles.buttonContentRowFix}>
                                                <IconButton icon="pencil" size={20} iconColor="#222" style={styles.buttonIconFix} />
                                                <Text style={styles.editButtonText}>Editar</Text>
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(item.id)}
                                        >
                                            <View style={styles.buttonContentRowFix}>
                                                <IconButton icon="delete" size={20} iconColor="#fff" style={styles.buttonIconFix} />
                                                <Text style={styles.deleteButtonText}>Excluir</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Nenhuma oficina encontrada.</Text>}
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
            {/* FAB para buscar oficinas */}
            <View style={{ position: 'absolute', right: 28, bottom: 100, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AvailableWorkshopsScreen')}
                    style={{ backgroundColor: '#1976d2', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={0.8}
                >
                    <IconButton icon="magnify" size={32} iconColor="#fff" style={{ margin: 0 }} />
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
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // alinhamento à direita
        alignItems: 'center',
        marginTop: 28,
        gap: 8,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E5E5',
        borderColor: '#E5E5E5',
        borderWidth: 1,
        borderRadius: 8,
        height: 40,
        width: 110,
        justifyContent: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        paddingLeft: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d32f2f',
        borderColor: '#d32f2f',
        borderWidth: 1,
        borderRadius: 8,
        height: 40,
        width: 110,
        justifyContent: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 7,
        paddingLeft: 8,
    },
    buttonContentRowFix: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIconFix: {
        margin: 0,
        padding: 0,
        alignSelf: 'center',
    },
    editButtonText: {
        color: '#222',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 2,
    },
    deleteButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 2,
    },
});

export default WorkshopListScreen;