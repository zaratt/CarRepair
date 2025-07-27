import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MaintenanceScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    🔧 Manutenções
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Histórico e agendamento de manutenções
                </Text>
            </View>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialCommunityIcons name="wrench-clock" size={64} color="#7b1fa2" />
                        <Text variant="titleLarge" style={styles.cardTitle}>
                            Em Desenvolvimento
                        </Text>
                        <Text variant="bodyMedium" style={styles.cardText}>
                            Aqui você poderá agendar manutenções, ver o histórico e acompanhar o status dos serviços.
                        </Text>
                    </Card.Content>
                </Card>
            </View>

            {/* FAB removido - funcionalidade de agendamento será implementada em release futuro */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    subtitle: {
        color: '#666',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        elevation: 3,
        borderRadius: 12,
    },
    cardContent: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#222',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    cardText: {
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});
