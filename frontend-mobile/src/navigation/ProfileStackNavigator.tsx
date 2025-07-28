import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppColors } from '../styles/colors';

// Profile screens
import {
    ConfigurationsScreen,
    EditProfileScreen,
    HelpSupportScreen,
    NotificationsScreen,
    ProfileScreen
} from '../screens/car-owner';

export type ProfileStackParamList = {
    ProfileMain: undefined;
    EditProfile: undefined;
    Notifications: undefined;
    Configurations: undefined;
    HelpSupport: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: AppColors.primary,
                },
                headerTintColor: AppColors.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: AppColors.text,
                },
            }}
        >
            <ProfileStack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={{
                    headerShown: false, // ProfileScreen já tem seu próprio header
                }}
            />

            <ProfileStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{
                    title: 'Editar Perfil',
                    headerShown: true, // Mostrar header com botão voltar
                }}
            />

            <ProfileStack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    title: 'Notificações',
                    headerShown: true, // Mostrar header com botão voltar
                }}
            />

            <ProfileStack.Screen
                name="Configurations"
                component={ConfigurationsScreen}
                options={{
                    title: 'Configurações',
                    headerShown: true, // Mostrar header com botão voltar
                }}
            />

            <ProfileStack.Screen
                name="HelpSupport"
                component={HelpSupportScreen}
                options={{
                    title: 'Ajuda & Suporte',
                    headerShown: true, // Mostrar header com botão voltar
                }}
            />
        </ProfileStack.Navigator>
    );
}
