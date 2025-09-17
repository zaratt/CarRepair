export interface TokenPayload {
    userId: string;
    email: string;
    type: string;
    profile: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone?: string;
    document: string;
    city?: string;
    state?: string;
}
/**
 * Hash da senha usando bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verificar senha contra hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Gerar JWT token
 */
export declare function generateToken(payload: TokenPayload): string;
/**
 * Gerar refresh token (maior duração)
 */
export declare function generateRefreshToken(payload: TokenPayload): string;
/**
 * Verificar e decodificar JWT token
 */
export declare function verifyToken(token: string): TokenPayload;
/**
 * Extrair token do header Authorization
 */
export declare function extractTokenFromHeader(authHeader: string | undefined): string;
/**
 * Validar força da senha
 */
export declare function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
};
/**
 * Gerar código de verificação aleatório
 */
export declare function generateVerificationCode(): string;
/**
 * Verificar se email é válido
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Sanitizar dados de usuário para resposta (remover senha)
 */
export declare function sanitizeUserData(user: any): any;
/**
 * ✅ SEGURANÇA: Sanitizar strings para logs seguros (CWE-134 Prevention)
 * Remove/escapa caracteres que podem ser usados em ataques de format string
 */
export declare function sanitizeForLog(input: string): string;
//# sourceMappingURL=auth.d.ts.map