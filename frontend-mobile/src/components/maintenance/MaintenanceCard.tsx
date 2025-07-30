import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Badge, Card, Text } from 'react-native-paper';

import { AppColors } from '../../styles/colors';
import { Maintenance } from '../../types/maintenance.types';
import { Vehicle } from '../../types/vehicle.types';

interface MaintenanceCardProps {
    maintenance: Maintenance;
    vehicle?: Vehicle; // Para mostrar dados do veículo
    onPress: (maintenance: Maintenance) => void;
}

export default function MaintenanceCard({ maintenance, vehicle, onPress }: MaintenanceCardProps) {
    // Formatação da data
    const formattedDate = format(new Date(maintenance.date), 'dd/MM/yyyy', { locale: ptBR });

    // Formatação do valor
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(maintenance.value);

    // Status badge
    const getStatusBadge = () => {
        switch (maintenance.status) {
            case 'pending':
                return (
                    <Badge style={styles.pendingBadge} size={18}>
                        Pendente
                    </Badge>
                );
            case 'validated':
                return (
                    <Badge style={styles.validatedBadge} size={18}>
                        Validada
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge style={styles.rejectedBadge} size={18}>
                        Rejeitada
                    </Badge>
                );
            default:
                return null;
        }
    };

    // Ícone do status
    const getStatusIcon = () => {
        switch (maintenance.status) {
            case 'pending':
                return <MaterialCommunityIcons name="clock-outline" size={16} color="#FF9800" />;
            case 'validated':
                return <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />;
            case 'rejected':
                return <MaterialCommunityIcons name="close-circle" size={16} color="#F44336" />;
            default:
                return null;
        }
    };

    // Limitação de serviços exibidos
    const displayServices = maintenance.services.slice(0, 3);
    const hasMoreServices = maintenance.services.length > 3;

    return (
        <TouchableOpacity onPress={() => onPress(maintenance)}>
            <Card style={styles.card}>
                <Card.Content style={styles.content}>
                    {/* Header com veículo e data */}
                    <View style={styles.header}>
                        <View style={styles.vehicleInfo}>
                            <MaterialCommunityIcons
                                name="car"
                                size={18}
                                color={AppColors.primary}
                                style={styles.vehicleIcon}
                            />
                            <Text variant="bodyMedium" style={styles.vehicleName}>
                                {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo não encontrado'}
                            </Text>
                        </View>
                        <Text variant="bodySmall" style={styles.date}>
                            {formattedDate}
                        </Text>
                    </View>

                    {/* Serviços realizados */}
                    <View style={styles.servicesContainer}>
                        <MaterialCommunityIcons
                            name="wrench"
                            size={16}
                            color={AppColors.text}
                            style={styles.servicesIcon}
                        />
                        <View style={styles.servicesText}>
                            <Text variant="bodyMedium" style={styles.services}>
                                {displayServices.join(', ')}
                                {hasMoreServices && ` +${maintenance.services.length - 3} mais`}
                            </Text>
                        </View>
                    </View>

                    {/* Footer com valor, status e informações extras */}
                    <View style={styles.footer}>
                        <View style={styles.leftFooter}>
                            <View style={styles.valueContainer}>
                                <MaterialCommunityIcons
                                    name="currency-usd"
                                    size={16}
                                    color={AppColors.text}
                                />
                                <Text variant="bodyMedium" style={styles.value}>
                                    {formattedValue}
                                </Text>
                            </View>

                            {/* Oficina */}
                            <Text variant="bodySmall" style={styles.workshop}>
                                {maintenance.workshop.name}
                            </Text>
                        </View>

                        <View style={styles.rightFooter}>
                            {/* Status badge */}
                            <View style={styles.statusContainer}>
                                {getStatusIcon()}
                                {getStatusBadge()}
                            </View>

                            {/* Código de validação */}
                            <Text variant="bodySmall" style={styles.validationCode}>
                                {maintenance.validationCode}
                            </Text>
                        </View>
                    </View>

                    {/* KM no momento da manutenção */}
                    <View style={styles.kmContainer}>
                        <MaterialCommunityIcons
                            name="speedometer"
                            size={14}
                            color={AppColors.text}
                            style={styles.kmIcon}
                        />
                        <Text variant="bodySmall" style={styles.km}>
                            {maintenance.currentKm.toLocaleString('pt-BR')} km
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 6,
        backgroundColor: AppColors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    content: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    vehicleIcon: {
        marginRight: 6,
    },
    vehicleName: {
        color: AppColors.text,
        fontWeight: '600',
        flex: 1,
    },
    date: {
        color: AppColors.text,
        opacity: 0.7,
    },
    servicesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    servicesIcon: {
        marginRight: 6,
        marginTop: 2,
    },
    servicesText: {
        flex: 1,
    },
    services: {
        color: AppColors.text,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 6,
    },
    leftFooter: {
        flex: 1,
    },
    rightFooter: {
        alignItems: 'flex-end',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    value: {
        color: AppColors.text,
        fontWeight: '600',
        marginLeft: 4,
    },
    workshop: {
        color: AppColors.text,
        opacity: 0.7,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    pendingBadge: {
        backgroundColor: '#FF9800',
        marginLeft: 4,
    },
    validatedBadge: {
        backgroundColor: '#4CAF50',
        marginLeft: 4,
    },
    rejectedBadge: {
        backgroundColor: '#F44336',
        marginLeft: 4,
    },
    validationCode: {
        color: AppColors.text,
        opacity: 0.6,
        fontFamily: 'monospace',
        fontSize: 11,
    },
    kmContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    kmIcon: {
        marginRight: 3,
        opacity: 0.7,
    },
    km: {
        color: AppColors.text,
        opacity: 0.7,
    },
});
