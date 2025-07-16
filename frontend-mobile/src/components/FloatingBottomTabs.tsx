import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    profile: string;
}

const FloatingBottomTabs: React.FC<Props> = ({ profile }) => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const current = route.name;

    // Define menu options by profile
    const options = [] as Array<{ key: string; icon: React.ReactNode; label: string; screen?: string; onPress?: () => void }>;
    const iconSize = 22;
    if (profile === 'car_owner') {
        options.push(
            { key: 'home', icon: <MaterialIcons name="home" size={iconSize} color={current === 'Home' ? '#1976d2' : '#888'} />, label: 'Início', screen: 'Home' },
            { key: 'vehicles', icon: <MaterialIcons name="directions-car" size={iconSize} color={current === 'VehicleList' ? '#1976d2' : '#888'} />, label: 'Veículos', screen: 'VehicleList' },
            { key: 'maint', icon: <MaterialIcons name="build" size={iconSize} color={current === 'MaintenanceList' ? '#1976d2' : '#888'} />, label: 'Manut.', screen: 'MaintenanceList' },
            { key: 'insp', icon: <MaterialCommunityIcons name="clipboard-list-outline" size={iconSize} color={current === 'InspectionList' ? '#1976d2' : '#888'} />, label: 'Inspeções', screen: 'InspectionList' },
            { key: 'workshops', icon: <MaterialIcons name="store" size={iconSize} color={current === 'WorkshopList' ? '#1976d2' : '#888'} />, label: 'Oficinas', screen: 'WorkshopList' },
            { key: 'help', icon: <MaterialIcons name="help-outline" size={iconSize} color={current === 'Help' ? '#1976d2' : '#888'} />, label: 'Ajuda', screen: 'Help' },
            { key: 'profile', icon: <MaterialIcons name="person" size={iconSize} color={current === 'Profile' ? '#1976d2' : '#888'} />, label: 'Perfil', screen: 'Profile' },
        );
    } else if (profile === 'wshop_owner') {
        options.push(
            { key: 'home', icon: <MaterialIcons name="home" size={iconSize} color={current === 'Home' ? '#1976d2' : '#888'} />, label: 'Início', screen: 'Home' },
            { key: 'drivers', icon: <MaterialIcons name="people" size={iconSize} color={current === 'UserList' ? '#1976d2' : '#888'} />, label: 'Motoristas', screen: 'UserList' },
            { key: 'maint', icon: <MaterialIcons name="build" size={iconSize} color={current === 'MaintenanceList' ? '#1976d2' : '#888'} />, label: 'Manut.', screen: 'MaintenanceList' },
            { key: 'insp', icon: <MaterialCommunityIcons name="clipboard-list-outline" size={iconSize} color={current === 'InspectionList' ? '#1976d2' : '#888'} />, label: 'Inspeções', screen: 'InspectionList' },
            { key: 'workshop', icon: <MaterialIcons name="store" size={iconSize} color={current === 'WorkshopList' ? '#1976d2' : '#888'} />, label: 'Oficina', screen: 'WorkshopList' },
            { key: 'help', icon: <MaterialIcons name="help-outline" size={iconSize} color={current === 'Help' ? '#1976d2' : '#888'} />, label: 'Ajuda', screen: 'Help' },
            { key: 'profile', icon: <MaterialIcons name="person" size={iconSize} color={current === 'Profile' ? '#1976d2' : '#888'} />, label: 'Perfil', screen: 'Profile' },
        );
    } else if (profile === 'admin') {
        options.push(
            { key: 'home', icon: <MaterialIcons name="home" size={iconSize} color={current === 'Home' ? '#1976d2' : '#888'} />, label: 'Início', screen: 'Home' },
            { key: 'users', icon: <MaterialIcons name="people" size={iconSize} color={current === 'UserList' ? '#1976d2' : '#888'} />, label: 'Usuários', screen: 'UserList' },
            { key: 'vehicles', icon: <MaterialIcons name="directions-car" size={iconSize} color={current === 'VehicleList' ? '#1976d2' : '#888'} />, label: 'Veículos', screen: 'VehicleList' },
            { key: 'maint', icon: <MaterialIcons name="build" size={iconSize} color={current === 'MaintenanceList' ? '#1976d2' : '#888'} />, label: 'Manut.', screen: 'MaintenanceList' },
            { key: 'workshops', icon: <MaterialIcons name="store" size={iconSize} color={current === 'WorkshopList' ? '#1976d2' : '#888'} />, label: 'Oficinas', screen: 'WorkshopList' },
            { key: 'help', icon: <MaterialIcons name="help-outline" size={iconSize} color={current === 'Help' ? '#1976d2' : '#888'} />, label: 'Ajuda', screen: 'Help' },
            { key: 'profile', icon: <MaterialIcons name="person" size={iconSize} color={current === 'Profile' ? '#1976d2' : '#888'} />, label: 'Perfil', screen: 'Profile' },
        );
    }

    return (
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <View style={styles.fabContainer}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.key}
                        style={styles.tabButton}
                        onPress={opt.onPress ? opt.onPress : () => opt.screen && navigation.navigate(opt.screen)}
                        accessibilityLabel={opt.label}
                    >
                        {opt.icon}
                        <Text style={{ fontSize: 11, color: (current === opt.screen && opt.screen) ? '#1976d2' : '#888' }}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        backgroundColor: 'transparent',
        zIndex: 100,
    },
    fabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingVertical: 8,
        paddingBottom: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 2,
    },
});

export default FloatingBottomTabs;
