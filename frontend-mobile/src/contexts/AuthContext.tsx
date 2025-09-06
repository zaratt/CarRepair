import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
        initializeAuth();
    }, []);

    // Função para inicializar autenticação
    const initializeAuth = async () => {
        try {
            setIsLoading(true);
            console.log('🔄 Inicializando autenticação...');

            // ✅ LIMPEZA EMERGENCIAL PRIMEIRO
            const { emergencyStorageCleanup } = await import('../utils/emergencyCleanup');
            await emergencyStorageCleanup();

            const isLoggedIn = await AuthService.isLoggedIn();
            console.log('🔐 Status de login:', isLoggedIn);

            if (isLoggedIn) {
                // ✅ BUSCAR DADOS ATUALIZADOS DO BACKEND
                try {
                    console.log('📡 Buscando perfil atualizado do backend...');
                    const userData = await AuthService.getProfile();
                    setUser(userData);
                    console.log('✅ Perfil carregado:', userData?.name || 'Nome não disponível');
                } catch (profileError) {
                    console.warn('⚠️ Erro ao buscar perfil atualizado, usando dados locais:', profileError);
                    // Fallback para dados locais se o backend não responder
                    const localUserData = await AuthService.getUser();
                    setUser(localUserData);
                    console.log('📱 Usando dados locais:', localUserData?.name || 'Nome não disponível');
                }
            } else {
                console.log('🚫 Usuário não está logado');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar estado de autenticação:', error);
            // Se houver erro, limpar dados locais
            await AuthService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
            console.log('✅ Inicialização de autenticação concluída');
        }
    };

    // ✅ LOGIN
    const login = async (credentials: LoginCredentials): Promise<void> => {
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
    const register = async (data: RegisterData): Promise<void> => {
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
    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await AuthService.logout();
            setUser(null);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Mesmo com erro, limpar usuário local
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ MUDANÇA DE SENHA
    const changePassword = async (data: ChangePasswordData): Promise<void> => {
        try {
            await AuthService.changePassword(data);
            // Senha alterada com sucesso, não precisa alterar o usuário
        } catch (error) {
            throw error;
        }
    };

    // ✅ ATUALIZAR DADOS DO USUÁRIO
    const refreshUser = async (): Promise<void> => {
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
export function useAuthContext(): AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
    }

    return context;
}

export default AuthProvider;
