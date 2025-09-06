import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
    AuthException,
    AuthResponse,
    AuthUser,
    ChangePasswordData,
    ErrorResponse,
    LoginCredentials,
    RegisterData
} from '../types/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://automazo-production.up.railway.app/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Keys para AsyncStorage
const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user_data',
};

export class AuthService {
    // ✅ REGISTRO DE USUÁRIO
    static async register(data: RegisterData): Promise<AuthResponse> {
        try {
            // Remover confirmPassword antes de enviar para o backend
            const { confirmPassword, ...registerData } = data;

            const response = await api.post('/auth/register', registerData);

            if (response.status === 201) {
                const authData: AuthResponse = response.data;
                await this.saveAuthData(authData.data);
                return authData;
            } else {
                throw new AuthException('Erro no registro');
            }
        } catch (error: any) {
            if (error.response?.data) {
                const errorData: ErrorResponse = error.response.data;
                throw new AuthException(errorData.message || 'Erro no registro');
            }
            throw new AuthException('Erro de conexão');
        }
    }

    // ✅ LOGIN
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/login', credentials);

            if (response.status === 200) {
                const authData: AuthResponse = response.data;
                await this.saveAuthData(authData.data);
                return authData;
            } else {
                throw new AuthException('Credenciais inválidas');
            }
        } catch (error: any) {
            if (error.response?.data) {
                const errorData: ErrorResponse = error.response.data;
                throw new AuthException(errorData.message || 'Erro no login');
            }
            throw new AuthException('Erro de conexão');
        }
    }

    // ✅ MUDANÇA DE SENHA
    static async changePassword(data: ChangePasswordData): Promise<void> {
        try {
            const token = await this.getToken();
            if (!token) {
                throw new AuthException('Token não encontrado');
            }

            const response = await api.put('/auth/change-password', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status !== 200) {
                throw new AuthException('Erro ao alterar senha');
            }
        } catch (error: any) {
            if (error.response?.data) {
                const errorData: ErrorResponse = error.response.data;
                throw new AuthException(errorData.message || 'Erro ao alterar senha');
            }
            throw new AuthException('Erro de conexão');
        }
    }

    // ✅ BUSCAR PERFIL DO USUÁRIO
    static async getProfile(): Promise<AuthUser> {
        try {
            const token = await this.getToken();
            if (!token) {
                throw new AuthException('Token não encontrado');
            }

            const response = await api.get('/auth/profile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                const userData: AuthUser = response.data.data;
                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
                return userData;
            } else {
                throw new AuthException('Erro ao buscar perfil');
            }
        } catch (error: any) {
            if (error.response?.data) {
                const errorData: ErrorResponse = error.response.data;
                throw new AuthException(errorData.message || 'Erro ao buscar perfil');
            }
            throw new AuthException('Erro de conexão');
        }
    }

    // ✅ LOGOUT
    static async logout(): Promise<void> {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.USER),
            ]);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    // ✅ LIMPAR STORAGE CORROMPIDO
    static async clearCorruptedStorage(): Promise<void> {
        try {
            console.log('🧹 Limpando dados corrompidos do AsyncStorage...');
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.USER),
            ]);
            console.log('✅ AsyncStorage limpo - faça login novamente');
        } catch (error) {
            console.error('❌ Erro ao limpar storage corrompido:', error);
        }
    }

    // ✅ SALVAR DADOS DE AUTENTICAÇÃO
    private static async saveAuthData(authData: {
        token: string;
        refreshToken: string;
        user: AuthUser;
    }): Promise<void> {
        try {
            await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authData.token),
                AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken),
                AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user)),
            ]);
        } catch (error) {
            console.error('Erro ao salvar dados de autenticação:', error);
            throw new AuthException('Erro ao salvar dados de autenticação');
        }
    }

    // ✅ OBTER TOKEN
    static async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) return null;

            // ✅ Verificar se token não está corrompido
            if (token.length < 10 || !token.includes('.')) {
                console.warn('Token corrompido detectado, limpando AsyncStorage...');
                await this.clearCorruptedStorage();
                return null;
            }

            // ✅ Verificar caracteres inválidos no token
            if (token.includes('ÿ') || token.includes('\u0000')) {
                console.warn('Token com caracteres inválidos detectado, limpando AsyncStorage...');
                await this.clearCorruptedStorage();
                return null;
            }

            return token;
        } catch (error) {
            console.error('Erro ao obter token:', error);
            await this.clearCorruptedStorage();
            return null;
        }
    }

    // ✅ OBTER USUÁRIO SALVO
    static async getUser(): Promise<AuthUser | null> {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            if (!userData) return null;

            // ✅ Verificar se é um JSON válido antes de fazer parse
            if (userData.length < 2 || !userData.startsWith('{')) {
                console.warn('Dados de usuário corrompidos, limpando AsyncStorage...');
                await this.clearCorruptedStorage();
                return null;
            }

            return JSON.parse(userData);
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            // ✅ Se JSON estiver corrompido, limpar storage
            await this.clearCorruptedStorage();
            return null;
        }
    }

    // ✅ VERIFICAR SE ESTÁ LOGADO
    static async isLoggedIn(): Promise<boolean> {
        try {
            const token = await this.getToken();
            if (!token) return false;

            // Verificar se o token não está expirado ou corrompido
            const isExpiredOrCorrupted = this.isTokenExpired(token);

            // ✅ Se token estiver corrompido, limpar storage automaticamente
            if (isExpiredOrCorrupted) {
                await this.clearCorruptedStorage();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao verificar login:', error);
            // ✅ Em caso de erro, limpar storage para evitar loops
            await this.clearCorruptedStorage();
            return false;
        }
    }

    // ✅ VERIFICAR SE TOKEN ESTÁ EXPIRADO
    private static isTokenExpired(token: string): boolean {
        try {
            // ✅ Verificar se token não está corrompido antes de processar
            if (!token || token.length < 10 || !token.includes('.')) {
                console.warn('Token inválido detectado na verificação de expiração');
                return true;
            }

            // Decode JWT payload (React Native compatible)
            const base64Url = token.split('.')[1];
            if (!base64Url) {
                console.warn('Token inválido: não possui payload');
                return true;
            }

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Simple base64 decode for React Native
            const decoded = this.base64Decode(base64);

            // ✅ Verificar se o decoded é um JSON válido
            if (!decoded || decoded.trim().length < 2 || !decoded.trim().startsWith('{')) {
                console.warn('Payload do token inválido após decode');
                return true;
            }

            // ✅ Validação adicional para caracteres especiais
            if (decoded.includes('ÿ') || decoded.includes('\u0000')) {
                console.warn('Token contém caracteres inválidos - será limpo na próxima verificação');
                // ✅ Retornar como expirado para forçar nova autenticação
                return true;
            }

            const payload = JSON.parse(decoded);

            const exp = payload.exp * 1000; // Converter para milliseconds
            return Date.now() > exp;
        } catch (error) {
            console.error('Erro ao verificar expiração do token:', error);
            // ✅ Limpar token corrompido automaticamente
            this.clearCorruptedStorage();
            return true; // Se não conseguir verificar, considerar expirado
        }
    }

    // ✅ HELPER PARA DECODE BASE64 (React Native compatible)
    private static base64Decode(str: string): string {
        try {
            // Add padding if needed
            while (str.length % 4) {
                str += '=';
            }

            // Simple base64 decode implementation for React Native
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let result = '';

            for (let i = 0; i < str.length; i += 4) {
                const a = chars.indexOf(str[i]);
                const b = chars.indexOf(str[i + 1]);
                const c = chars.indexOf(str[i + 2]);
                const d = chars.indexOf(str[i + 3]);

                const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

                result += String.fromCharCode((bitmap >> 16) & 255);
                if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
                if (d !== 64) result += String.fromCharCode(bitmap & 255);
            }

            return result;
        } catch (error) {
            throw new Error('Invalid base64 string');
        }
    }

    // ✅ CONFIGURAR INTERCEPTOR PARA ADICIONAR TOKEN AUTOMATICAMENTE
    static setupInterceptors() {
        // Request interceptor para adicionar token
        api.interceptors.request.use(
            async (config) => {
                const token = await this.getToken();
                if (token && !this.isTokenExpired(token)) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor para tratar erros de autenticação
        api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    // Token inválido ou expirado, fazer logout
                    await this.logout();
                }
                return Promise.reject(error);
            }
        );
    }
}

// Configurar interceptors na inicialização
AuthService.setupInterceptors();
