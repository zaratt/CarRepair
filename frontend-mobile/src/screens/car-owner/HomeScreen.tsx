import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.welcomeText}>
                        Olá, João! 👋
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitleText}>
                        Aqui está o resumo dos seus veículos
                    </Text>
                </View>

                {/* Cards de Resumo */}
                <View style={styles.cardsContainer}>
                    <View style={styles.cardRow}>
                        <Card style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
                            <Card.Content style={styles.cardContent}>
                                <MaterialCommunityIcons name="car" size={32} color="#1976d2" />
                                <Text variant="headlineSmall" style={styles.cardNumber}>3</Text>
                                <Text variant="bodySmall" style={styles.cardLabel}>Veículos</Text>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.summaryCard, { backgroundColor: '#f3e5f5' }]}>
                            <Card.Content style={styles.cardContent}>
                                <MaterialCommunityIcons name="wrench" size={32} color="#7b1fa2" />
                                <Text variant="headlineSmall" style={styles.cardNumber}>12</Text>
                                <Text variant="bodySmall" style={styles.cardLabel}>Manutenções</Text>
                            </Card.Content>
                        </Card>
                    </View>

                    <View style={styles.cardRow}>
                        <Card style={[styles.summaryCard, { backgroundColor: '#e8f5e8' }]}>
                            <Card.Content style={styles.cardContent}>
                                <MaterialCommunityIcons name="garage" size={32} color="#388e3c" />
                                <Text variant="headlineSmall" style={styles.cardNumber}>5</Text>
                                <Text variant="bodySmall" style={styles.cardLabel}>Oficinas</Text>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
                            <Card.Content style={styles.cardContent}>
                                <MaterialCommunityIcons name="currency-usd" size={32} color="#f57c00" />
                                <Text variant="headlineSmall" style={styles.cardNumber}>R$ 850</Text>
                                <Text variant="bodySmall" style={styles.cardLabel}>Gasto Médio</Text>
                            </Card.Content>
                        </Card>
                    </View>
                </View>

                {/* Seção Meus Veículos */}
                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        Meus Veículos
                    </Text>

                    <Card style={styles.vehicleCard}>
                        <Card.Content>
                            <View style={styles.vehicleInfo}>
                                <MaterialCommunityIcons name="car-side" size={40} color="#1976d2" />
                                <View style={styles.vehicleDetails}>
                                    <Text variant="titleMedium">Honda Civic 2020</Text>
                                    <Text variant="bodySmall" style={styles.vehicleSubtext}>
                                        85.240 km • Última manutenção: 15/12/2024
                                    </Text>
                                    <Text variant="bodySmall" style={styles.nextMaintenance}>
                                        📅 Próxima: Troca de óleo em 1.760 km
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={styles.vehicleCard}>
                        <Card.Content>
                            <View style={styles.vehicleInfo}>
                                <MaterialCommunityIcons name="car-hatchback" size={40} color="#1976d2" />
                                <View style={styles.vehicleDetails}>
                                    <Text variant="titleMedium">Toyota Corolla 2019</Text>
                                    <Text variant="bodySmall" style={styles.vehicleSubtext}>
                                        92.180 km • Última manutenção: 28/11/2024
                                    </Text>
                                    <Text variant="bodySmall" style={styles.nextMaintenance}>
                                        📅 Próxima: Revisão geral em 2.820 km
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                </View>

                {/* Espaço extra para tab bar flutuante */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* FAB removido - funcionalidade de agendamento será implementada em release futuro */}
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
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    welcomeText: {
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    subtitleText: {
        color: '#666',
    },
    cardsContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    summaryCard: {
        flex: 1,
        marginHorizontal: 5,
        elevation: 3,
        borderRadius: 12,
    },
    cardContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    cardNumber: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    cardLabel: {
        color: '#666',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 15,
    },
    vehicleCard: {
        marginBottom: 15,
        elevation: 2,
        borderRadius: 12,
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleDetails: {
        flex: 1,
        marginLeft: 15,
    },
    vehicleSubtext: {
        color: '#666',
        marginTop: 4,
    },
    nextMaintenance: {
        color: '#1976d2',
        marginTop: 4,
        fontWeight: '500',
    },
    bottomSpacer: {
        height: 112, // ✅ Mudança: 120px → 112px (8px a menos devido ao reposicionamento da tab bar)
    },
});
