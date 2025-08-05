import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import NotificationScreen from '../screens/car-owner/NotificationScreen';
import { AppColors } from '../styles/colors';

export type NotificationStackParamList = {
    NotificationList: undefined;
    NotificationSettings: undefined;
    NotificationHistory: undefined;
};

const Stack = createStackNavigator<NotificationStackParamList>();

export default function NotificationStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: AppColors.primary,
                    elevation: 2,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: AppColors.text,
                },
                headerTintColor: AppColors.text,
            }}
        >
            <Stack.Screen
                name="NotificationList"
                component={NotificationScreen}
                options={{
                    title: 'Notificações',
                    headerLeft: () => null, // Remove botão voltar
                }}
            />
            {/* Futuras telas de configurações avançadas podem ser adicionadas aqui */}
        </Stack.Navigator>
    );
}
