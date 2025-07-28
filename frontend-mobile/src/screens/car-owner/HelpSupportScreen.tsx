import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';

export default function HelpSupportScreen() {
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: '',
    });

    const handleSendMessage = () => {
        if (!contactForm.subject.trim() || !contactForm.message.trim()) {
            console.log('Erro: Preencha todos os campos');
            return;
        }

        console.log('Enviando mensagem:', contactForm);
        setContactForm({ subject: '', message: '' });
        // TODO: Implementar envio real
    };

    const handlePhoneCall = () => {
        const phoneNumber = 'tel:+5511999999999';
        Linking.openURL(phoneNumber).catch(err => console.error('Erro ao abrir telefone:', err));
    };

    const handleWhatsApp = () => {
        const whatsappUrl = 'https://wa.me/5511999999999?text=Olá, preciso de ajuda com o CarRepair';
        Linking.openURL(whatsappUrl).catch(err => console.error('Erro ao abrir WhatsApp:', err));
    };

    const handleEmail = () => {
        const emailUrl = 'mailto:suporte@carrepair.com?subject=Solicita%C3%A7%C3%A3o%20de%20Suporte';
        Linking.openURL(emailUrl).catch(err => console.error('Erro ao abrir e-mail:', err));
    };

    const handleWebsite = () => {
        const websiteUrl = 'https://carrepair.com/ajuda';
        Linking.openURL(websiteUrl).catch(err => console.error('Erro ao abrir website:', err));
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ⚪ CONTATO RÁPIDO */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Contato Rápido
                        </Text>

                        <List.Item
                            title="Telefone"
                            description="(11) 99999-9999"
                            left={(props) => <List.Icon {...props} icon="phone" color={AppColors.secondary} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={handlePhoneCall}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="WhatsApp"
                            description="Chat direto pelo WhatsApp"
                            left={(props) => <List.Icon {...props} icon="whatsapp" color="#25D366" />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={handleWhatsApp}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="E-mail"
                            description="suporte@carrepair.com"
                            left={(props) => <List.Icon {...props} icon="email" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={handleEmail}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Site de Ajuda"
                            description="Central de ajuda online"
                            left={(props) => <List.Icon {...props} icon="web" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={handleWebsite}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ PERGUNTAS FREQUENTES */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Perguntas Frequentes
                        </Text>

                        <List.Item
                            title="Como agendar uma manutenção?"
                            description="Vá em Manutenções → Agendar Nova"
                            left={(props) => <List.Icon {...props} icon="help-circle" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => console.log('FAQ: Agendar manutenção')}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Como visualizar o histórico?"
                            description="Acesse a aba Manutenções → Histórico"
                            left={(props) => <List.Icon {...props} icon="help-circle" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => console.log('FAQ: Histórico')}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Como alterar meus dados?"
                            description="Vá em Perfil → Editar Perfil"
                            left={(props) => <List.Icon {...props} icon="help-circle" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => console.log('FAQ: Alterar dados')}
                            style={styles.listItem}
                        />

                        <List.Item
                            title="Como cancelar um agendamento?"
                            description="Toque no agendamento → Cancelar"
                            left={(props) => <List.Icon {...props} icon="help-circle" color={AppColors.text} />}
                            right={(props) => <List.Icon {...props} icon="chevron-right" color={AppColors.text} />}
                            onPress={() => console.log('FAQ: Cancelar agendamento')}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ ENVIAR MENSAGEM */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Enviar Mensagem
                        </Text>

                        <TextInput
                            label="Assunto"
                            value={contactForm.subject}
                            onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
                            mode="outlined"
                            style={styles.input}
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                            placeholder="Ex: Problema com agendamento"
                        />

                        <TextInput
                            label="Mensagem"
                            value={contactForm.message}
                            onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                            placeholder="Descreva seu problema ou dúvida..."
                        />

                        <Button
                            mode="contained"
                            onPress={handleSendMessage}
                            style={styles.sendButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.sendButtonText}
                            icon="send"
                        >
                            Enviar Mensagem
                        </Button>
                    </Card.Content>
                </Card>

                {/* ⚪ HORÁRIO DE ATENDIMENTO */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Horário de Atendimento
                        </Text>

                        <View style={styles.scheduleItem}>
                            <Text variant="bodyLarge" style={styles.scheduleDay}>
                                Segunda a Sexta
                            </Text>
                            <Text variant="bodyMedium" style={styles.scheduleTime}>
                                08:00 às 18:00
                            </Text>
                        </View>

                        <View style={styles.scheduleItem}>
                            <Text variant="bodyLarge" style={styles.scheduleDay}>
                                Sábado
                            </Text>
                            <Text variant="bodyMedium" style={styles.scheduleTime}>
                                08:00 às 12:00
                            </Text>
                        </View>

                        <View style={styles.scheduleItem}>
                            <Text variant="bodyLarge" style={styles.scheduleDay}>
                                Domingo
                            </Text>
                            <Text variant="bodyMedium" style={styles.scheduleTime}>
                                Fechado
                            </Text>
                        </View>

                        <View style={styles.emergencyNote}>
                            <Text variant="bodySmall" style={styles.emergencyText}>
                                * Para emergências, utilize o WhatsApp 24h
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* ⚪ VERSÃO E INFORMAÇÕES */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Informações do App
                        </Text>

                        <View style={styles.infoRow}>
                            <Text variant="bodyLarge" style={styles.infoLabel}>
                                Versão:
                            </Text>
                            <Text variant="bodyLarge" style={styles.infoValue}>
                                1.0.0 (001)
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text variant="bodyLarge" style={styles.infoLabel}>
                                Última Atualização:
                            </Text>
                            <Text variant="bodyLarge" style={styles.infoValue}>
                                27/01/2025
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text variant="bodyLarge" style={styles.infoLabel}>
                                Desenvolvido por:
                            </Text>
                            <Text variant="bodyLarge" style={styles.infoValue}>
                                CarRepair Team
                            </Text>
                        </View>
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
    input: {
        marginBottom: 12,
        backgroundColor: AppColors.white,
    },
    sendButton: {
        backgroundColor: AppColors.secondary,
        borderRadius: 8,
        marginTop: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    sendButtonText: {
        color: AppColors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    scheduleDay: {
        color: AppColors.text,
        fontWeight: '600',
    },
    scheduleTime: {
        color: AppColors.text,
        opacity: 0.8,
    },
    emergencyNote: {
        marginTop: 12,
        padding: 8,
        backgroundColor: '#FFF9E6',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: AppColors.primary,
    },
    emergencyText: {
        color: AppColors.text,
        fontStyle: 'italic',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    infoLabel: {
        color: AppColors.text,
        fontWeight: '600',
    },
    infoValue: {
        color: AppColors.text,
        opacity: 0.8,
    },
    bottomSpacer: {
        height: 112, // Espaço para tabs flutuantes (70px tab + 42px margem)
    },
});
