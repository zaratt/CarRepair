import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { vehicleApiService } from '../../services/vehicleApi';
import { AppColors } from '../../styles/colors';
import { Vehicle } from '../../types/vehicle.types';

interface VehicleCardProps {
    vehicle: Vehicle;
    onPress: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
    return (
        <Card
            style={styles.card}
            onPress={() => onPress(vehicle)}
            mode="outlined"
        >
            <Card.Content style={styles.cardContent}>
                {/* Ícone do Veículo */}
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name="car"
                        size={40}
                        color={AppColors.primary}
                    />
                </View>

                {/* Informações Principais */}
                <View style={styles.infoContainer}>
                    {/* Marca e Modelo */}
                    <Text variant="titleMedium" style={styles.brandModel}>
                        {vehicle.brand} {vehicle.model}
                    </Text>

                    {/* Linha de Detalhes */}
                    <View style={styles.detailsRow}>
                        {/* Placa */}
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                                name="card-text"
                                size={16}
                                color={AppColors.text}
                                style={styles.detailIcon}
                            />
                            <Text variant="bodyMedium" style={styles.detailText}>
                                {vehicle.plate}
                            </Text>
                        </View>

                        {/* Ano */}
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                                name="calendar"
                                size={16}
                                color={AppColors.text}
                                style={styles.detailIcon}
                            />
                            <Text variant="bodyMedium" style={styles.detailText}>
                                {vehicle.year}
                            </Text>
                        </View>
                    </View>

                    {/* KM Atual */}
                    <View style={styles.kmContainer}>
                        <MaterialCommunityIcons
                            name="speedometer"
                            size={16}
                            color={AppColors.text}
                            style={styles.detailIcon}
                        />
                        <Text variant="bodyMedium" style={styles.kmText}>
                            {vehicleApiService.formatKm(vehicle.currentKm)}
                        </Text>
                    </View>
                </View>

                {/* Seta Indicativa */}
                <View style={styles.arrowContainer}>
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={AppColors.text}
                    />
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        elevation: 2,
        borderColor: AppColors.primary,
        borderWidth: 0.5,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    brandModel: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    detailIcon: {
        marginRight: 4,
    },
    detailText: {
        color: AppColors.text,
        opacity: 0.8,
    },
    kmContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    kmText: {
        color: AppColors.text,
        fontWeight: '600',
    },
    arrowContainer: {
        marginLeft: 8,
    },
});
