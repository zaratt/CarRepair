import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Badge, Button, Card, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInspectionQuery } from '../api/api';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionDetail'>;

const statusColors = {
    'Aprovado': '#388e3c',
    'Aprovado com apontamentos': '#fbc02d',
    'Não conforme': '#d32f2f',
    'Pendente': '#888'
};

const InspectionDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { inspectionId } = route.params;

    const { data: inspection, isLoading, isError } = useInspectionQuery(inspectionId);

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" />
                <Text style={{ textAlign: 'center', marginTop: 16 }}>Carregando inspeção...</Text>
            </SafeAreaView>
        );
    }

    if (isError || !inspection) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                    <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                    <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Inspeção</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                    <IconButton icon="alert-circle" size={64} iconColor="#b00020" />
                    <Text style={{ textAlign: 'center', marginTop: 16, color: '#b00020', fontSize: 18 }}>
                        Inspeção não encontrada
                    </Text>
                    <Button mode="contained" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
                        Voltar
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Inspeção</Text>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
                <Card style={styles.card} elevation={3}>
                    <Card.Content>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                                Inspeção #{inspection.id.slice(-8)}
                            </Text>
                            <Badge style={{
                                backgroundColor: statusColors[inspection.status as keyof typeof statusColors] || '#888',
                                color: '#fff'
                            }}>
                                {inspection.status || 'Pendente'}
                            </Badge>
                        </View>

                        <Divider style={{ marginBottom: 16 }} />

                        {/* Informações do Veículo */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Veículo</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Placa:</Text>
                                <Text style={styles.value}>{inspection.vehicle?.licensePlate || '-'}</Text>
                            </View>
                            {inspection.vehicle?.yearManufacture && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Ano:</Text>
                                    <Text style={styles.value}>{inspection.vehicle.yearManufacture}</Text>
                                </View>
                            )}
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        {/* Informações da Inspeção */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Detalhes da Inspeção</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Empresa:</Text>
                                <Text style={styles.value}>{inspection.company || '-'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Data:</Text>
                                <Text style={styles.value}>
                                    {inspection.date ? new Date(inspection.date).toLocaleDateString('pt-BR') : '-'}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Criado em:</Text>
                                <Text style={styles.value}>
                                    {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString('pt-BR') : '-'}
                                </Text>
                            </View>
                            {inspection.uploadedBy && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Responsável:</Text>
                                    <Text style={styles.value}>{inspection.uploadedBy.name}</Text>
                                </View>
                            )}
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        {/* Arquivo Principal */}
                        {inspection.fileUrl && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Arquivo Principal</Text>
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(inspection.fileUrl)}
                                    style={styles.fileButton}
                                >
                                    <IconButton icon="file-document" size={24} iconColor="#1976d2" />
                                    <Text style={{ color: '#1976d2', flex: 1 }}>Abrir arquivo</Text>
                                    <IconButton icon="open-in-new" size={20} iconColor="#1976d2" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Anexos */}
                        {inspection.attachments && inspection.attachments.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Anexos ({inspection.attachments.length})</Text>
                                <View style={styles.attachmentsContainer}>
                                    {inspection.attachments.map((attachment, index) => (
                                        <TouchableOpacity
                                            key={attachment.id || index}
                                            onPress={() => Linking.openURL(attachment.url)}
                                            style={styles.attachmentItem}
                                        >
                                            {attachment.type && attachment.type.startsWith('image') ? (
                                                <Image
                                                    source={{ uri: attachment.url }}
                                                    style={styles.attachmentImage}
                                                />
                                            ) : (
                                                <View style={styles.attachmentFile}>
                                                    <IconButton icon="file-pdf-box" size={32} iconColor="#d32f2f" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Botões de Ação */}
                <View style={styles.actionButtons}>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('InspectionForm', { inspection })}
                        style={styles.editButton}
                        icon="pencil"
                    >
                        Editar
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        Voltar
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        backgroundColor: '#fff'
    },
    section: {
        marginVertical: 4
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start'
    },
    label: {
        fontWeight: '600',
        color: '#666',
        width: 100,
        fontSize: 14
    },
    value: {
        flex: 1,
        color: '#333',
        fontSize: 14
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#1976d2'
    },
    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    attachmentItem: {
        marginRight: 8,
        marginBottom: 8
    },
    attachmentImage: {
        width: 60,
        height: 60,
        borderRadius: 8
    },
    attachmentFile: {
        width: 60,
        height: 60,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 24
    },
    editButton: {
        flex: 1,
        borderColor: '#1976d2'
    },
    backButton: {
        flex: 1
    }
});

export default InspectionDetailScreen;
