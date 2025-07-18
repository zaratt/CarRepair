import React, { useCallback, useRef, useState } from 'react';
import {
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Icon } from 'react-native-paper';
import { useAutoComplete } from '../hooks/useAutoComplete';

// Tipos
interface AutoCompleteInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    workshopId?: string;
    style?: any;
    maxSuggestions?: number;
    disabled?: boolean;
    onSuggestionSelect?: (suggestion: string, type: 'history' | 'workshop') => void;
}

interface SuggestionItemProps {
    text: string;
    type: 'history' | 'workshop';
    onPress: () => void;
}

// Componente para item individual de sugestão
const SuggestionItem: React.FC<SuggestionItemProps> = ({ text, type, onPress }) => {
    const getIconName = () => {
        return type === 'history' ? 'history' : 'wrench';
    };

    const getIconColor = () => {
        return type === 'history' ? '#4CAF50' : '#2196F3';
    };

    return (
        <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
            <Icon
                source={getIconName()}
                size={16}
                color={getIconColor()}
            />
            <Text style={styles.suggestionText} numberOfLines={1}>
                {text}
            </Text>
            <Text style={styles.suggestionType}>
                {type === 'history' ? 'Histórico' : 'Oficina'}
            </Text>
        </TouchableOpacity>
    );
};

/**
 * Componente de input com auto-complete inteligente
 * Combina histórico do usuário com serviços da oficina
 */
export const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
    value,
    onChangeText,
    placeholder = 'Digite o tipo de serviço...',
    workshopId,
    style,
    maxSuggestions = 5,
    disabled = false,
    onSuggestionSelect
}) => {
    // Estados
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Ref para o input
    const inputRef = useRef<TextInput>(null);

    // Hook de auto-complete
    const { suggestions, isLoading, getSuggestions, clearSuggestions } = useAutoComplete({
        workshopId,
        maxSuggestions
    });

    // Manipular mudança de texto
    const handleTextChange = useCallback((text: string) => {
        onChangeText(text);

        if (text.trim().length >= 2) {
            getSuggestions(text);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            clearSuggestions();
        }
    }, [onChangeText, getSuggestions, clearSuggestions]);

    // Manipular seleção de sugestão
    const handleSuggestionPress = useCallback((suggestionText: string, type: 'history' | 'workshop') => {
        onChangeText(suggestionText);
        setShowSuggestions(false);
        clearSuggestions();
        inputRef.current?.blur();

        // Callback opcional para quando uma sugestão é selecionada
        if (onSuggestionSelect) {
            onSuggestionSelect(suggestionText, type);
        }
    }, [onChangeText, clearSuggestions, onSuggestionSelect]);

    // Manipular foco do input
    const handleFocus = useCallback(() => {
        setIsFocused(true);
        if (value.trim().length >= 2) {
            getSuggestions(value);
            setShowSuggestions(true);
        }
    }, [value, getSuggestions]);

    // Manipular perda de foco
    const handleBlur = useCallback(() => {
        setIsFocused(false);
        // Delay para permitir que o toque na sugestão seja registrado
        setTimeout(() => {
            setShowSuggestions(false);
        }, 150);
    }, []);

    // Fechar sugestões ao tocar fora
    const handleOutsidePress = useCallback(() => {
        setShowSuggestions(false);
        clearSuggestions();
        Keyboard.dismiss();
    }, [clearSuggestions]);

    // Renderizar item de sugestão
    const renderSuggestionItem = useCallback(({ item }: { item: any }) => (
        <SuggestionItem
            text={item.text}
            type={item.type}
            onPress={() => handleSuggestionPress(item.text, item.type)}
        />
    ), [handleSuggestionPress]);

    return (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
            <View style={[styles.container, style]}>
                {/* Input principal */}
                <View style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    disabled && styles.inputContainerDisabled
                ]}>
                    <TextInput
                        ref={inputRef}
                        style={[
                            styles.textInput,
                            disabled && styles.textInputDisabled
                        ]}
                        value={value}
                        onChangeText={handleTextChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        placeholderTextColor="#999"
                        editable={!disabled}
                        autoCorrect={false}
                        autoCapitalize="sentences"
                    />

                    {/* Indicador de carregamento */}
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <Icon source="loading" size={16} color="#666" />
                        </View>
                    )}
                </View>

                {/* Lista de sugestões */}
                {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <FlatList
                            data={suggestions}
                            renderItem={renderSuggestionItem}
                            keyExtractor={(item, index) => `${item.type}-${item.text}-${index}`}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            style={{ maxHeight: 200 }}
                        />
                    </View>
                )}

                {/* Mensagem quando não há sugestões */}
                {showSuggestions && suggestions.length === 0 && value.trim().length >= 2 && !isLoading && (
                    <View style={styles.noSuggestionsContainer}>
                        <Text style={styles.noSuggestionsText}>
                            Nenhuma sugestão encontrada
                        </Text>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFF',
        minHeight: 48,
    },
    inputContainerFocused: {
        borderColor: '#2196F3',
        borderWidth: 2,
    },
    inputContainerDisabled: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    textInputDisabled: {
        color: '#999',
    },
    loadingContainer: {
        marginLeft: 8,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1001,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    suggestionType: {
        fontSize: 10,
        color: '#666',
        textTransform: 'uppercase',
        fontWeight: '500',
        marginLeft: 8,
    },
    noSuggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1001,
    },
    noSuggestionsText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default AutoCompleteInput;
