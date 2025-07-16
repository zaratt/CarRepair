import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingBottomTabs from '../components/FloatingBottomTabs';

const HelpScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={["top", "left", "right"]}>
            <View style={styles.headerRow}>
                <View style={{ width: 40, height: 40 }} />
                <Text variant="headlineMedium" style={styles.title}>Ajuda</Text>
            </View>
            <View style={styles.container}>
                <TouchableOpacity style={[styles.card, { backgroundColor: '#e3f2fd' }]} onPress={() => navigation.navigate('FAQ')} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="help-circle" size={38} color="#1976d2" style={styles.cardIcon} />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>FAQ</Text>
                        <Text style={styles.cardDesc}>Perguntas frequentes sobre o app</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.card, { backgroundColor: '#e8f5e9' }]} onPress={() => navigation.navigate('Support')} activeOpacity={0.85}>
                    <MaterialIcons name="headset-mic" size={38} color="#388e3c" style={styles.cardIcon} />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Contatar Suporte</Text>
                        <Text style={styles.cardDesc}>Fale com nossa equipe de atendimento</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.card, { backgroundColor: '#fff3e0' }]} onPress={() => navigation.navigate('KnowledgeBase')} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={38} color="#f57c00" style={styles.cardIcon} />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Base de Conhecimento</Text>
                        <Text style={styles.cardDesc}>Artigos, dicas e tutoriais</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <FloatingBottomTabs profile={"car_owner"} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginLeft: 4 },
    container: { flex: 1, padding: 16, alignItems: 'stretch', marginTop: 12 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 18,
        marginBottom: 20,
        backgroundColor: '#fff', // será sobrescrito pelo backgroundColor do card
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    cardIcon: { marginRight: 18 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 2, color: '#222' },
    cardDesc: { fontSize: 14, color: '#444' },
});

export default HelpScreen;
