import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const [user] = useState({
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        avatar: null,
    });

    const handleLogout = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: () => {
                        console.log('Logout executado'); // ✅ Log como solicitado
                        // TODO: Implementar logout real em release futuro
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* 🟡 HEADER AMARELO COM PERFIL */}
                <View style={styles.header}>
                    <Avatar.Text
                        size={80}
                        label={user.name.split(' ').map(n => n[0]).join('')}
                        style={styles.avatar}
                        labelStyle={styles.avatarText}
                    />
                    <Text variant="headlineSmall" style={styles.userName}>
                        {user.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.userEmail}>
                        {user.email}
                    </Text>
                </View>

                {/* ⚪ SEÇÃO MEU PERFIL */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Meu Perfil
                        </Text>

                        <List.Item
                            title="Editar Perfil"
                            description="Alterar dados pessoais"
                            left={(props) => <List.Icon {...props} icon="account-edit" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => navigation.navigate('EditProfile' as never)}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ SEÇÃO PREFERÊNCIAS */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Preferências
                        </Text>

                        <List.Item
                            title="Notificações"
                            description="Gerenciar notificações"
                            left={(props) => <List.Icon {...props} icon="bell" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => navigation.navigate('Notifications' as never)}
                            style={styles.listItem}
                        />

                        <Divider style={styles.divider} />

                        <List.Item
                            title="Configurações"
                            description="Configurações do app"
                            left={(props) => <List.Icon {...props} icon="cog" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => navigation.navigate('Configurations' as never)}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ SEÇÃO SUPORTE */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Suporte
                        </Text>

                        <List.Item
                            title="Ajuda & Suporte"
                            description="Central de ajuda e contato"
                            left={(props) => <List.Icon {...props} icon="help-circle" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => navigation.navigate('HelpSupport' as never)}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* 🔴 BOTÃO SAIR */}
                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    contentStyle={styles.logoutButtonContent}
                    labelStyle={styles.logoutButtonText}
                    icon="logout"
                >
                    Sair da Conta
                </Button>

                {/* Espaçamento para tab bar */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    header: {
        backgroundColor: AppColors.primary,
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    avatar: {
        backgroundColor: AppColors.white,
        marginBottom: 16,
    },
    avatarText: {
        color: AppColors.text,
        fontWeight: 'bold',
    },
    userName: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        color: AppColors.text,
        opacity: 0.8,
    },
    section: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        elevation: 2,
    },
    sectionTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    listItem: {
        paddingVertical: 8,
    },
    divider: {
        backgroundColor: '#E0E0E0',
        marginVertical: 8,
    },
    logoutButton: {
        backgroundColor: AppColors.danger,
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 8,
    },
    logoutButtonContent: {
        paddingVertical: 8,
    },
    logoutButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    bottomSpacer: {
        height: 112,
    },
});
