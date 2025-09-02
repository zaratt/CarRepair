import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import NotificationScreen from '../screens/car-owner/NotificationScreen';
import { AppColors } from '../styles/colors';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
    Home: undefined;
    NotificationList: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen
                name="Home"
                component={TabNavigator}
            />
            <RootStack.Screen
                name="NotificationList"
                component={NotificationScreen}
                options={{
                    headerShown: true,
                    title: 'Notificações',
                    headerStyle: {
                        backgroundColor: AppColors.primary, // Amarelo #F7C910
                    },
                    headerTitleStyle: {
                        color: AppColors.text, // Preto #000000
                        fontWeight: 'bold',
                    },
                    headerTintColor: AppColors.text, // Preto #000000
                }}
            />
        </RootStack.Navigator>
    );
}
