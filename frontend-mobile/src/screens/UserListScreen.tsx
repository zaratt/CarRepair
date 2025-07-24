import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUser } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { RootStackParamList } from '../navigation/types';
import { User } from '../types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'UserList'>;
};

const UserListScreen: React.FC<Props> = ({ navigation }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });
    const [profile, setProfile] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem('user').then((userStr) => {
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setProfile(user.profile);
                    setUserId(user.userId || user.id);
                    if (user.profile === 'car_owner') {
                        // ✅ Remover navegação manual - deixar o AppNavigator gerenciar
                        // O usuário já está na tela correta baseada no estado de autenticação
                        console.log('Usuário car_owner detectado, mantendo na tela atual');
                    }
                } catch {
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }
        });
    }, []);

    useEffect(() => {
        if (!userId || !profile) return;
        setLoading(true);
        axios.get('http://localhost:3000/api/users', {
            params: { userId, profile }
        })
            .then(res => setUsers(res.data))
            .catch(err => {
                setSnackbar({ visible: true, message: err.response?.data?.error || 'Falha ao carregar usuários', error: true });
            })
            .finally(() => setLoading(false));
    }, [userId, profile]);

    const handleDelete = async (id: string) => {
        Alert.alert('Confirmação', 'Tem certeza que deseja excluir este usuário?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                onPress: async () => {
                    try {
                        await deleteUser(id);
                        setUsers(users.filter((u) => u.id !== id));
                        setSnackbar({ visible: true, message: 'Usuário excluído com sucesso!', error: false });
                    } catch (error) {
                        setSnackbar({ visible: true, message: 'Falha ao excluir usuário', error: true });
                    }
                },
            },
        ]);
    };

    if (loading) return <ActivityIndicator animating={true} style={{ marginTop: 40 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={["top", "left", "right"]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>{profile === 'wshop_owner' ? 'Motoristas' : 'Usuários'}</Text>
            </View>
            <View style={styles.container}>
                {profile !== 'wshop_owner' && (
                    <Button mode="contained" onPress={() => navigation.navigate('UserForm', {})} style={{ marginBottom: 10, marginTop: 8 }}>
                        Adicionar Usuário
                    </Button>
                )}
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Card style={styles.card} elevation={3} mode="elevated">
                            <Card.Content>
                                <Text variant="titleMedium">{item.name} ({item.email})</Text>
                                <Text>CPF/CNPJ: {item.cpfCnpj}</Text>
                                <Text>Tipo: {item.type}, Perfil: {item.profile}</Text>
                                <View style={styles.buttons}>
                                    <Button mode="outlined" onPress={() => navigation.navigate('UserForm', { user: item })} style={{ marginRight: 8 }} disabled={profile === 'wshop_owner'}>
                                        Editar
                                    </Button>
                                    <Button mode="text" onPress={() => handleDelete(item.id)} disabled={profile === 'wshop_owner'}>
                                        Excluir
                                    </Button>
                                </View>
                            </Card.Content>
                        </Card>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>{profile === 'wshop_owner' ? 'Nenhum motorista atendeu nesta oficina ainda.' : 'Nenhum usuário encontrado.'}</Text>}
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
            {profile !== 'wshop_owner' && (
                <View style={{ position: 'absolute', right: 28, bottom: 100, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserForm', {})}
                        style={{ backgroundColor: '#1976d2', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}
                        activeOpacity={0.8}
                    >
                        <IconButton icon="plus" size={32} iconColor="#fff" style={{ margin: 0 }} />
                    </TouchableOpacity>
                </View>
            )}
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
    buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

export default UserListScreen;