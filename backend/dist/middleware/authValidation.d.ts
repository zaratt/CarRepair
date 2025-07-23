import { NextFunction, Request, Response } from 'express';
/**
 * Validação avançada para registro de usuário (com senha)
 */
export declare const register: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validação para login com senha
 */
export declare const login: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validação para alterar senha
 */
export declare const changePassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validação para refresh token
 */
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validação para atualização de perfil
 */
export declare const updateProfile: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Exportação do objeto de validações
 */
export declare const authValidation: {
    register: (req: Request, res: Response, next: NextFunction) => void;
    login: (req: Request, res: Response, next: NextFunction) => void;
    changePassword: (req: Request, res: Response, next: NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=authValidation.d.ts.map