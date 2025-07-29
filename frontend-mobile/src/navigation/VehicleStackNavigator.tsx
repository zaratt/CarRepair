import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppColors } from '../styles/colors';

// Vehicle screens
import VehicleDetailsScreen from '../screens/car-owner/VehicleDetailsScreen';
import VehiclesScreen from '../screens/car-owner/VehiclesScreen';

export type VehicleStackParamList = {
    VehicleList: undefined;
    VehicleDetails: { vehicleId: string };
    AddVehicle: undefined;
};

const VehicleStack = createNativeStackNavigator<VehicleStackParamList>();

export default function VehicleStackNavigator() {
    return (
        <VehicleStack.Navigator
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
            <VehicleStack.Screen
                name="VehicleList"
                component={VehiclesScreen}
                options={{
                    title: 'Meus Veículos',
                    headerLeft: () => null, // Remove botão voltar
                    headerBackVisible: false, // Garante que não há botão voltar
                }}
            />

            <VehicleStack.Screen
                name="VehicleDetails"
                component={VehicleDetailsScreen}
                options={({ route }) => {
                    // TODO: Pegar nome do veículo baseado no ID
                    // const vehicleId = route.params.vehicleId;
                    return {
                        title: 'Detalhes do Veículo',
                        headerBackTitle: 'Voltar',
                    };
                }}
            />

            {/* Futura tela de adicionar veículo */}
            {/* 
            <VehicleStack.Screen
                name="AddVehicle"
                component={AddVehicleScreen}
                options={{
                    title: 'Adicionar Veículo',
                    headerBackTitle: 'Voltar',
                }}
            />
            */}
        </VehicleStack.Navigator>
    );
}
