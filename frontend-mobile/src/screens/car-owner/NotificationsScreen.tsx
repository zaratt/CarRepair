import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, List, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState({
        // Notificações Gerais
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,

        // Manutenções
        maintenanceReminders: true,
        maintenanceUpdates: true,
        maintenanceExpiring: true,

        // Inspeções
        inspectionReminders: true,
        inspectionResults: true,

        // Sistema
        systemUpdates: false,
        promotions: false,
        newsletter: true,
    });

    const handleToggle = (key: string, value: boolean) => {
        setNotifications(prev => ({
            ...prev,
            [key]: value
        }));
        console.log(`Notificação ${key} alterada para:`, value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ⚪ NOTIFICAÇÕES GERAIS */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Notificações Gerais
                        </Text>

                        <List.Item
                            title="Notificações Push"
                            description="Receber notificações no dispositivo"
                            left={(props) => <List.Icon {...props} icon="bell" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.pushNotifications}
                                    onValueChange={(value) => handleToggle('pushNotifications', value)}
                                    thumbColor={notifications.pushNotifications ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="E-mail"
                            description="Receber notificações por e-mail"
                            left={(props) => <List.Icon {...props} icon="email" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.emailNotifications}
                                    onValueChange={(value) => handleToggle('emailNotifications', value)}
                                    thumbColor={notifications.emailNotifications ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="SMS"
                            description="Receber notificações por SMS"
                            left={(props) => <List.Icon {...props} icon="message-text" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.smsNotifications}
                                    onValueChange={(value) => handleToggle('smsNotifications', value)}
                                    thumbColor={notifications.smsNotifications ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ MANUTENÇÕES */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Manutenções
                        </Text>

                        <List.Item
                            title="Lembretes de Manutenção"
                            description="Lembrar sobre manutenções agendadas"
                            left={(props) => <List.Icon {...props} icon="wrench" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.maintenanceReminders}
                                    onValueChange={(value) => handleToggle('maintenanceReminders', value)}
                                    thumbColor={notifications.maintenanceReminders ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Atualizações de Status"
                            description="Notificar mudanças no status da manutenção"
                            left={(props) => <List.Icon {...props} icon="update" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.maintenanceUpdates}
                                    onValueChange={(value) => handleToggle('maintenanceUpdates', value)}
                                    thumbColor={notifications.maintenanceUpdates ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Manutenções Vencendo"
                            description="Avisar sobre manutenções próximas do vencimento"
                            left={(props) => <List.Icon {...props} icon="clock-alert" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.maintenanceExpiring}
                                    onValueChange={(value) => handleToggle('maintenanceExpiring', value)}
                                    thumbColor={notifications.maintenanceExpiring ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ INSPEÇÕES */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Inspeções
                        </Text>

                        <List.Item
                            title="Lembretes de Inspeção"
                            description="Lembrar sobre inspeções agendadas"
                            left={(props) => <List.Icon {...props} icon="file-search" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.inspectionReminders}
                                    onValueChange={(value) => handleToggle('inspectionReminders', value)}
                                    thumbColor={notifications.inspectionReminders ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Resultados de Inspeção"
                            description="Notificar quando resultados estiverem prontos"
                            left={(props) => <List.Icon {...props} icon="clipboard-check" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.inspectionResults}
                                    onValueChange={(value) => handleToggle('inspectionResults', value)}
                                    thumbColor={notifications.inspectionResults ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ SISTEMA */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Sistema e Marketing
                        </Text>

                        <List.Item
                            title="Atualizações do Sistema"
                            description="Notificar sobre atualizações do app"
                            left={(props) => <List.Icon {...props} icon="system-update" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.systemUpdates}
                                    onValueChange={(value) => handleToggle('systemUpdates', value)}
                                    thumbColor={notifications.systemUpdates ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Promoções e Ofertas"
                            description="Receber ofertas especiais"
                            left={(props) => <List.Icon {...props} icon="tag" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.promotions}
                                    onValueChange={(value) => handleToggle('promotions', value)}
                                    thumbColor={notifications.promotions ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Newsletter"
                            description="Receber newsletter mensal"
                            left={(props) => <List.Icon {...props} icon="email-newsletter" color={AppColors.text} />}
                            right={() => (
                                <Switch
                                    value={notifications.newsletter}
                                    onValueChange={(value) => handleToggle('newsletter', value)}
                                    thumbColor={notifications.newsletter ? AppColors.primary : '#f4f3f4'}
                                    trackColor={{ false: '#767577', true: AppColors.secondary }}
                                />
                            )}
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
