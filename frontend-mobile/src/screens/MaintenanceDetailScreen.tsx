import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteMaintenanceAttachment, getMaintenance, getMaintenanceAttachments, uploadMaintenanceAttachment } from '../api/api';
import { Maintenance } from '../types';
import { MaintenanceAttachment } from '../types/MaintenanceAttachment';

interface Props {
    route: { params: { maintenanceId: string } };
    navigation: any;
}

const MaintenanceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { maintenanceId } = route.params;
    const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
    const [attachments, setAttachments] = useState<MaintenanceAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });
    const [modalAttachment, setModalAttachment] = useState<MaintenanceAttachment | null>(null);

    useEffect(() => {
        getMaintenance(maintenanceId)
            .then(setMaintenance)
            .catch(() => setSnackbar({ visible: true, message: 'Falha ao carregar manutenção', error: true }))
            .finally(() => setLoading(false));
        getMaintenanceAttachments(maintenanceId).then(setAttachments);
    }, [maintenanceId]);

    const handleAddAttachment = async () => {
        if (attachments.length >= 3) {
            Alert.alert('Limite de anexos atingido (3)');
            return;
        }
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
            if (result && 'assets' in result && Array.isArray(result.assets) && result.assets.length > 0) {
                const file = result.assets[0];
                setUploading(true);
                let fileType: 'photo' | 'pdf' = 'photo';
                if (file.mimeType === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
                    fileType = 'pdf';
                }
                await uploadMaintenanceAttachment(maintenanceId, file.uri, fileType, file.name);
                const updated = await getMaintenanceAttachments(maintenanceId);
                setAttachments(updated);
                setSnackbar({ visible: true, message: 'Arquivo enviado com sucesso!', error: false });
            }
        } catch (e) {
            setSnackbar({ visible: true, message: 'Falha ao enviar arquivo', error: true });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        try {
            await deleteMaintenanceAttachment(maintenanceId, attachmentId);
            setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
            if (modalAttachment && modalAttachment.id === attachmentId) setModalAttachment(null);
        } catch {
            Alert.alert('Erro', 'Falha ao remover arquivo');
        }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
    if (!maintenance) return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <ScrollView style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Manutenção não encontrada.</Text>
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                    duration={2200}
                    style={snackbar.error ? { backgroundColor: '#b00020' } : {}}
                >
                    {snackbar.message}
                </Snackbar>
            </ScrollView>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Manutenção</Text>
            </View>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
                <Card style={{ marginBottom: 16 }}>
                    <Card.Title
                        title={`${maintenance.vehicle?.brand?.name || ''} ${maintenance.vehicle?.model?.name || ''}`}
                        subtitle={maintenance.vehicle?.licensePlate}
                        right={() => (
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                                <IconButton icon="pencil" onPress={() => navigation.navigate('MaintenanceForm', { maintenance })} />
                                <IconButton icon="delete" onPress={() => {
                                    Alert.alert('Confirmação', 'Tem certeza que deseja excluir esta manutenção?', [
                                        { text: 'Cancelar', style: 'cancel' },
                                        {
                                            text: 'Excluir', style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    await deleteMaintenanceAttachment(maintenanceId, maintenance.id);
                                                    setSnackbar({ visible: true, message: 'Manutenção excluída com sucesso!', error: false });
                                                    navigation.goBack();
                                                } catch {
                                                    setSnackbar({ visible: true, message: 'Falha ao excluir manutenção', error: true });
                                                }
                                            }
                                        }
                                    ]);
                                }} />
                            </View>
                        )}
                    />
                    <Card.Content>
                        <Text>Serviço: {maintenance.description}</Text>
                        <Text>Data do serviço: {new Date(maintenance.date).toLocaleDateString()}</Text>
                        <Text>KM: {maintenance.mileage}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <IconButton icon="garage" size={20} style={{ margin: 0, marginRight: 2 }} />
                            <Text style={{ fontWeight: 'bold' }}>Oficina: </Text>
                            <Text style={{ fontWeight: 'normal' }}>{maintenance.workshop?.name || 'N/A'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <IconButton icon="account-tie" size={20} style={{ margin: 0, marginRight: 2 }} />
                            <Text style={{ fontWeight: 'bold' }}>Ponto de contato: </Text>
                            <Text style={{ fontWeight: 'normal' }}>{maintenance.workshop?.user?.name || 'N/A'}</Text>
                        </View>
                        <Text>Valor: R$ {maintenance.value ? maintenance.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Não informado'}</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12, color: '#4CAF50' }}>
                            Status do Serviço: {
                                maintenance.serviceStatus === 'concluido' ? 'Concluído' :
                                    maintenance.serviceStatus || 'Concluído'
                            }
                        </Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8, color: '#2196F3' }}>
                            Validação: {
                                maintenance.validationStatus === 'registrado' ? 'Registrado' :
                                    maintenance.validationStatus === 'pendente' ? 'Pendente de Aprovação' :
                                        maintenance.validationStatus === 'validado' ? 'Validado' :
                                            'Registrado'
                            }
                        </Text>
                        <View style={{
                            backgroundColor: '#f0f0f0',
                            padding: 12,
                            borderRadius: 8,
                            marginTop: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: '#FF9800'
                        }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#666', marginBottom: 4 }}>
                                Código de Validação
                            </Text>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                letterSpacing: 2,
                                color: '#333',
                                fontFamily: 'monospace'
                            }}>
                                {maintenance.validationCode || 'Não gerado'}
                            </Text>
                        </View>
                        {/* Bloco de anexos */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                            {attachments.map((att) => (
                                <TouchableOpacity key={att.id} onPress={() => setModalAttachment(att)}>
                                    {att.type === 'photo' ? (
                                        <Image source={{ uri: att.url }} style={{ width: 48, height: 48, borderRadius: 6, marginRight: 4, backgroundColor: '#eee' }} />
                                    ) : (
                                        <View style={{ width: 48, height: 48, borderRadius: 6, marginRight: 4, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
                                            <IconButton icon="file-pdf" size={28} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card.Content>
                </Card>
                {/* Modal para visualização de anexo */}
                <Modal visible={!!modalAttachment} transparent animationType="fade" onRequestClose={() => setModalAttachment(null)}>
                    <TouchableWithoutFeedback onPress={() => setModalAttachment(null)}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                            {modalAttachment && modalAttachment.type === 'photo' && (
                                <View style={{ width: 345, height: 360, backgroundColor: '#222', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <IconButton icon="close" size={28} style={{ position: 'absolute', top: 2, right: 2, zIndex: 2 }} onPress={() => setModalAttachment(null)} />
                                    <Image source={{ uri: modalAttachment.url }} style={{ width: 345, height: 360, resizeMode: 'contain' }} />
                                    <IconButton icon="delete" size={24} style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: '#fff', borderRadius: 16, elevation: 2 }} onPress={() => handleDeleteAttachment(modalAttachment.id)} />
                                </View>
                            )}
                            {modalAttachment && modalAttachment.type === 'pdf' && (
                                <View style={{ width: 345, height: 360, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <IconButton icon="close" size={28} style={{ position: 'absolute', top: 2, right: 2, zIndex: 2 }} onPress={() => setModalAttachment(null)} />
                                    <IconButton icon="file-pdf" size={80} />
                                    <Text style={{ marginTop: 12 }}>{modalAttachment.name}</Text>
                                    <Button mode="contained" onPress={() => { /* abrir PDF externo */ }} style={{ marginTop: 16 }}>Abrir PDF</Button>
                                    <IconButton icon="delete" size={24} style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: '#fff', borderRadius: 16, elevation: 2 }} onPress={() => handleDeleteAttachment(modalAttachment.id)} />
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                    duration={2200}
                    style={snackbar.error ? { backgroundColor: '#b00020' } : {}}
                >
                    {snackbar.message}
                </Snackbar>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
});

export default MaintenanceDetailScreen;
