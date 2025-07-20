import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface FormRowProps {
    children: React.ReactNode;
    spacing?: number;
    style?: ViewStyle;
    distribution?: 'equal' | 'auto' | number[];
}

/**
 * Componente para agrupar campos de formulário em uma linha
 * Útil para layouts responsivos com campos relacionados
 * Suporta distribuição equilibrada e controle de espaçamento
 */
const FormRow: React.FC<FormRowProps> = ({
    children,
    spacing = 12,
    style,
    distribution = 'equal'
}) => {
    const childrenArray = React.Children.toArray(children);

    return (
        <View style={[styles.container, { gap: spacing }, style]}>
            {childrenArray.map((child, index) => {
                let flexStyle = {};

                if (distribution === 'equal') {
                    flexStyle = { flex: 1 };
                } else if (Array.isArray(distribution) && distribution[index]) {
                    flexStyle = { flex: distribution[index] };
                }

                return (
                    <View key={index} style={[styles.fieldWrapper, flexStyle]}>
                        {child}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 20
    },
    fieldWrapper: {
        minHeight: 60,
        justifyContent: 'flex-start'
    }
});

export default FormRow;
