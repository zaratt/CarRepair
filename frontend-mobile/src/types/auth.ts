export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    document: string; // CPF ou CNPJ
    phone?: string;
    city?: string;
    state?: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    type: 'car_owner' | 'wshop_owner';
    profile: 'customer' | 'workshop';
    phone?: string;
    city?: string;
    state?: string;
    isValidated: boolean;
    createdAt: string;
}

export interface AuthData {
    token: string;
    refreshToken: string;
    user: AuthUser;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: AuthData;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export class AuthException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthException';
    }
}

export interface ValidationErrors {
    field: string;
    message: string;
}

export interface ErrorResponse {
    success: false;
    message: string;
    errors?: ValidationErrors[];
}
