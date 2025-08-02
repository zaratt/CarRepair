import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppColors } from '../styles/colors';

// Maintenance screens
import AddMaintenanceScreen from '../screens/car-owner/AddMaintenanceScreen';
import MaintenanceScreen from '../screens/car-owner/MaintenanceScreen';

export type MaintenanceStackParamList = {
    MaintenanceList: undefined;
    AddMaintenance: undefined;
    // TODO: Adicionar outras telas da stack quando implementadas
    // MaintenanceDetails: { maintenanceId: string };
};

const MaintenanceStack = createNativeStackNavigator<MaintenanceStackParamList>();

export default function MaintenanceStackNavigator() {
    return (
        <MaintenanceStack.Navigator
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
            <MaintenanceStack.Screen
                name="MaintenanceList"
                component={MaintenanceScreen}
                options={{
                    title: 'Minhas Manutenções',
                    headerLeft: () => null, // Remove botão voltar
                    headerBackVisible: false, // Garante que não há botão voltar
                }}
            />

            <MaintenanceStack.Screen
                name="AddMaintenance"
                component={AddMaintenanceScreen}
                options={{
                    title: 'Registrar Manutenção',
                    headerBackTitle: 'Voltar',
                }}
            />

            {/* TODO: Adicionar outras telas quando implementadas
            <MaintenanceStack.Screen
                name="MaintenanceDetails"
                component={MaintenanceDetailsScreen}
                options={{
                    title: 'Detalhes da Manutenção',
                    headerBackTitle: 'Voltar',
                }}
            />
            */}
        </MaintenanceStack.Navigator>
    );
}
