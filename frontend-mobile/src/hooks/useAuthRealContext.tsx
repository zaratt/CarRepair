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
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Verificar autenticação na inicialização
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setIsLoading(true);

            // Verificar se existe token válido
            const isLoggedIn = await AuthService.isLoggedIn();
            if (isLoggedIn) {
                const userData = await AuthService.getUser();
                setUser(userData);
            }
        } catch (error) {
            console.log('No valid session found');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

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

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            console.log('Logout executado');
            await AuthService.logout();
            setUser(null);
        } catch (error) {
            console.error('Erro no logout:', error);
            // Mesmo com erro, limpar usuário local
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const changePassword = async (data: ChangePasswordData): Promise<void> => {
        try {
            setIsLoading(true);
            await AuthService.changePassword(data);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                login,
                register,
                logout,
                changePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
