import { api } from './client';

// 📝 Tipos da API de Autenticação
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    cpfCnpj: string;
    type: 'individual' | 'company';
    profile: 'car_owner' | 'workshop';
    phone?: string;
    city?: string;
    state?: string;
}

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
        cpfCnpj: string;
        type: string;
        profile: string;
        phone?: string;
        city?: string;
        state?: string;
        isValidated?: boolean;
        createdAt: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// 🔐 API de Autenticação
export class AuthAPI {
    // 🚪 Login
    static async login(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await api.post<AuthResponse>('/auth/login', credentials);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro no login:', error);

            // Tratamento específico de erros
            if (error.response?.status === 401) {
                throw new Error('Email ou senha incorretos');
            } else if (error.response?.status === 404) {
                throw new Error('Usuário não encontrado');
            } else if (error.response?.status === 403) {
                throw new Error('Conta não verificada. Verifique seu email.');
            } else if (error.code === 'NETWORK_ERROR') {
                throw new Error('Erro de conexão. Verifique sua internet.');
            }

            throw new Error('Erro interno do servidor. Tente novamente.');
        }
    }

    // 📝 Registro
    static async register(userData: RegisterRequest): Promise<AuthResponse> {
        try {
            const response = await api.post<AuthResponse>('/auth/register', userData);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro no registro:', error);

            if (error.response?.status === 409) {
                throw new Error('Email já cadastrado');
            } else if (error.response?.status === 400) {
                const message = error.response.data?.message || 'Dados inválidos';
                throw new Error(message);
            }

            throw new Error('Erro interno do servidor. Tente novamente.');
        }
    }

    // 🔄 Renovar token
    static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
        try {
            const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
                refreshToken
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao renovar token:', error);
            throw new Error('Sessão expirada. Faça login novamente.');
        }
    }

    // 🚪 Logout
    static async logout(refreshToken?: string): Promise<void> {
        try {
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            // Logout sempre sucede, mesmo se a API falhar
            console.warn('⚠️ Erro no logout do servidor (ignorado):', error);
        }
    }

    // 👤 Obter dados do usuário atual
    static async getCurrentUser(): Promise<AuthResponse['user']> {
        try {
            const response = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
            return response.data.user;
        } catch (error: any) {
            console.error('❌ Erro ao obter usuário atual:', error);
            throw new Error('Erro ao carregar dados do usuário');
        }
    }

    // 🔑 Alterar senha
    static async changePassword(data: ChangePasswordRequest): Promise<void> {
        try {
            await api.put('/auth/change-password', data);
        } catch (error: any) {
            console.error('❌ Erro ao alterar senha:', error);

            if (error.response?.status === 400) {
                throw new Error('Senha atual incorreta');
            }

            throw new Error('Erro ao alterar senha. Tente novamente.');
        }
    }

    // 📧 Esqueceu a senha
    static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
        try {
            await api.post('/auth/forgot-password', data);
        } catch (error: any) {
            console.error('❌ Erro ao solicitar recuperação:', error);

            if (error.response?.status === 404) {
                throw new Error('Email não encontrado');
            }

            throw new Error('Erro ao enviar email de recuperação');
        }
    }

    // 🔄 Resetar senha
    static async resetPassword(data: ResetPasswordRequest): Promise<void> {
        try {
            await api.post('/auth/reset-password', data);
        } catch (error: any) {
            console.error('❌ Erro ao resetar senha:', error);

            if (error.response?.status === 400) {
                throw new Error('Token inválido ou expirado');
            }

            throw new Error('Erro ao resetar senha. Tente novamente.');
        }
    }

    // 📧 Reenviar email de verificação
    static async resendVerificationEmail(email: string): Promise<void> {
        try {
            await api.post('/auth/resend-verification', { email });
        } catch (error: any) {
            console.error('❌ Erro ao reenviar verificação:', error);
            throw new Error('Erro ao reenviar email de verificação');
        }
    }

    // ✅ Verificar email
    static async verifyEmail(token: string): Promise<void> {
        try {
            await api.post('/auth/verify-email', { token });
        } catch (error: any) {
            console.error('❌ Erro ao verificar email:', error);

            if (error.response?.status === 400) {
                throw new Error('Token de verificação inválido ou expirado');
            }

            throw new Error('Erro ao verificar email');
        }
    }
}

export default AuthAPI;
