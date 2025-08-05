import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AddInspectionScreen from '../screens/car-owner/AddInspectionScreen';
import InspectionDetailsScreen from '../screens/car-owner/InspectionDetailsScreen';
import InspectionScreen from '../screens/car-owner/InspectionScreen';
import { AppColors } from '../styles/colors';

export type InspectionStackParamList = {
    InspectionList: undefined;
    AddInspection: undefined;
    InspectionDetails: {
        inspectionId: string;
    };
};

const Stack = createStackNavigator<InspectionStackParamList>();

export default function InspectionStackNavigator() {
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
                name="InspectionList"
                component={InspectionScreen}
                options={{
                    title: 'Vistorias',
                    headerLeft: () => null, // Remove botão voltar
                }}
            />
            <Stack.Screen
                name="AddInspection"
                component={AddInspectionScreen}
                options={{
                    title: 'Nova Vistoria',
                    headerTitle: 'Nova Vistoria',
                }}
            />
            <Stack.Screen
                name="InspectionDetails"
                component={InspectionDetailsScreen}
                options={{
                    title: 'Detalhes da Vistoria',
                    headerTitle: 'Detalhes da Vistoria',
                }}
            />
        </Stack.Navigator>
    );
}
