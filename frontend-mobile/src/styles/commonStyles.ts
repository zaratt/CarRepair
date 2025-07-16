import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 16,
        marginTop: 10,
    },
    inputSmall: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 4, // Ajustado para caber na altura de 30px
        marginVertical: 5,
        fontSize: 16,
        maxWidth: 150,
        height: 30, // Altura fixa de 100px
        flex: 1,
    },
    inputLarge: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 4, // Ajustado para caber na altura de 30px
        marginVertical: 5,
        fontSize: 16,
        maxWidth: 300,
        height: 30, // Altura fixa de 30px
        flex: 1,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 4, // Ajustado para caber na altura de 30px
        marginVertical: 5,
        fontSize: 16,
        maxWidth: 300,
        height: 30, // Altura fixa de 30px
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        flexWrap: 'nowrap',
    },
    error: {
        color: 'red',
        fontSize: 12,
    },
});