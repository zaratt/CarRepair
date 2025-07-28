import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';

export default function EditProfileScreen() {
    const [userData, setUserData] = useState({
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        console.log('Salvando dados do perfil:', userData);
        setIsEditing(false);
        // TODO: Implementar salvamento real
    };

    const handleCancel = () => {
        console.log('Cancelando edição');
        setIsEditing(false);
        // TODO: Reverter alterações não salvas
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* 🟡 SEÇÃO AVATAR (sem header amarelo) */}
                <Card style={styles.section}>
                    <Card.Content style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 24 }}>
                        <Avatar.Text
                            size={100}
                            label={userData.name.split(' ').map(n => n[0]).join('')}
                            style={styles.avatar}
                            labelStyle={styles.avatarText}
                        />
                        <Button
                            mode="outlined"
                            onPress={() => console.log('Alterar foto')}
                            style={styles.changePhotoButton}
                            labelStyle={styles.changePhotoText}
                            contentStyle={styles.changePhotoContent}
                        >
                            Alterar Foto
                        </Button>
                    </Card.Content>
                </Card>

                {/* ⚪ DADOS PESSOAIS */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Dados Pessoais
                        </Text>

                        <TextInput
                            label="Nome Completo"
                            value={userData.name}
                            onChangeText={(text) => setUserData({ ...userData, name: text })}
                            mode="outlined"
                            style={styles.input}
                            disabled={!isEditing}
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                        />

                        <TextInput
                            label="E-mail"
                            value={userData.email}
                            onChangeText={(text) => setUserData({ ...userData, email: text })}
                            mode="outlined"
                            style={styles.input}
                            disabled={!isEditing}
                            keyboardType="email-address"
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                        />

                        <TextInput
                            label="Telefone"
                            value={userData.phone}
                            onChangeText={(text) => setUserData({ ...userData, phone: text })}
                            mode="outlined"
                            style={styles.input}
                            disabled={!isEditing}
                            keyboardType="phone-pad"
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                        />

                        <TextInput
                            label="CPF"
                            value={userData.cpf}
                            onChangeText={(text) => setUserData({ ...userData, cpf: text })}
                            mode="outlined"
                            style={styles.input}
                            disabled={!isEditing}
                            keyboardType="numeric"
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                        />
                    </Card.Content>
                </Card>

                {/* ⚪ ENDEREÇO */}
                <Card style={styles.section}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Endereço
                        </Text>

                        <TextInput
                            label="Endereço"
                            value={userData.address}
                            onChangeText={(text) => setUserData({ ...userData, address: text })}
                            mode="outlined"
                            style={styles.input}
                            disabled={!isEditing}
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                        />

                        <View style={styles.row}>
                            <TextInput
                                label="Cidade"
                                value={userData.city}
                                onChangeText={(text) => setUserData({ ...userData, city: text })}
                                mode="outlined"
                                style={[styles.input, styles.inputHalf]}
                                disabled={!isEditing}
                                outlineColor={AppColors.primary}
                                activeOutlineColor={AppColors.secondary}
                            />

                            <TextInput
                                label="Estado"
                                value={userData.state}
                                onChangeText={(text) => setUserData({ ...userData, state: text })}
                                mode="outlined"
                                style={[styles.input, styles.inputHalf]}
                                disabled={!isEditing}
                                outlineColor={AppColors.primary}
                                activeOutlineColor={AppColors.secondary}
                            />
                        </View>

                        <TextInput
                            label="CEP"
                            value={userData.zipCode}
                            onChangeText={(text) => setUserData({ ...userData, zipCode: text })}
                            mode="outlined"
                            style={styles.input}
                            disabled={!isEditing}
                            keyboardType="numeric"
                            outlineColor={AppColors.primary}
                            activeOutlineColor={AppColors.secondary}
                        />
                    </Card.Content>
                </Card>

                {/* 🟡 BOTÕES DE AÇÃO */}
                <View style={styles.actionButtons}>
                    {!isEditing ? (
                        <Button
                            mode="contained"
                            onPress={() => setIsEditing(true)}
                            style={styles.editButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.editButtonText}
                            icon="pencil"
                        >
                            Editar Perfil
                        </Button>
                    ) : (
                        <View style={styles.editingButtons}>
                            <Button
                                mode="outlined"
                                onPress={handleCancel}
                                style={styles.cancelButton}
                                contentStyle={styles.buttonContent}
                                labelStyle={styles.cancelButtonText}
                                icon="close"
                            >
                                Cancelar
                            </Button>

                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                contentStyle={styles.buttonContent}
                                labelStyle={styles.saveButtonText}
                                icon="check"
                            >
                                Salvar
                            </Button>
                        </View>
                    )}
                </View>

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
    avatar: {
        backgroundColor: AppColors.primary,
        marginBottom: 16,
    },
    avatarText: {
        color: AppColors.text,
        fontWeight: 'bold',
    },
    changePhotoButton: {
        borderColor: AppColors.primary,
        borderWidth: 1,
        borderRadius: 6,
        marginTop: 8,
    },
    changePhotoContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    changePhotoText: {
        color: AppColors.primary,
        fontWeight: '600',
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
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: AppColors.white,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputHalf: {
        width: '48%',
    },
    actionButtons: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    editButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    editButtonText: {
        color: AppColors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    editingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        width: '48%',
        borderColor: AppColors.danger,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: AppColors.danger,
        fontWeight: 'bold',
    },
    saveButton: {
        width: '48%',
        backgroundColor: AppColors.secondary,
        borderRadius: 8,
    },
    saveButtonText: {
        color: AppColors.text,
        fontWeight: 'bold',
    },
    bottomSpacer: {
        height: 112, // Espaço para tabs flutuantes (70px tab + 42px margem)
    },
});
