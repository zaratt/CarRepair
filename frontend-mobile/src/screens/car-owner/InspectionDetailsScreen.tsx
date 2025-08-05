import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getInspectionById } from '../../data/mockInspections';
import { AppColors } from '../../styles/colors';
import { Inspection, INSPECTION_RESULTS, INSPECTION_STATUS, INSPECTION_TYPES } from '../../types/inspection.types';

interface InspectionDetailsScreenProps {
    route: {
        params: {
            inspectionId: string;
        };
    };
}

export default function InspectionDetailsScreen() {
    const route = useRoute<any>();
    const { inspectionId } = route.params;
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [loading, setLoading] = useState(true);

    // Carregar dados da vistoria
    useEffect(() => {
        const loadInspection = () => {
            try {
                const inspectionData = getInspectionById(inspectionId);
                setInspection(inspectionData || null);
            } catch (error) {
                console.error('Erro ao carregar vistoria:', error);
                Alert.alert('Erro', 'Não foi possível carregar os dados da vistoria');
            } finally {
                setLoading(false);
            }
        };

        loadInspection();
    }, [inspectionId]);

    // Copiar código de validação
    const copyValidationCode = async () => {
        if (inspection?.validationCode) {
            await Clipboard.setStringAsync(inspection.validationCode);
            Alert.alert('Copiado!', 'Código de validação copiado para a área de transferência');
        }
    };

    // Compartilhar certificado
    const shareCertificate = async () => {
        if (inspection?.certificate) {
            try {
                await Sharing.shareAsync(inspection.certificate, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Compartilhar Certificado de Vistoria',
                });
            } catch (error) {
                console.error('Erro ao compartilhar certificado:', error);
                Alert.alert('Erro', 'Não foi possível compartilhar o certificado');
            }
        }
    };

    // Abrir anexo
    const openAttachment = async (url: string, type: string) => {
        try {
            if (type === 'pdf') {
                await Linking.openURL(url);
            } else {
                // Para fotos, podemos abrir numa galeria ou viewer
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Erro ao abrir anexo:', error);
            Alert.alert('Erro', 'Não foi possível abrir o anexo');
        }
    };

    // Obter cor do status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valid': return '#4CAF50';
            case 'expiring_soon': return '#FF9800';
            case 'expired': return '#F44336';
            default: return '#666';
        }
    };

    // Obter cor do resultado
    const getResultColor = (result: string) => {
        switch (result) {
            case 'approved': return '#4CAF50';
            case 'conditional': return '#FF9800';
            case 'rejected': return '#F44336';
            default: return '#666';
        }
    };

    // Calcular dias até expiração
    const getDaysUntilExpiry = () => {
        if (!inspection?.expiryDate) return 0;
        const expiryDate = new Date(inspection.expiryDate);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!inspection) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#666" />
                    <Text variant="titleMedium" style={styles.errorTitle}>
                        Vistoria não encontrada
                    </Text>
                    <Text variant="bodyMedium" style={styles.errorSubtitle}>
                        A vistoria solicitada não foi encontrada ou foi removida.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const daysUntilExpiry = getDaysUntilExpiry();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header da Vistoria */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.header}>
                            <View style={styles.headerInfo}>
                                <Text variant="headlineSmall" style={styles.vehicleTitle}>
                                    {inspection.vehicleBrand} {inspection.vehicleModel}
                                </Text>
                                <Text variant="bodyLarge" style={styles.vehiclePlate}>
                                    {inspection.vehiclePlate}
                                </Text>
                            </View>
                            <View style={styles.statusContainer}>
                                <Chip
                                    mode="flat"
                                    style={[styles.statusChip, { backgroundColor: getStatusColor(inspection.status) + '20' }]}
                                    textStyle={[styles.statusText, { color: getStatusColor(inspection.status) }]}
                                >
                                    {INSPECTION_STATUS[inspection.status]}
                                </Chip>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        {/* Informações principais */}
                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="clipboard-check" size={20} color="#666" />
                                <Text variant="bodyMedium" style={styles.infoLabel}>Tipo:</Text>
                                <Text variant="bodyMedium" style={styles.infoValue}>
                                    {INSPECTION_TYPES[inspection.type]}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                                <Text variant="bodyMedium" style={styles.infoLabel}>Data da Vistoria:</Text>
                                <Text variant="bodyMedium" style={styles.infoValue}>
                                    {format(new Date(inspection.inspectionDate), 'dd/MM/yyyy', { locale: ptBR })}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="calendar-clock" size={20} color="#666" />
                                <Text variant="bodyMedium" style={styles.infoLabel}>Validade:</Text>
                                <Text variant="bodyMedium" style={styles.infoValue}>
                                    {format(new Date(inspection.expiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                                    {daysUntilExpiry > 0 && (
                                        <Text style={styles.daysInfo}> ({daysUntilExpiry} dias)</Text>
                                    )}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="speedometer" size={20} color="#666" />
                                <Text variant="bodyMedium" style={styles.infoLabel}>KM na Vistoria:</Text>
                                <Text variant="bodyMedium" style={styles.infoValue}>
                                    {inspection.currentKm.toLocaleString('pt-BR')} km
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Resultado da Vistoria */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="check-circle" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Resultado
                            </Text>
                        </View>

                        <View style={styles.resultContainer}>
                            <Chip
                                mode="flat"
                                style={[styles.resultChip, { backgroundColor: getResultColor(inspection.result) + '20' }]}
                                textStyle={[styles.resultText, { color: getResultColor(inspection.result) }]}
                            >
                                {INSPECTION_RESULTS[inspection.result]}
                            </Chip>
                            <Text variant="bodyLarge" style={styles.costText}>
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(inspection.cost)}
                            </Text>
                        </View>

                        {inspection.observations && (
                            <View style={styles.observationsContainer}>
                                <Text variant="titleSmall" style={styles.observationsTitle}>
                                    Observações:
                                </Text>
                                <Text variant="bodyMedium" style={styles.observationsText}>
                                    {inspection.observations}
                                </Text>
                            </View>
                        )}

                        {inspection.defects && inspection.defects.length > 0 && (
                            <View style={styles.defectsContainer}>
                                <Text variant="titleSmall" style={styles.defectsTitle}>
                                    Defeitos Encontrados:
                                </Text>
                                {inspection.defects.map((defect, index) => (
                                    <View key={index} style={styles.defectItem}>
                                        <MaterialCommunityIcons name="alert-circle" size={16} color="#FF9800" />
                                        <Text variant="bodyMedium" style={styles.defectText}>
                                            {defect}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Centro de Vistoria */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="office-building" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Centro de Vistoria
                            </Text>
                        </View>

                        <View style={styles.centerInfo}>
                            <Text variant="titleMedium" style={styles.centerName}>
                                {inspection.inspectionCenter.name}
                            </Text>
                            <Text variant="bodyMedium" style={styles.centerCode}>
                                Código: {inspection.inspectionCenter.code}
                            </Text>
                            {inspection.inspectionCenter.address && (
                                <Text variant="bodyMedium" style={styles.centerAddress}>
                                    {inspection.inspectionCenter.address}
                                </Text>
                            )}
                            <Text variant="bodyMedium" style={styles.centerLocation}>
                                {inspection.inspectionCenter.city} - {inspection.inspectionCenter.state}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Código de Validação */}
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="shield-check" size={20} color={AppColors.primary} />
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Código de Validação
                            </Text>
                        </View>

                        <Pressable onPress={copyValidationCode} style={styles.validationCodeContainer}>
                            <Text variant="headlineSmall" style={styles.validationCode}>
                                {inspection.validationCode}
                            </Text>
                            <MaterialCommunityIcons name="content-copy" size={20} color={AppColors.primary} />
                        </Pressable>
                        <Text variant="bodySmall" style={styles.validationHint}>
                            Toque para copiar o código
                        </Text>
                    </Card.Content>
                </Card>

                {/* Anexos */}
                {inspection.attachments && inspection.attachments.length > 0 && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="paperclip" size={20} color={AppColors.primary} />
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Documentos e Fotos
                                </Text>
                            </View>

                            <View style={styles.attachmentsList}>
                                {inspection.attachments.map((attachment) => (
                                    <Pressable
                                        key={attachment.id}
                                        style={styles.attachmentItem}
                                        onPress={() => openAttachment(attachment.url, attachment.type)}
                                    >
                                        <MaterialCommunityIcons
                                            name={attachment.type === 'photo' ? 'image' : 'file-pdf-box'}
                                            size={24}
                                            color={attachment.type === 'photo' ? '#4CAF50' : '#F44336'}
                                        />
                                        <View style={styles.attachmentInfo}>
                                            <Text variant="bodyMedium" style={styles.attachmentName}>
                                                {attachment.name}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.attachmentDate}>
                                                {format(new Date(attachment.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="eye" size={20} color="#666" />
                                    </Pressable>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Botões de Ação */}
                {inspection.certificate && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Button
                                mode="contained"
                                onPress={shareCertificate}
                                style={styles.shareButton}
                                buttonColor={AppColors.primary}
                                icon="share-variant"
                            >
                                Compartilhar Certificado
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {/* Espaço extra */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    errorSubtitle: {
        textAlign: 'center',
        color: '#666',
    },
    card: {
        marginBottom: 16,
        elevation: 2,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerInfo: {
        flex: 1,
    },
    vehicleTitle: {
        fontWeight: '600',
        color: '#222',
        marginBottom: 4,
    },
    vehiclePlate: {
        color: '#666',
    },
    statusContainer: {
        marginLeft: 16,
    },
    statusChip: {
        height: 32,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#222',
    },
    infoSection: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        marginLeft: 8,
        color: '#666',
        minWidth: 120,
    },
    infoValue: {
        color: '#222',
        fontWeight: '500',
        flex: 1,
    },
    daysInfo: {
        color: '#666',
        fontSize: 12,
    },
    resultContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultChip: {
        height: 32,
    },
    resultText: {
        fontSize: 14,
        fontWeight: '500',
    },
    costText: {
        color: '#1976D2',
        fontWeight: '600',
    },
    observationsContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    observationsTitle: {
        marginBottom: 8,
        fontWeight: '600',
        color: '#333',
    },
    observationsText: {
        color: '#666',
        lineHeight: 20,
    },
    defectsContainer: {
        marginTop: 16,
    },
    defectsTitle: {
        marginBottom: 8,
        fontWeight: '600',
        color: '#333',
    },
    defectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#FFF3E0',
        borderRadius: 6,
    },
    defectText: {
        marginLeft: 8,
        color: '#E65100',
        flex: 1,
    },
    centerInfo: {
        gap: 4,
    },
    centerName: {
        fontWeight: '600',
        color: '#222',
    },
    centerCode: {
        color: '#666',
    },
    centerAddress: {
        color: '#666',
    },
    centerLocation: {
        color: '#666',
    },
    validationCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        marginBottom: 8,
    },
    validationCode: {
        fontFamily: 'monospace',
        color: '#1976D2',
        fontWeight: '600',
    },
    validationHint: {
        color: '#666',
        textAlign: 'center',
    },
    attachmentsList: {
        gap: 12,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
    },
    attachmentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    attachmentName: {
        color: '#222',
        fontWeight: '500',
    },
    attachmentDate: {
        color: '#666',
        marginTop: 2,
    },
    shareButton: {
        borderRadius: 8,
        paddingVertical: 4,
    },
    bottomSpacer: {
        height: 32,
    },
});
