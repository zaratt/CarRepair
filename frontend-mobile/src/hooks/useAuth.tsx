import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { AuthUser, ChangePasswordData, LoginCredentials, RegisterData } from '../types/auth';

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

    const isAuthenticated = !!user;

    // ✅ VERIFICAR AUTENTICAÇÃO NA INICIALIZAÇÃO
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            setIsLoading(true);

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
        try {
            setIsLoading(true);
            await AuthService.logout();
            setUser(null);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            setIsLoading(false);
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
