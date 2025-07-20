import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configurar calendário em português
LocaleConfig.locales['pt-br'] = {
    monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    monthNamesShort: [
        'Jan', 'Fev', 'Mar', 'Abr',
        'Mai', 'Jun', 'Jul', 'Ago',
        'Set', 'Out', 'Nov', 'Dez'
    ],
    dayNames: [
        'Domingo', 'Segunda', 'Terça', 'Quarta',
        'Quinta', 'Sexta', 'Sábado'
    ],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

interface FriendlyDatePickerProps {
    label: string;
    value: string | Date;
    onChangeDate: (date: string) => void;
    error?: string | null;
    required?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

/**
 * Componente de seleção de data com calendário visual amigável
 * Substitui o DateTimePicker padrão por uma interface mais intuitiva
 */
const FriendlyDatePicker: React.FC<FriendlyDatePickerProps> = ({
    label,
    value,
    onChangeDate,
    error,
    required = false,
    disabled = false,
    style
}) => {
    const [showCalendar, setShowCalendar] = useState(false);

    const handleDateSelect = (day: any): void => {
        const selectedDate = new Date(day.dateString);
        const isoString = selectedDate.toISOString();
        onChangeDate(isoString);
        setShowCalendar(false); // Auto-fechar
    };

    const getDisplayDate = (): string => {
        if (!value) return '';

        try {
            const date = value instanceof Date ? value : new Date(value);
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch {
            return '';
        }
    };

    const getSelectedDate = (): string => {
        if (!value) return '';

        try {
            const date = value instanceof Date ? value : new Date(value);
            return format(date, 'dd/MM/yyyy');
        } catch {
            return '';
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <View style={[styles.wrapper, style]}>
            <Text style={styles.label}>
                {label}{required && ' *'}
            </Text>

            <TouchableOpacity
                style={[
                    styles.container,
                    error && styles.containerError,
                    disabled && styles.containerDisabled
                ]}
                onPress={() => !disabled && setShowCalendar(true)}
                disabled={disabled}
                activeOpacity={0.7}
            >
                <View style={styles.inputContent}>
                    <Text style={[
                        styles.dateText,
                        !value && styles.placeholderText,
                        disabled && styles.disabledText
                    ]}>
                        {getDisplayDate() || 'Selecione uma data'}
                    </Text>

                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={error ? '#FF3B30' : disabled ? '#999' : '#007AFF'}
                    />
                </View>
            </TouchableOpacity>

            {/* Mensagem de erro */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Modal do Calendário */}
            <Modal
                visible={showCalendar}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        {/* Header do Modal */}
                        <View style={styles.calendarHeader}>
                            <Text style={styles.calendarTitle}>Selecionar Data</Text>
                            <TouchableOpacity
                                onPress={() => setShowCalendar(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendário */}
                        <Calendar
                            onDayPress={handleDateSelect}
                            maxDate={today}
                            markedDates={{
                                [getSelectedDate()]: {
                                    selected: true,
                                    selectedColor: '#007AFF'
                                },
                                [today]: {
                                    marked: true,
                                    dotColor: '#FF9500'
                                }
                            }}
                            theme={{
                                backgroundColor: '#ffffff',
                                calendarBackground: '#ffffff',
                                textSectionTitleColor: '#666',
                                selectedDayBackgroundColor: '#007AFF',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#007AFF',
                                dayTextColor: '#333',
                                textDisabledColor: '#ccc',
                                arrowColor: '#007AFF',
                                monthTextColor: '#333',
                                indicatorColor: '#007AFF',
                                textDayFontWeight: '400',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14
                            }}
                            firstDay={0} // Domingo primeiro
                            hideExtraDays={true}
                            disableMonthChange={false}
                            hideDayNames={false}
                            showWeekNumbers={false}
                        />

                        {/* Botões de Ação */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCalendar(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.todayButton}
                                onPress={() => handleDateSelect({ dateString: today })}
                            >
                                <Text style={styles.todayButtonText}>Hoje</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        marginBottom: 0
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
        minHeight: 60,
        maxHeight: 60,
        justifyContent: 'center'
    },
    containerError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5'
    },
    containerDisabled: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E1E1E6'
    },
    inputContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        flex: 1
    },
    placeholderText: {
        color: '#999'
    },
    disabledText: {
        color: '#999'
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    calendarContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        margin: 20,
        maxWidth: width - 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    calendarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    closeButton: {
        padding: 4
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 16
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16
    },
    todayButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6
    },
    todayButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    }
});

export default FriendlyDatePicker;
