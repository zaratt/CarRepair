import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { Icon } from 'react-native-paper';

interface ValidatedInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string | null;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    maxLength?: number;
    multiline?: boolean;
    style?: ViewStyle;
    inputStyle?: TextStyle;
    required?: boolean;
    disabled?: boolean;
    format?: 'currency' | 'number' | 'none';
    onBlur?: () => void;
    onFocus?: () => void;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
    label,
    value,
    onChangeText,
    error,
    placeholder,
    keyboardType = 'default',
    maxLength,
    multiline = false,
    style,
    inputStyle,
    required = false,
    disabled = false,
    format = 'none',
    onBlur,
    onFocus
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (): void => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = (): void => {
        setIsFocused(false);
        onBlur?.();
    };

    const formatCurrency = (text: string): string => {
        // Remove tudo que não é dígito
        const numbers = text.replace(/\D/g, '');
        if (!numbers) return '';

        // Converte para centavos
        const cents = parseInt(numbers, 10);
        const reais = cents / 100;

        // Formata como moeda brasileira
        return reais.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const formatNumber = (text: string): string => {
        // Remove tudo que não é dígito
        const numbers = text.replace(/\D/g, '');
        if (!numbers) return '';

        // Adiciona separadores de milhares
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatValue = (text: string): string => {
        switch (format) {
            case 'currency':
                return formatCurrency(text);
            case 'number':
                return formatNumber(text);
            default:
                return text;
        }
    };

    const handleChangeText = (text: string): void => {
        if (format !== 'none') {
            const formattedText = formatValue(text);
            onChangeText(formattedText);
        } else {
            onChangeText(text);
        }
    };

    const getContainerStyle = () => {
        return [
            styles.container,
            isFocused && styles.containerFocused,
            error && styles.containerError,
            disabled && styles.containerDisabled
        ].filter(Boolean);
    };

    return (
        <View style={[styles.wrapper, style]}>
            {/* Label externa igual ao FriendlyDatePicker */}
            <Text style={styles.label}>
                {label}{required && ' *'}
            </Text>

            <View style={getContainerStyle()}>
                <TextInput
                    style={[
                        styles.input,
                        inputStyle,
                        multiline && styles.multilineInput,
                        disabled && styles.inputDisabled
                    ]}
                    value={value}
                    onChangeText={handleChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    multiline={multiline}
                    editable={!disabled}
                    numberOfLines={multiline ? 4 : 1}
                />

                {/* Ícone de status */}
                <View style={styles.iconContainer}>
                    {error ? (
                        <Icon source="alert-circle" size={20} color="#FF3B30" />
                    ) : value && !error ? (
                        <Icon source="check-circle" size={20} color="#34C759" />
                    ) : null}
                </View>
            </View>

            {/* Mensagem de erro */}
            {error && (
                <View style={styles.errorContainer}>
                    <Icon source="alert-circle-outline" size={16} color="#FF3B30" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Contador de caracteres para campos multiline */}
            {multiline && maxLength && (
                <Text style={[
                    styles.charCounter,
                    value.length > maxLength * 0.9 && styles.charCounterWarning
                ]}>
                    {value.length}/{maxLength}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 0,
        flex: 1
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    container: {
        borderWidth: 1,
        borderColor: '#E1E1E6',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 12,
        paddingVertical: 16,
        position: 'relative',
        minHeight: 60,
        maxHeight: 60,
        justifyContent: 'center'
    },
    containerFocused: {
        borderColor: '#007AFF',
        backgroundColor: '#FFF',
        borderWidth: 2
    },
    containerError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
        borderWidth: 2
    },
    containerDisabled: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E1E1E6'
    },
    input: {
        fontSize: 16,
        color: '#333',
        paddingRight: 30,
        minHeight: 20
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    inputDisabled: {
        color: '#999'
    },
    iconContainer: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -10 }]
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginLeft: 6,
        flex: 1
    },
    charCounter: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 4
    },
    charCounterWarning: {
        color: '#FF8C00'
    }
});

export default ValidatedInput;
