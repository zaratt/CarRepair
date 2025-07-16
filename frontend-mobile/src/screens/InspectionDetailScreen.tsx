import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getInspection } from '../api/api';
import { Inspection } from '../types';

interface Props {
    route: { params: { inspectionId: string } };
    navigation: any;
}

const InspectionDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { inspectionId } = route.params;
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({ visible: false, message: '', error: false });

    useEffect(() => {
        getInspection(inspectionId)
            .then(setInspection)
            .catch(() => setSnackbar({ visible: true, message: 'Falha ao carregar inspeção', error: true }))
            .finally(() => setLoading(false));
    }, [inspectionId]);

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
    if (!inspection) return (
        <ScrollView style={styles.container}>
            <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Inspeção não encontrada.</Text>
            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={2200}
                style={snackbar.error ? { backgroundColor: '#b00020' } : {}}
            >
                {snackbar.message}
            </Snackbar>
        </ScrollView>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Inspeção</Text>
            </View>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}>
                <Text>Arquivo: {inspection.fileUrl}</Text>
                <Text>Manutenção: {inspection.maintenance?.description || 'N/A'}</Text>
                <Text>Enviado por: {inspection.uploadedBy?.name || 'N/A'}</Text>
                <Text>Data: {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString() : 'N/A'}</Text>
                <Button mode="contained" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
                    Voltar
                </Button>
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

export default InspectionDetailScreen;
