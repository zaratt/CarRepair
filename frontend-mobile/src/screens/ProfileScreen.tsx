import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUserFull, updateUserProfile } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { useAuthContext } from '../contexts/AuthContext';

const PROFILE_TOP_HEIGHT = 350;
const PROFILE_COLOR = '#1976d2';

const ProfileScreen: React.FC = ({ navigation }: any) => {
    const { user, refreshUser, logout } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', city: '', state: '' });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                city: user.city || '',
                state: user.state || '',
            });
        }
    }, [user]);

    const handleEdit = () => setEditing(true);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const updated = await updateUserProfile(user.id, form);
            // Atualizar dados do usuário no contexto
            await refreshUser();
        } catch {
            Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
        } finally {
            setLoading(false);
            setEditing(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        Alert.alert(
            'Encerrar Conta',
            'Tem certeza que deseja encerrar sua conta? Todos os seus dados serão apagados e não poderão ser recuperados.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Encerrar', style: 'destructive', onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteUserFull(user.id);
                            await logout(); // Usar logout do AuthContext
                        } catch {
                            Alert.alert('Erro', 'Não foi possível encerrar a conta.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancelEdit = () => {
        setEditing(false);
        // Restaurar dados originais
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                city: user.city || '',
                state: user.state || '',
            });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={["top", "left", "right"]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
                <View style={styles.headerRow}>
                    <View style={{ width: 40, height: 40 }} />
                    <Text variant="headlineMedium" style={styles.title}>Perfil</Text>
                </View>
                <View style={{ height: PROFILE_TOP_HEIGHT, backgroundColor: PROFILE_COLOR, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={styles.avatarCircle}>
                        <MaterialIcons name="person" size={80} color="#fff" />
                    </View>
                    {editing ? (
                        <>
                            <Text style={[styles.name, { color: '#fff', marginBottom: 0 }]}>Nome</Text>
                            <TextInput
                                value={form.name}
                                onChangeText={text => setForm({ ...form, name: text })}
                                style={{ backgroundColor: '#fff', borderRadius: 8, marginTop: 4, marginBottom: 6, paddingHorizontal: 8, minWidth: 180 }}
                                mode="outlined"
                                placeholder="Nome"
                            />
                        </>
                    ) : (
                        <Text style={styles.name}>{user?.name || 'Usuário'}</Text>
                    )}
                    <Badge style={[styles.statusBadge, { backgroundColor: user?.isValidated ? '#43a047' : '#fbc02d' }]}>
                        {user?.isValidated ? 'Perfil Validado' : 'Não Validado'}
                    </Badge>
                </View>
                <View style={styles.infoContainer}>
                    <Divider style={{ marginVertical: 12 }} />
                    <Card style={[styles.infoCard, { backgroundColor: '#e3f2fd' }]}>
                        <Card.Title title="E-mail" left={() => <MaterialIcons name="email" size={28} color={PROFILE_COLOR} />} />
                        <Card.Content><Text>{user?.email || '-'}</Text></Card.Content>
                    </Card>
                    <Card style={[styles.infoCard, { backgroundColor: '#e8f5e9' }]}>
                        <Card.Title title="Telefone" left={() => <MaterialIcons name="phone" size={28} color="#388e3c" />} />
                        <Card.Content>
                            {editing ? (
                                <TextInput
                                    value={form.phone}
                                    onChangeText={text => setForm({ ...form, phone: text })}
                                    style={{ backgroundColor: '#fff' }}
                                    mode="outlined"
                                    placeholder="Telefone"
                                />
                            ) : (
                                <Text>{user?.phone || '-'}</Text>
                            )}
                        </Card.Content>
                    </Card>
                    <Card style={[styles.infoCard, { backgroundColor: '#fff3e0' }]}>
                        <Card.Title title="Cidade/Estado" left={() => <MaterialIcons name="location-city" size={28} color="#f57c00" />} />
                        <Card.Content>
                            {editing ? (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TextInput
                                        value={form.city}
                                        onChangeText={text => setForm({ ...form, city: text })}
                                        style={{ backgroundColor: '#fff', flex: 1, marginRight: 4 }}
                                        mode="outlined"
                                        placeholder="Cidade"
                                    />
                                    <TextInput
                                        value={form.state}
                                        onChangeText={text => setForm({ ...form, state: text })}
                                        style={{ backgroundColor: '#fff', width: 60 }}
                                        mode="outlined"
                                        placeholder="UF"
                                        maxLength={2}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            ) : (
                                <Text>{user?.city || '-'}{user?.state ? `/${user.state}` : ''}</Text>
                            )}
                        </Card.Content>
                    </Card>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 32 }}>
                        {editing ? (
                            <>
                                <Button mode="contained" style={{ flex: 1, marginRight: 8 }} onPress={handleSave} loading={loading}>Salvar</Button>
                                <Button mode="outlined" style={{ flex: 1, marginLeft: 8 }} onPress={handleCancelEdit} disabled={loading}>Cancelar</Button>
                            </>
                        ) : (
                            <>
                                <Button mode="contained" style={{ flex: 1, marginRight: 8 }} onPress={handleEdit}>Editar Perfil</Button>
                                <Button mode="outlined" style={{ flex: 1, marginLeft: 8 }} onPress={handleDeleteAccount} loading={loading} textColor="#d32f2f" >Encerrar Conta</Button>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
            {user?.profile && <FloatingBottomTabs profile={user.profile} />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginLeft: 4 },
    avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1565c0', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 4, borderColor: '#fff' },
    avatarImg: { width: 112, height: 112, borderRadius: 56 },
    name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
    statusBadge: { alignSelf: 'center', marginTop: 2, fontSize: 14 },
    infoContainer: { flex: 1, backgroundColor: '#fff', marginTop: -40, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
    infoCard: { marginBottom: 14, borderRadius: 12 },
});

export default ProfileScreen;
