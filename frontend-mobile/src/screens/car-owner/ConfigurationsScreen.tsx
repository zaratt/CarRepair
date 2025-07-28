import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Card, List, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';

export default function ConfigurationsScreen() {
    const [settings, setSettings] = useState({
        // Aparência
        darkMode: false,
        compactView: false,

        // Privacidade
        shareData: true,
        analytics: true,
        locationAccess: true,

        // Segurança
        biometricAuth: false,
        autoLock: true,

        // Armazenamento
        cacheEnabled: true,
        autoBackup: true,
    });

    const handleToggle = (key: string, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
        console.log(`Configuração ${key} alterada para:`, value);
    };

    const handleClearCache = () => {
        Alert.alert(
            'Limpar Cache',
            'Tem certeza que deseja limpar o cache do aplicativo? Isso pode melhorar a performance.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpar',
                    style: 'destructive',
                    onPress: () => {
                        console.log('Cache limpo');
                        // TODO: Implementar limpeza de cache
                    }
                }
            ]
        );
    };

    const handleResetSettings = () => {
        Alert.alert(
            'Resetar Configurações',
            'Tem certeza que deseja resetar todas as configurações para o padrão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Resetar',
                    style: 'destructive',
                    onPress: () => {
                        console.log('Configurações resetadas');
                        setSettings({
                            darkMode: false,
                            compactView: false,
                            shareData: true,
                            analytics: true,
                            locationAccess: true,
                            biometricAuth: false,
                            autoLock: true,
                            cacheEnabled: true,
                            autoBackup: true,
                        });
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ⚪ APARÊNCIA */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Aparência
                        </Text>

                        <List.Item
                            title="Modo Escuro"
                            description="Ativar tema escuro do aplicativo"
                            left={(props) => <List.Icon {...props} icon="theme-light-dark" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.darkMode}
                                    onValueChange={(value) => handleToggle('darkMode', value)}
                                    thumbColor={settings.darkMode ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Visualização Compacta"
                            description="Exibir mais informações na tela"
                            left={(props) => <List.Icon {...props} icon="view-compact" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.compactView}
                                    onValueChange={(value) => handleToggle('compactView', value)}
                                    thumbColor={settings.compactView ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ PRIVACIDADE */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Privacidade
                        </Text>

                        <List.Item
                            title="Compartilhar Dados"
                            description="Permitir compartilhamento de dados para melhorias"
                            left={(props) => <List.Icon {...props} icon="share-variant" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.shareData}
                                    onValueChange={(value) => handleToggle('shareData', value)}
                                    thumbColor={settings.shareData ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Analytics"
                            description="Permitir coleta de dados de uso"
                            left={(props) => <List.Icon {...props} icon="chart-line" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.analytics}
                                    onValueChange={(value) => handleToggle('analytics', value)}
                                    thumbColor={settings.analytics ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Acesso à Localização"
                            description="Permitir acesso à localização do dispositivo"
                            left={(props) => <List.Icon {...props} icon="map-marker" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.locationAccess}
                                    onValueChange={(value) => handleToggle('locationAccess', value)}
                                    thumbColor={settings.locationAccess ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ SEGURANÇA */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Segurança
                        </Text>

                        <List.Item
                            title="Autenticação Biométrica"
                            description="Usar digital/Face ID para acessar o app"
                            left={(props) => <List.Icon {...props} icon="fingerprint" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.biometricAuth}
                                    onValueChange={(value) => handleToggle('biometricAuth', value)}
                                    thumbColor={settings.biometricAuth ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Bloqueio Automático"
                            description="Bloquear app após período de inatividade"
                            left={(props) => <List.Icon {...props} icon="lock" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.autoLock}
                                    onValueChange={(value) => handleToggle('autoLock', value)}
                                    thumbColor={settings.autoLock ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ ARMAZENAMENTO */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Armazenamento
                        </Text>

                        <List.Item
                            title="Cache Habilitado"
                            description="Armazenar dados temporários para melhor performance"
                            left={(props) => <List.Icon {...props} icon="cached" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.cacheEnabled}
                                    onValueChange={(value) => handleToggle('cacheEnabled', value)}
                                    thumbColor={settings.cacheEnabled ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Backup Automático"
                            description="Fazer backup automático dos dados"
                            left={(props) => <List.Icon {...props} icon="backup-restore" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={settings.autoBackup}
                                    onValueChange={(value) => handleToggle('autoBackup', value)}
                                    thumbColor={settings.autoBackup ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ AÇÕES AVANÇADAS */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Ações Avançadas
                        </Text>

                        <List.Item
                            title="Limpar Cache"
                            description="Remover dados temporários armazenados"
                            left={(props) => <List.Icon {...props} icon="delete-sweep" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={handleClearCache}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Resetar Configurações"
                            description="Voltar todas as configurações ao padrão"
                            left={(props) => <List.Icon {...props} icon="restore" color={AppColors.danger} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.danger} />}
                            onPress={handleResetSettings}
                            style={styles.listItem}
                            titleStyle={{ color: AppColors.danger }}
                            descriptionStyle={{ color: AppColors.danger, opacity: 0.7 }}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ INFORMAÇÕES DO APP */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Sobre o Aplicativo
                        </Text>

                        <List.Item
                            title="Versão do App"
                            description="1.0.0 (Build 001)"
                            left={(props) => <List.Icon {...props} icon="information" color={AppColors.text} />}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Última Atualização"
                            description="27 de Janeiro de 2025"
                            left={(props) => <List.Icon {...props} icon="update" color={AppColors.text} />}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* Espaçamento para tabs flutuantes */}
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
        paddingVertical: 4,
    },
    bottomSpacer: {
        height: 112, // Espaço para tabs flutuantes (70px tab + 42px margem)
    },
});
