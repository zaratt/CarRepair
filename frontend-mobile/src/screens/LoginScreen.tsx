import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput } from 'react-native-paper';
import { useAuthContext as useAuth } from '../contexts/AuthContext';
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6f6' }}>
            <View style={{
                width: '100%',
                maxWidth: 380,
                backgroundColor: '#fff',
                borderRadius: 18,
                padding: 28,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
                alignItems: 'center',
            }}>
                <MaterialCommunityIcons name="car-wrench" size={48} color="#1976d2" style={{ marginBottom: 12 }} />
                <Text variant="titleLarge" style={{ marginBottom: 8, fontWeight: 'bold', color: '#222' }}>Bem-vindo!</Text>
                <Text style={{ marginBottom: 24, color: '#666', textAlign: 'center' }}>
                    Faça login para acessar seus veículos e manutenções.
                </Text>

                <TextInput
                    label="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{ marginBottom: 16, width: 260, backgroundColor: '#f3f6fa', borderRadius: 8 }}
                    left={<TextInput.Icon icon="email-outline" />}
                    disabled={isLoading}
                />

                <TextInput
                    label="Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{ marginBottom: 24, width: 260, backgroundColor: '#f3f6fa', borderRadius: 8 }}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? "eye-off" : "eye"}
                            onPress={() => setShowPassword(!showPassword)}
                        />
                    }
                    disabled={isLoading}
                />

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={isLoading}
                    style={{ marginBottom: 12, width: 260, borderRadius: 8, backgroundColor: '#1976d2' }}
                    contentStyle={{ paddingVertical: 6 }}
                    labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                >
                    Entrar
                </Button>

                <Button
                    mode="text"
                    onPress={goToRegister}
                    disabled={isLoading}
                    style={{ marginBottom: 12 }}
                    labelStyle={{ color: '#1976d2' }}
                >
                    Criar nova conta
                </Button>

                <Text style={{ color: '#888', fontSize: 13, marginBottom: 0, textAlign: 'center' }}>
                    Use seu e-mail e senha para acessar
                </Text>
            </View>

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}
                style={{ backgroundColor: '#d32f2f', borderRadius: 8, marginBottom: 24 }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{snackbar.message}</Text>
            </Snackbar>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f7f7f7',
    },
    form: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        elevation: 2,
    },
    input: {
        width: '100%',
        marginBottom: 18,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 8,
        marginBottom: 16,
    },
});

export default LoginScreen;
