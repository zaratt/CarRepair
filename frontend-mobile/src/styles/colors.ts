// 🎨 Paleta de Cores Oficial do CarRepair App
export const AppColors = {
    primary: '#F7C910',      // Amarelo - Backgrounds principais (login, header)
    text: '#000000',         // Preto - Textos e ícones
    white: '#FFFFFF',        // Branco - Backgrounds contraste, botões
    secondary: '#E3BA12',    // Amarelo escuro - Campos especiais (login, password)
    danger: '#DC3545',       // Vermelho - Ações destrutivas
    gray: '#E0E0E0',        // Cinza - Divisores e bordas
};

// 🎯 Tema para React Native Paper (opcional)
export const AppTheme = {
    colors: {
        primary: AppColors.primary,
        onPrimary: AppColors.text,
        secondary: AppColors.secondary,
        onSecondary: AppColors.text,
        background: AppColors.white,
        onBackground: AppColors.text,
        surface: AppColors.white,
        onSurface: AppColors.text,
        error: AppColors.danger,
    },
};
