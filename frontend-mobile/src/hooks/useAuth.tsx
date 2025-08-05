import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { AuthUser, ChangePasswordData, LoginCredentials, RegisterData } from '../types/auth';
import { useAuth as useAuthAPI } from './useAuth';

// 🔄 Flag para alternar entre Mock e API Real
const USE_REAL_API = false; // Alterar para true quando backend estiver pronto

interface AuthContextData {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    changePassword: (data: ChangePasswordData) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 🔄 Hook da API real (para quando estiver pronto)
    const realAPI = useAuthAPI();

    const isAuthenticated = !!user;

    // ✅ VERIFICAR AUTENTICAÇÃO NA INICIALIZAÇÃO
    useEffect(() => {
        if (USE_REAL_API) {
            // Usar API real
            realAPI.initializeAuth();
            setIsLoading(false);
        } else {
            // Usar mock atual
            checkAuthState();
        }
    }, []);

    // 📊 Sincronizar estados quando usar API real
    useEffect(() => {
        if (USE_REAL_API) {
            setUser(realAPI.user as AuthUser | null);
            setIsLoading(realAPI.isLoading);
        }
    }, [realAPI.user, realAPI.isLoading]);

    const checkAuthState = async () => {
        try {
            setIsLoading(true);

            // ✅ LIMPEZA EMERGENCIAL PRIMEIRO
            const { emergencyStorageCleanup } = await import('../utils/emergencyCleanup');
            await emergencyStorageCleanup();

            const isLoggedIn = await AuthService.isLoggedIn();
            if (isLoggedIn) {
                const userData = await AuthService.getUser();
                setUser(userData);
            }
        } catch (error) {
            console.error('Erro ao verificar estado de autenticação:', error);
            // Se houver erro, limpar dados locais
            await AuthService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ LOGIN
    const login = async (credentials: LoginCredentials) => {
        if (USE_REAL_API) {
            // Usar API real
            return new Promise<void>((resolve, reject) => {
                realAPI.login({
                    email: credentials.email,
                    password: credentials.password
                });

                // Monitorar resultado
                const checkResult = () => {
                    if (realAPI.loginError) {
                        reject(new Error(realAPI.loginError));
                    } else if (realAPI.user) {
                        resolve();
                    } else {
                        setTimeout(checkResult, 100);
                    }
                };
                checkResult();
            });
        } else {
            // Usar mock atual
            try {
                setIsLoading(true);
                const response = await AuthService.login(credentials);
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
                throw error;
            } finally {
                setIsLoading(false);
            }
        }
    };

    // ✅ REGISTRO
    const register = async (data: RegisterData) => {
        try {
            setIsLoading(true);
            const response = await AuthService.register(data);
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ LOGOUT
    const logout = async () => {
        if (USE_REAL_API) {
            realAPI.logout();
            setUser(null);
        } else {
            try {
                setIsLoading(true);
                await AuthService.logout();
                setUser(null);
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // ✅ MUDANÇA DE SENHA
    const changePassword = async (data: ChangePasswordData) => {
        try {
            await AuthService.changePassword(data);
            // Senha alterada com sucesso, não precisa alterar o usuário
        } catch (error) {
            throw error;
        }
    };

    // ✅ ATUALIZAR DADOS DO USUÁRIO
    const refreshUser = async () => {
        try {
            if (isAuthenticated) {
                const userData = await AuthService.getProfile();
                setUser(userData);
            }
        } catch (error) {
            console.error('Erro ao atualizar dados do usuário:', error);
            // Se houver erro, fazer logout
            await logout();
            throw error;
        }
    };

    const contextValue: AuthContextData = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        changePassword,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ HOOK PARA USAR O CONTEXTO DE AUTENTICAÇÃO
export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }

    return context;
}
