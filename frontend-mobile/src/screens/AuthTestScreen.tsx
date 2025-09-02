import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext as useAuth } from '../contexts/AuthContext';

// 🧪 Componente para testar Autenticação Real vs Mock
export default function AuthTestScreen() {
    const auth = useAuth();
    const [email, setEmail] = useState('test@carrepair.com');
    const [password, setPassword] = useState('123456');
    const [useRealAPI, setUseRealAPI] = useState(false);

    const handleLogin = async () => {
        try {
            await auth.login({ email, password });
            console.log('✅ Login realizado com sucesso');
        } catch (error: any) {
            console.error('❌ Erro no login:', error.message);
            Alert.alert('Erro no login', error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.logout();
            console.log('✅ Logout realizado com sucesso');
        } catch (error: any) {
            console.error('❌ Erro no logout:', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineSmall" style={styles.title}>
                        🧪 Teste de Autenticação
                    </Text>

                    {/* Switch para alternar API */}
                    <View style={styles.switchContainer}>
                        <Text variant="bodyLarge">Usar API Real:</Text>
                        <Switch
                            value={useRealAPI}
                            onValueChange={setUseRealAPI}
                            disabled // Por enquanto desabilitado
                        />
                    </View>

                    <Text variant="bodySmall" style={styles.apiStatus}>
                        Modo atual: {useRealAPI ? '🌐 API Real' : '🔧 Mock'}
                    </Text>

                    {/* Status de autenticação */}
                    <View style={styles.statusContainer}>
                        <Text variant="titleMedium">
                            Status: {auth.isAuthenticated ? '✅ Logado' : '❌ Deslogado'}
                        </Text>

                        {auth.user && (
                            <View style={styles.userInfo}>
                                <Text variant="bodyMedium">Nome: {auth.user.name}</Text>
                                <Text variant="bodyMedium">Email: {auth.user.email}</Text>
                                <Text variant="bodyMedium">Perfil: {auth.user.profile}</Text>
                            </View>
                        )}
                    </View>

                    {!auth.isAuthenticated ? (
                        // Formulário de login
                        <View style={styles.loginForm}>
                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                            />

                            <TextInput
                                label="Senha"
                                value={password}
                                onChangeText={setPassword}
                                mode="outlined"
                                secureTextEntry
                                style={styles.input}
                            />

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={auth.isLoading}
                                disabled={auth.isLoading}
                                style={styles.button}
                            >
                                {auth.isLoading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </View>
                    ) : (
                        // Botões para usuário logado
                        <View style={styles.loggedInActions}>
                            <Button
                                mode="outlined"
                                onPress={handleLogout}
                                loading={auth.isLoading}
                                disabled={auth.isLoading}
                                style={styles.button}
                            >
                                {auth.isLoading ? 'Saindo...' : 'Sair'}
                            </Button>

                            <Button
                                mode="contained"
                                onPress={() => console.log('Atualizar dados (não implementado)')}
                                style={styles.button}
                            >
                                Atualizar Dados
                            </Button>
                        </View>
                    )}

                    {/* Informações técnicas */}
                    <View style={styles.techInfo}>
                        <Text variant="labelSmall" style={styles.techLabel}>
                            📊 Informações Técnicas:
                        </Text>
                        <Text variant="bodySmall">
                            • Loading: {auth.isLoading ? 'Sim' : 'Não'}
                        </Text>
                        <Text variant="bodySmall">
                            • Autenticado: {auth.isAuthenticated ? 'Sim' : 'Não'}
                        </Text>
                        <Text variant="bodySmall">
                            • Usuário ID: {auth.user?.id || 'N/A'}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    card: {
        flex: 1,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    apiStatus: {
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
        color: '#666',
    },
    statusContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    userInfo: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
    },
    loginForm: {
        marginBottom: 20,
    },
    loggedInActions: {
        marginBottom: 20,
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginVertical: 8,
    },
    techInfo: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#fff3e0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    techLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#f57c00',
    },
});
