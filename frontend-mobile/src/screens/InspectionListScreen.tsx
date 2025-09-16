import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Badge, Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDeleteInspectionMutation, useInspectionsQuery } from '../api/api';
import FloatingBottomTabs from '../components/FloatingBottomTabs';
import { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'InspectionList'>;
};

const statusColors = {
    'Aprovado': '#388e3c',
    'Aprovado com apontamentos': '#fbc02d',
    'Não conforme': '#d32f2f',
};

const InspectionListScreen: React.FC<Props> = ({ navigation }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });

    useEffect(() => {
        const fetchUser = async () => {
            const userStr = await AsyncStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (user?.userId) setUserId(user.userId);
            if (user?.profile) setProfile(user.profile);
        };
        fetchUser();
    }, []);

    const {
        data: inspections = [],
        isLoading,
        isError,
        refetch,
    } = useInspectionsQuery(userId || undefined);

    const deleteMutation = useDeleteInspectionMutation(userId || undefined);

    const handleDelete = (id: string) => {
        Alert.alert('Confirmação', 'Tem certeza que deseja excluir esta inspeção?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                onPress: async () => {
                    try {
                        await deleteMutation.mutateAsync(id);
                        setSnackbar({ visible: true, message: 'Inspeção excluída com sucesso!', error: false });
                    } catch (error) {
                        setSnackbar({ visible: true, message: 'Falha ao excluir inspeção', error: true });
                    }
                },
            },
        ]);
    };

    if (isLoading || !userId) return <ActivityIndicator animating={true} style={{ marginTop: 40 }} />;
    if (isError) return <Text style={{ margin: 32, color: '#b00020' }}>Erro ao carregar inspeções.</Text>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }} edges={["top", "left", "right"]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Inspeções</Text>
            </View>
            <View style={styles.container}>
                <FlatList
                    data={inspections}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('InspectionDetail', { inspectionId: item.id })}>
                            <Card style={styles.card} elevation={3} mode="elevated">
                                <Card.Content>
                                    <Text style={styles.title}>Inspeção #{item.id.slice(-8)}</Text>
                                    <Text style={styles.label}>Placa: <Text style={styles.value}>{item.vehicle?.licensePlate || '-'}</Text></Text>
                                    <Text style={styles.label}>Data da Inspeção: <Text style={styles.value}>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</Text></Text>
                                    <Text style={[styles.label, { marginTop: 6, fontWeight: 'bold', fontSize: 15 }]}>Empresa: <Text style={styles.value}>{item.company || '-'}</Text></Text>
                                    <View style={{ marginTop: 2, marginBottom: 8 }}>
                                        <Badge style={{ backgroundColor: statusColors[item.status as keyof typeof statusColors] || '#888', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 1, fontSize: 13 }}>
                                            {item.status || 'Pendente'}
                                        </Badge>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                                        {(Array.isArray(item.attachments) && item.attachments.length > 0) ? (
                                            item.attachments.map((anexo: any) => (
                                                <TouchableOpacity key={anexo.id || anexo.url} onPress={() => Linking.openURL(anexo.url)} style={{ marginRight: 8, marginBottom: 4 }}>
                                                    {anexo.type && anexo.type.startsWith('image') ? (
                                                        <Image source={{ uri: anexo.url }} style={{ width: 44, height: 44, borderRadius: 6 }} />
                                                    ) : (
                                                        <IconButton icon="file-pdf-box" size={36} iconColor="#d32f2f" />
                                                    )}
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <Text style={{ color: '#888', fontSize: 12 }}>Sem anexos</Text>
                                        )}
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                                        <Button
                                            mode="outlined"
                                            onPress={() => navigation.navigate('InspectionForm', { inspection: item })}
                                            style={styles.editButton}
                                            icon={({ size, color }) => <IconButton icon="pencil" size={18} iconColor="#1976d2" style={{ margin: 0, padding: 0 }} />}
                                            contentStyle={styles.buttonContentRowFix}
                                            labelStyle={[styles.editButtonText, { marginLeft: 10 }]}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            mode="outlined"
                                            onPress={() => handleDelete(item.id)}
                                            style={[styles.deleteButton, { borderColor: '#d32f2f' }]}
                                            icon={({ size, color }) => <IconButton icon="delete" size={18} iconColor="#fff" style={{ margin: 0, padding: 0 }} />}
                                            contentStyle={styles.buttonContentRowFix}
                                            labelStyle={[styles.deleteButtonText, { marginLeft: 10 }]}
                                        >
                                            Excluir
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Nenhuma inspeção encontrada.</Text>}
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
            {/* FAB para adicionar inspeção */}
            <View style={{ position: 'absolute', right: 28, bottom: 100, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('InspectionForm', {})}
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
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontWeight: 'bold',
        color: '#222',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // alinhamento à esquerda
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
        marginLeft: 4,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 4,
    },
});

export default InspectionListScreen;