import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge } from 'react-native-paper';

// Screens
import {
    HomeScreen,
    InspectionScreen,
    MaintenanceScreen,
    VehiclesScreen
} from '../screens/car-owner';

// Profile Stack Navigator
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

type TabIconProps = {
    name: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    size: number;
    badge?: number;
};

const TabIcon: React.FC<TabIconProps> = ({ name, color, size, badge }) => (
    <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={name} size={size} color={color} />
        {badge && badge > 0 && (
            <Badge style={styles.badge} size={16}>
                {badge > 99 ? '99+' : badge.toString()}
            </Badge>
        )}
    </View>
);

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#1976d2',
                tabBarInactiveTintColor: '#666',
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarShowLabel: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="home" color={color} size={size} />
                    ),
                }}
            />

            <Tab.Screen
                name="Vehicles"
                component={VehiclesScreen}
                options={{
                    tabBarLabel: 'Veículos',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="car" color={color} size={size} badge={3} />
                    ),
                }}
            />

            <Tab.Screen
                name="Maintenance"
                component={MaintenanceScreen}
                options={{
                    tabBarLabel: 'Manutenções',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="wrench" color={color} size={size} badge={2} />
                    ),
                }}
            />

            <Tab.Screen
                name="Inspection"
                component={InspectionScreen}
                options={{
                    tabBarLabel: 'Vistorias',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="clipboard-check" color={color} size={size} badge={1} />
                    ),
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileStackNavigator}
                options={{
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="account" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 40, // ✅ Mudança: 25px → 33px (subiu 8px como solicitado)
        left: 20,
        right: 20,
        elevation: 8,
        backgroundColor: '#ffffff',
        borderRadius: 25,
        height: 70,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        paddingHorizontal: 10,
        paddingBottom: 5,
        borderTopWidth: 0,
    },
    tabItem: {
        paddingVertical: 10,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    iconContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ff4444',
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
