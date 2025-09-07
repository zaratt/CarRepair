import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';

import { getMaintenanceById } from '../../services/maintenanceApi';
import { getVehicleById } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { Vehicle } from '../../types/vehicle.types';

interface MaintenanceDetailsScreenProps {
    route: {
        params: {
            maintenanceId: string;
        };
    };
    navigation: any;
}

export default function MaintenanceDetailsScreen({ route, navigation }: MaintenanceDetailsScreenProps) {
    const { maintenanceId } = route.params;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);

    // Buscar dados da manutenção
    const maintenance = getMaintenanceById(maintenanceId);

    useEffect(() => {
        // Configurar header com botão de edição
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleEditMaintenance}
                >
                    <MaterialCommunityIcons
                        name="pencil"
                        size={24}
                        color={AppColors.primary}
                    />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        const loadVehicle = async () => {
            if (maintenance) {
                try {
                    const vehicleData = await getVehicleById(maintenance.vehicleId);
                    setVehicle(vehicleData);
                } catch (error) {
                    console.error('Erro ao carregar veículo:', error);
                }
            }
            setLoading(false);
        };

        loadVehicle();
    }, [maintenance]);

    if (loading) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="bodyMedium" style={styles.errorDescription}>
                    Carregando...
                </Text>
            </View>
        );
    }

    if (!maintenance || !vehicle) {
        return (
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={48} color={AppColors.danger} />
                <Text variant="headlineSmall" style={styles.errorTitle}>
                    Manutenção não encontrada
                </Text>
                <Text variant="bodyMedium" style={styles.errorDescription}>
                    A manutenção solicitada não foi encontrada no sistema.
                </Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    Voltar
                </Button>
            </View>
        );
    }

    // Funções de ação
    const handleEditMaintenance = () => {
        navigation.navigate('EditMaintenance', { maintenanceId: maintenance.id });
    };

    // Formatações
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FFA500';
            case 'validated':
                return '#4CAF50';
            case 'rejected':
                return '#F44336';
            default:
                return AppColors.gray;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendente';
            case 'validated':
                return 'Validada';
            case 'rejected':
                return 'Rejeitada';
            default:
                return 'Desconhecido';
        }
    };

    // Copiar código de validação
    const copyValidationCode = async () => {
        try {
            await Clipboard.setStringAsync(maintenance.validationCode);
            Alert.alert('Sucesso', 'Código copiado para a área de transferência!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível copiar o código');
        }
    };

    // Compartilhar código
    const handleViewDocument = (documentUrl: string, index: number) => {
        Alert.alert(
            'Visualizar Documento',
            `Documento ${index + 1}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Abrir',
                    onPress: () => {
                        // Aqui futuramente implementar abertura do documento
                        console.log('Abrir documento:', documentUrl);
                    }
                }
            ]
        );
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendente';
            case 'validated':
                return 'Validada';
            case 'rejected':
                return 'Rejeitada';
            default:
                return 'Desconhecido';
        }
    };

    const shareValidationCode = async () => {
        try {
            const servicesText = maintenance.services.length > 0
                ? maintenance.services.join(', ')
                : 'Não informado';

            const message = `🔧 Comprovante de Manutenção - CarRepair\n\n` +
                `📋 Código de Validação: ${maintenance.validationCode}\n\n` +
                `🚗 Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\n` +
                `📅 Data: ${formatDate(maintenance.date)}\n` +
                `🔧 Serviços: ${servicesText}\n` +
                `🏪 Oficina: ${maintenance.workshop.name}\n` +
                `💰 Valor: ${formatCurrency(maintenance.value)}\n` +
                `📊 Status: ${getStatusText(maintenance.status)}\n\n` +
                `Este código comprova a realização da manutenção registrada no sistema CarRepair.`;

            await Sharing.shareAsync(message);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível compartilhar o código');
        }
    };

    // Renderizar header com status
    const renderHeader = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.headerContent}>
                    <View style={styles.headerInfo}>
                        <Text variant="headlineSmall" style={styles.headerTitle}>
                            Manutenção #{maintenance.id.slice(-8).toUpperCase()}
                        </Text>
                        <Text variant="bodyMedium" style={styles.headerDate}>
                            {formatDate(maintenance.date)}
                        </Text>
                    </View>
                    <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor(maintenance.status) }]}
                        textStyle={styles.statusChipText}
                    >
                        {getStatusLabel(maintenance.status)}
                    </Chip>
                </View>
            </Card.Content>
        </Card>
    );

    // Renderizar código de validação
    const renderValidationCode = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="shield-check" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Código de Validação
                    </Text>
                </View>

                <View style={styles.validationCodeContainer}>
                    <Text variant="headlineMedium" style={styles.validationCode}>
                        {maintenance.validationCode}
                    </Text>
                    <Text variant="bodySmall" style={styles.validationCodeDescription}>
                        Use este código para comprovar a manutenção realizada
                    </Text>
                </View>

                <View style={styles.codeActions}>
                    <Button
                        mode="outlined"
                        onPress={copyValidationCode}
                        icon="content-copy"
                        style={styles.codeButton}
                        textColor={AppColors.text}
                    >
                        Copiar
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={shareValidationCode}
                        icon="share"
                        style={styles.codeButton}
                        textColor={AppColors.text}
                    >
                        Compartilhar
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );

    // Renderizar informações do veículo
    const renderVehicleInfo = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="car" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Veículo
                    </Text>
                </View>

                <View style={styles.vehicleInfo}>
                    <Text variant="titleLarge" style={styles.vehicleName}>
                        {vehicle.brand} {vehicle.model}
                    </Text>
                    <View style={styles.vehicleDetails}>
                        <View style={styles.vehicleDetailItem}>
                            <Text variant="bodySmall" style={styles.vehicleDetailLabel}>Ano</Text>
                            <Text variant="bodyMedium" style={styles.vehicleDetailValue}>{vehicle.year}</Text>
                        </View>
                        <View style={styles.vehicleDetailItem}>
                            <Text variant="bodySmall" style={styles.vehicleDetailLabel}>Placa</Text>
                            <Text variant="bodyMedium" style={styles.vehicleDetailValue}>{vehicle.plate}</Text>
                        </View>
                        <View style={styles.vehicleDetailItem}>
                            <Text variant="bodySmall" style={styles.vehicleDetailLabel}>KM na Manutenção</Text>
                            <Text variant="bodyMedium" style={styles.vehicleDetailValue}>
                                {maintenance.currentKm.toLocaleString('pt-BR')}
                            </Text>
                        </View>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    // Renderizar serviços realizados
    const renderServices = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="wrench" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Serviços Realizados ({maintenance.services.length})
                    </Text>
                </View>

                <View style={styles.servicesContainer}>
                    {maintenance.services.map((service, index) => (
                        <Chip
                            key={index}
                            style={styles.serviceChip}
                            textStyle={styles.serviceChipText}
                        >
                            {service}
                        </Chip>
                    ))}
                </View>
            </Card.Content>
        </Card>
    );

    // Renderizar dados da oficina
    const renderWorkshopInfo = () => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="store" size={20} color={AppColors.primary} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Oficina
                    </Text>
                </View>

                <View style={styles.workshopInfo}>
                    <Text variant="titleMedium" style={styles.workshopName}>
                        {maintenance.workshop.name}
                    </Text>

                    {maintenance.workshop.cnpj && (
                        <View style={styles.workshopDetailItem}>
                            <MaterialCommunityIcons name="identifier" size={16} color={AppColors.text} />
                            <Text variant="bodyMedium" style={styles.workshopDetailText}>
                                CNPJ: {maintenance.workshop.cnpj}
                            </Text>
                        </View>
                    )}

                    {maintenance.workshop.address && (
                        <View style={styles.workshopDetailItem}>
                            <MaterialCommunityIcons name="map-marker" size={16} color={AppColors.text} />
                            <Text variant="bodyMedium" style={styles.workshopDetailText}>
                                {maintenance.workshop.address}
                            </Text>
                        </View>
                    )}

                    <Divider style={styles.divider} />

                    <View style={styles.valueContainer}>
                        <Text variant="bodyMedium" style={styles.valueLabel}>Valor Total:</Text>
                        <Text variant="headlineSmall" style={styles.valueAmount}>
                            {formatCurrency(maintenance.value)}
                        </Text>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    // Renderizar documentos
    const renderDocuments = () => {
        if (!maintenance.documents || maintenance.documents.length === 0) {
            return null;
        }

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="paperclip" size={20} color={AppColors.primary} />
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Documentos ({maintenance.documents.length})
                        </Text>
                    </View>

                    <Text variant="bodySmall" style={styles.documentsHint}>
                        Comprovantes da manutenção realizada
                    </Text>

                    <View style={styles.documentsContainer}>
                        {maintenance.documents.map((doc, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.documentItem}
                                onPress={() => handleViewDocument(doc, index)}
                            >
                                <MaterialCommunityIcons
                                    name={doc.includes('pdf') ? "file-pdf-box" : "image"}
                                    size={24}
                                    color={AppColors.primary}
                                />
                                <View style={styles.documentInfo}>
                                    <Text variant="bodyMedium" style={styles.documentName}>
                                        {doc.includes('pdf') ? 'Documento PDF' : 'Imagem'} {index + 1}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.documentSize}>
                                        Anexado em {formatDate(maintenance.date)}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons
                                    name="eye"
                                    size={20}
                                    color={AppColors.text}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderHeader()}
                {renderValidationCode()}
                {renderVehicleInfo()}
                {renderServices()}
                {renderWorkshopInfo()}
                {renderDocuments()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: AppColors.white,
    },
    errorTitle: {
        color: AppColors.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorDescription: {
        color: AppColors.text,
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: AppColors.primary,
    },
    card: {
        marginBottom: 16,
        backgroundColor: AppColors.white,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        marginLeft: 8,
        color: AppColors.text,
        fontWeight: '600',
    },
    // Header styles
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        color: AppColors.text,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerDate: {
        color: AppColors.text,
        opacity: 0.7,
    },
    statusChip: {
        marginLeft: 16,
    },
    statusChipText: {
        color: AppColors.white,
        fontWeight: '600',
    },
    // Validation code styles
    validationCodeContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 16,
    },
    validationCode: {
        color: AppColors.primary,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 8,
    },
    validationCodeDescription: {
        color: AppColors.text,
        opacity: 0.7,
        textAlign: 'center',
    },
    codeActions: {
        flexDirection: 'row',
        gap: 12,
    },
    codeButton: {
        flex: 1,
        borderColor: AppColors.primary,
    },
    // Vehicle styles
    vehicleInfo: {
        marginBottom: 8,
    },
    vehicleName: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 12,
    },
    vehicleDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    vehicleDetailItem: {
        alignItems: 'center',
    },
    vehicleDetailLabel: {
        color: AppColors.text,
        opacity: 0.6,
        marginBottom: 4,
    },
    vehicleDetailValue: {
        color: AppColors.text,
        fontWeight: '600',
    },
    // Services styles
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    serviceChip: {
        backgroundColor: AppColors.primary,
        marginBottom: 4,
    },
    serviceChipText: {
        color: AppColors.white,
        fontSize: 12,
        fontWeight: '500',
    },
    // Workshop styles
    workshopInfo: {
        marginBottom: 8,
    },
    workshopName: {
        color: AppColors.text,
        fontWeight: '600',
        marginBottom: 12,
    },
    workshopDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    workshopDetailText: {
        color: AppColors.text,
        marginLeft: 8,
    },
    divider: {
        marginVertical: 16,
    },
    valueContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    valueLabel: {
        color: AppColors.text,
        opacity: 0.8,
    },
    valueAmount: {
        color: AppColors.primary,
        fontWeight: '700',
    },
    // Documents styles
    documentsHint: {
        color: AppColors.text,
        opacity: 0.7,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    documentsContainer: {
        gap: 12,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.gray,
    },
    documentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    documentName: {
        color: AppColors.text,
        fontWeight: '500',
        marginBottom: 2,
    },
    documentSize: {
        color: AppColors.text,
        opacity: 0.6,
    },
    // Header styles
    headerButton: {
        marginRight: 16,
        padding: 8,
    },
});
