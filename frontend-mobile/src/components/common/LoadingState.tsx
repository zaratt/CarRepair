import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { AppColors } from '../../styles/colors';

interface LoadingStateProps {
    message?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    showIcon?: boolean;
    size?: 'small' | 'large';
}

export default function LoadingState({
    message = 'Carregando...',
    icon = 'loading',
    showIcon = false,
    size = 'large'
}: LoadingStateProps) {
    return (
        <View style={styles.container}>
            {showIcon ? (
                <MaterialCommunityIcons
                    name={icon}
                    size={60}
                    color={AppColors.primary}
                    style={styles.icon}
                />
            ) : (
                <ActivityIndicator
                    size={size}
                    color={AppColors.primary}
                    style={styles.spinner}
                />
            )}
            <Text variant="bodyLarge" style={styles.message}>
                {message}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    icon: {
        marginBottom: 20,
    },
    spinner: {
        marginBottom: 20,
    },
    message: {
        textAlign: 'center',
        color: AppColors.text,
        marginTop: 8,
    },
});
