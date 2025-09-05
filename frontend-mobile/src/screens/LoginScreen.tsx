import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput } from 'react-native-paper';
import { useAuthContext as useAuth } from '../contexts/AuthContext';
import { AppColors } from '../styles/colors';
import { EmailValidator } from '../utils/validators';

interface Props {
    navigation: any;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const { login, isLoading } = useAuth();

    const handleLogin = async () => {
        // ✅ VALIDAÇÕES
        if (!email.trim()) {
            setSnackbar({ visible: true, message: 'E-mail é obrigatório' });
            return;
        }

        if (!EmailValidator.isValidEmail(email)) {
            setSnackbar({ visible: true, message: 'E-mail inválido' });
            return;
        }

        if (!password) {
            setSnackbar({ visible: true, message: 'Senha é obrigatória' });
            return;
        }

        try {
            await login({
                email: EmailValidator.normalizeEmail(email),
                password,
            });

            // ✅ Sucesso - o useAuth automaticamente gerencia a navegação
            // Não precisa navegar manualmente aqui
        } catch (error: any) {
            setSnackbar({
                visible: true,
                message: error.message || 'Erro no login. Verifique suas credenciais.'
            });
        }
    };

    const goToRegister = () => {
        navigation.navigate('Register');
    };

    return (
        <View style={styles.container}>
            <View style={styles.loginBox}>
                <MaterialCommunityIcons
                    name="car-wrench"
                    size={48}
                    color={AppColors.text}
                    style={styles.icon}
                />
                <Text variant="titleLarge" style={styles.title}>Bem-vindo!</Text>
                <Text style={styles.subtitle}>
                    Faça login para acessar seus veículos e manutenções.
                </Text>

                <TextInput
                    label="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    left={<TextInput.Icon icon="email-outline" />}
                    disabled={isLoading}
                    theme={{
                        colors: {
                            primary: AppColors.text,
                            onSurface: AppColors.text,
                        }
                    }}
                />

                <TextInput
                    label="Senha"
                    value={password}
                    onChangeText={setPassword}
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
                    theme={{
                        colors: {
                            primary: AppColors.text,
                            onSurface: AppColors.text,
                        }
                    }}
                />

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.loginButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    buttonColor={AppColors.primary}
                    textColor={AppColors.text}
                >
                    Entrar
                </Button>

                <Button
                    mode="text"
                    onPress={goToRegister}
                    disabled={isLoading}
                    style={styles.registerButton}
                    labelStyle={styles.registerButtonLabel}
                >
                    Criar nova conta
                </Button>

                <Text style={styles.helpText}>
                    Use seu e-mail e senha para acessar
                </Text>
            </View>

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}
                style={styles.snackbar}
            >
                <Text style={styles.snackbarText}>{snackbar.message}</Text>
            </Snackbar>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.primary, // Fundo amarelo #F7C910
        padding: 24,
    },
    loginBox: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: AppColors.white, // Caixa central branca
        borderRadius: 18,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center',
    },
    icon: {
        marginBottom: 12,
    },
    title: {
        marginBottom: 8,
        fontWeight: 'bold',
        color: AppColors.text, // Texto preto
    },
    subtitle: {
        marginBottom: 24,
        color: AppColors.text,
        textAlign: 'center',
        opacity: 0.7,
    },
    input: {
        marginBottom: 16,
        width: 260,
        backgroundColor: AppColors.white,
    },
    loginButton: {
        marginBottom: 12,
        width: 260,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 6,
    },
    buttonLabel: {
        fontWeight: 'bold',
        fontSize: 16,
        color: AppColors.text, // Texto preto no botão
    },
    registerButton: {
        marginBottom: 12,
    },
    registerButtonLabel: {
        color: AppColors.text, // Texto preto
    },
    helpText: {
        color: AppColors.text,
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.6,
    },
    snackbar: {
        backgroundColor: AppColors.danger,
        borderRadius: 8,
        marginBottom: 24,
    },
    snackbarText: {
        color: AppColors.white,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
