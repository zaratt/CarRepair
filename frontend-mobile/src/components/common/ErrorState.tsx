import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppColors } from '../../styles/colors';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryText?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function ErrorState({
    title = 'Ops! Algo deu errado',
    message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
    onRetry,
    retryText = 'Tentar novamente',
    icon = 'alert-circle-outline'
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons
                name={icon}
                size={80}
                color={AppColors.danger}
                style={styles.icon}
            />
            <Text variant="headlineSmall" style={styles.title}>
                {title}
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
                {message}
            </Text>
            {onRetry && (
                <Button
                    mode="contained"
                    onPress={onRetry}
                    style={styles.retryButton}
                    buttonColor={AppColors.primary}
                    textColor={AppColors.text}
                >
                    {retryText}
                </Button>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: AppColors.text,
    },
    message: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 30,
        lineHeight: 24,
    },
    retryButton: {
        marginTop: 10,
        paddingHorizontal: 30,
    },
});
