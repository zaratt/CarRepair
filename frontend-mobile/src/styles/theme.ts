import { DefaultTheme } from 'react-native-paper';

export const customTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#6200EE',
        accent: '#03DAC6',
    },
    fonts: {
        ...DefaultTheme.fonts,
        regular: {
            fontFamily: 'Roboto',
            fontSize: 16,
        },
    },
    roundness: 4,
};