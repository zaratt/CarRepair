import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Snackbar, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import {
    DocumentValidator,
    EmailValidator,
    PasswordValidator,
    PhoneValidator
} from '../utils/validators';

interface Props {
    navigation: any;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        document: '',
        phone: '',
        city: '',
        state: '',
        userType: 'car_owner' as 'car_owner' | 'wshop_owner',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'error' | 'success' }>({
        visible: false,
        message: '',
        type: 'error'
    });

    const { register, isLoading } = useAuth();

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = (): string[] => {
        const errors: string[] = [];

        // Nome obrigatório
        if (!formData.name.trim()) {
            errors.push('Nome é obrigatório');
        } else if (formData.name.trim().length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }

        // Email
        if (!formData.email.trim()) {
            errors.push('E-mail é obrigatório');
        } else if (!EmailValidator.isValidEmail(formData.email)) {
            errors.push('E-mail inválido');
        }

        // Documento
        if (!formData.document.trim()) {
            errors.push('CPF ou CNPJ é obrigatório');
        } else {
            const docValidation = DocumentValidator.isValidDocument(formData.document);
            if (!docValidation.isValid) {
                errors.push('CPF ou CNPJ inválido');
            }
        }

        // Senha
        const passwordValidation = PasswordValidator.validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }

        // Confirmação de senha
        if (!PasswordValidator.validatePasswordConfirmation(formData.password, formData.confirmPassword)) {
            errors.push('Senhas não coincidem');
        }

        // Telefone (opcional, mas se preenchido deve ser válido)
        if (formData.phone && !PhoneValidator.isValidPhone(formData.phone)) {
            errors.push('Telefone inválido');
        }

        return errors;
    };

    const handleRegister = async () => {
        const errors = validateForm();

        if (errors.length > 0) {
            setSnackbar({
                visible: true,
                message: errors[0], // Mostrar primeiro erro
                type: 'error'
            });
            return;
        }

        try {
            await register({
                name: formData.name.trim(),
                email: EmailValidator.normalizeEmail(formData.email),
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                document: DocumentValidator.removeFormatting(formData.document),
                phone: formData.phone ? PhoneValidator.removeFormatting(formData.phone) : undefined,
                city: formData.city || undefined,
                state: formData.state ? formData.state.toUpperCase() : undefined,
            });

            setSnackbar({
                visible: true,
                message: 'Conta criada com sucesso!',
                type: 'success'
            });

            // Redirecionar após sucesso
            setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }, 1500);

        } catch (error: any) {
            setSnackbar({
                visible: true,
                message: error.message || 'Erro ao criar conta',
                type: 'error'
            });
        }
    };

    const goToLogin = () => {
        navigation.navigate('Login');
    };

    const formatDocument = (value: string) => {
        const formatted = DocumentValidator.formatDocument(value);
        updateFormData('document', formatted);
    };

    const formatPhone = (value: string) => {
        const formatted = PhoneValidator.formatPhone(value);
        updateFormData('phone', formatted);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="account-plus" size={48} color="#1976d2" style={{ marginBottom: 12 }} />
                <Text variant="titleLarge" style={{ marginBottom: 8, fontWeight: 'bold', color: '#222' }}>
                    Criar Conta
                </Text>
                <Text style={{ marginBottom: 24, color: '#666', textAlign: 'center' }}>
                    Preencha os dados para criar sua conta
                </Text>
            </View>

            <View style={styles.form}>
                {/* Tipo de usuário */}
                <Text style={styles.sectionTitle}>Tipo de conta</Text>
                <SegmentedButtons
                    value={formData.userType}
                    onValueChange={(value) => updateFormData('userType', value)}
                    buttons={[
                        {
                            value: 'car_owner',
                            label: 'Proprietário',
                            icon: 'car',
                        },
                        {
                            value: 'wshop_owner',
                            label: 'Oficina',
                            icon: 'wrench',
                        },
                    ]}
                    style={styles.segmentedButtons}
                />

                {/* Dados pessoais */}
                <Text style={styles.sectionTitle}>Dados pessoais</Text>

                <TextInput
                    label="Nome completo *"
                    value={formData.name}
                    onChangeText={(value) => updateFormData('name', value)}
                    style={styles.input}
                    left={<TextInput.Icon icon="account-outline" />}
                    disabled={isLoading}
                />

                <TextInput
                    label="E-mail *"
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    left={<TextInput.Icon icon="email-outline" />}
                    disabled={isLoading}
                />

                <TextInput
                    label={formData.userType === 'wshop_owner' ? 'CNPJ *' : 'CPF ou CNPJ *'}
                    value={formData.document}
                    onChangeText={formatDocument}
                    keyboardType="numeric"
                    style={styles.input}
                    left={<TextInput.Icon icon="card-account-details-outline" />}
                    disabled={isLoading}
                />

                <TextInput
                    label="Telefone"
                    value={formData.phone}
                    onChangeText={formatPhone}
                    keyboardType="phone-pad"
                    style={styles.input}
                    left={<TextInput.Icon icon="phone-outline" />}
                    disabled={isLoading}
                />

                {/* Localização */}
                <Text style={styles.sectionTitle}>Localização</Text>

                <TextInput
                    label="Cidade"
                    value={formData.city}
                    onChangeText={(value) => updateFormData('city', value)}
                    style={styles.input}
                    left={<TextInput.Icon icon="map-marker-outline" />}
                    disabled={isLoading}
                />

                <TextInput
                    label="Estado (UF)"
                    value={formData.state}
                    onChangeText={(value) => updateFormData('state', value.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={2}
                    style={styles.input}
                    left={<TextInput.Icon icon="map-outline" />}
                    disabled={isLoading}
                />

                {/* Senha */}
                <Text style={styles.sectionTitle}>Senha</Text>

                <TextInput
                    label="Senha *"
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? "eye-off" : "eye"}
                            onPress={() => setShowPassword(!showPassword)}
                        />
                    }
                    disabled={isLoading}
                />

                <TextInput
                    label="Confirmar senha *"
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock-check-outline" />}
                    right={
                        <TextInput.Icon
                            icon={showConfirmPassword ? "eye-off" : "eye"}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                    }
                    disabled={isLoading}
                />

                {/* Informações da senha */}
                <Text style={styles.passwordInfo}>
                    A senha deve conter: 8+ caracteres, letra maiúscula, minúscula, número e símbolo
                </Text>

                {/* Botões */}
                <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.button}
                    contentStyle={{ paddingVertical: 6 }}
                    labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                >
                    Criar Conta
                </Button>

                <Button
                    mode="text"
                    onPress={goToLogin}
                    disabled={isLoading}
                    style={styles.textButton}
                    labelStyle={{ color: '#1976d2' }}
                >
                    Já tenho uma conta
                </Button>
            </View>

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={4000}
                style={{
                    backgroundColor: snackbar.type === 'success' ? '#4caf50' : '#d32f2f',
                    borderRadius: 8,
                    marginBottom: 24
                }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{snackbar.message}</Text>
            </Snackbar>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
    },
    header: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    form: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 18,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 16,
        marginTop: 8,
    },
    segmentedButtons: {
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#f3f6fa',
        borderRadius: 8,
    },
    passwordInfo: {
        fontSize: 12,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 16,
    },
    button: {
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: '#1976d2',
    },
    textButton: {
        marginBottom: 8,
    },
});

export default RegisterScreen;
