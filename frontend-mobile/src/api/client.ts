import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 🌐 Configuração da API Base
const isDevelopment = process.env.EXPO_PUBLIC_ENV === 'development';
const API_BASE_URL = isDevelopment
    ? 'http://localhost:3000/api' // Desenvolvimento local
    : 'https://automazo-production.up.railway.app/api'; // Produção

// 🔧 Criação da instância do Axios
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 segundos (aumentado para conexões móveis)
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // Configuração para lidar com certificados SSL em produção
    validateStatus: (status) => status < 500, // Aceita códigos de status < 500
});

// 📝 Tipos para tokens
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

// 🔑 Gerenciamento de tokens
class TokenManager {
    private static ACCESS_TOKEN_KEY = 'auth_token'; // ✅ Corrigido para coincidir com AuthService
    private static REFRESH_TOKEN_KEY = 'refresh_token';

    static async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('Erro ao obter access token:', error);
            return null;
        }
    }

    static async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Erro ao obter refresh token:', error);
            return null;
        }
    }

    static async setTokens(tokens: AuthTokens): Promise<void> {
        try {
            await Promise.all([
                AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken),
                AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken),
            ]);
        } catch (error) {
            console.error('Erro ao salvar tokens:', error);
        }
    }

    static async clearTokens(): Promise<void> {
        try {
            await Promise.all([
                AsyncStorage.removeItem(this.ACCESS_TOKEN_KEY),
                AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY),
            ]);
        } catch (error) {
            console.error('Erro ao limpar tokens:', error);
        }
    }
}

// 🔄 Estado para controlar refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });

    failedQueue = [];
};

// 📤 Interceptor de Request - Adicionar token
apiClient.interceptors.request.use(
    async (config): Promise<any> => {
        const token = await TokenManager.getAccessToken();

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log para debug (apenas em desenvolvimento)
        if (isDevelopment) {
            console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// 📥 Interceptor de Response - Refresh token automático
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log para debug (apenas em desenvolvimento)
        if (isDevelopment) {
            console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Se erro 401 (Unauthorized) e não é uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Se já está fazendo refresh, colocar na fila
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await TokenManager.getRefreshToken();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Tentar renovar o token
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                await TokenManager.setTokens({
                    accessToken,
                    refreshToken: newRefreshToken
                });

                processQueue(null, accessToken);

                // Repetir requisição original
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                return apiClient(originalRequest);

            } catch (refreshError) {
                console.error('❌ Erro ao renovar token:', refreshError);

                // Limpar tokens e redirecionar para login
                await TokenManager.clearTokens();
                processQueue(refreshError, null);

                // Emitir evento para logout global
                // TODO: Implementar EventEmitter ou Context para notificar logout

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Log para debug
        if (isDevelopment) {
            console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
        }

        return Promise.reject(error);
    }
);

// 📡 Funções utilitárias para requests
export const api = {
    // GET request
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return apiClient.get<T>(url, config);
    },

    // POST request
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return apiClient.post<T>(url, data, config);
    },

    // PUT request
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return apiClient.put<T>(url, data, config);
    },

    // DELETE request
    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return apiClient.delete<T>(url, config);
    },

    // PATCH request
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return apiClient.patch<T>(url, data, config);
    },

    // Upload de arquivos
    upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return apiClient.post<T>(url, formData, {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// 🔧 Utilitários expostos
export { TokenManager };
export default apiClient;
