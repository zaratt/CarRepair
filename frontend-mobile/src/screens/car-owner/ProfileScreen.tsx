import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.title}>
                        👤 Meu Perfil
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Gerencie suas informações pessoais
                    </Text>
                </View>

                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <Card.Content style={styles.profileContent}>
                        <Avatar.Text size={80} label="JS" style={styles.avatar} />
                        <Text variant="titleLarge" style={styles.userName}>
                            João Silva
                        </Text>
                        <Text variant="bodyMedium" style={styles.userEmail}>
                            joao.silva@email.com
                        </Text>
                        <Text variant="bodySmall" style={styles.userType}>
                            Proprietário de Veículo
                        </Text>
                    </Card.Content>
                </Card>

                {/* Menu Options */}
                <Card style={styles.menuCard}>
                    <Card.Content>
                        <View style={styles.menuItem}>
                            <MaterialCommunityIcons name="account-edit" size={24} color="#1976d2" />
                            <Text variant="titleMedium" style={styles.menuText}>
                                Editar Perfil
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.menuItem}>
                            <MaterialCommunityIcons name="bell-outline" size={24} color="#1976d2" />
                            <Text variant="titleMedium" style={styles.menuText}>
                                Notificações
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.menuItem}>
                            <MaterialCommunityIcons name="help-circle-outline" size={24} color="#1976d2" />
                            <Text variant="titleMedium" style={styles.menuText}>
                                Ajuda & Suporte
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.menuItem}>
                            <MaterialCommunityIcons name="cog-outline" size={24} color="#1976d2" />
                            <Text variant="titleMedium" style={styles.menuText}>
                                Configurações
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                        </View>
                    </Card.Content>
                </Card>

                {/* Logout Button */}
                <Button
                    mode="outlined"
                    onPress={() => console.log('Logout')}
                    style={styles.logoutButton}
                    contentStyle={styles.logoutContent}
                    labelStyle={styles.logoutLabel}
                    icon="logout"
                >
                    Sair da Conta
                </Button>

                {/* Bottom Spacer */}
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
    profileCard: {
        marginHorizontal: 20,
        marginTop: 10,
        elevation: 3,
        borderRadius: 12,
    },
    profileContent: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    avatar: {
        backgroundColor: '#1976d2',
        marginBottom: 16,
    },
    userName: {
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    userEmail: {
        color: '#666',
        marginBottom: 4,
    },
    userType: {
        color: '#1976d2',
        fontWeight: '500',
    },
    menuCard: {
        marginHorizontal: 20,
        marginTop: 20,
        elevation: 3,
        borderRadius: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        color: '#222',
    },
    divider: {
        marginVertical: 8,
    },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 20,
        borderColor: '#d32f2f',
        borderRadius: 8,
    },
    logoutContent: {
        paddingVertical: 8,
    },
    logoutLabel: {
        color: '#d32f2f',
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 120,
    },
});
