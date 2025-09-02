import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuthContext as useAuth } from '../contexts/AuthContext';
import AvailableWorkshopsScreen from '../screens/AvailableWorkshopsScreen';
import HelpScreen from '../screens/HelpScreen';
import HomeScreen from '../screens/HomeScreen';
import InspectionDetailScreen from '../screens/InspectionDetailScreen';
import InspectionFormScreen from '../screens/InspectionFormScreen';
import InspectionListScreen from '../screens/InspectionListScreen';
import LoginScreen from '../screens/LoginScreen';
import MaintenanceDetailScreen from '../screens/MaintenanceDetailScreen';
import MaintenanceFormScreen from '../screens/MaintenanceFormScreen';
import MaintenanceListScreen from '../screens/MaintenanceListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserFormScreen from '../screens/UserFormScreen';
import UserListScreen from '../screens/UserListScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import WorkshopDetailScreen from '../screens/WorkshopDetailScreen';
import WorkshopFormScreen from '../screens/WorkshopFormScreen';
import WorkshopListScreen from '../screens/WorkshopListScreen';
import WorkshopPendingMaintenancesScreen from '../screens/WorkshopPendingMaintenancesScreen';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
    VehicleForm: { vehicle?: any } | undefined;
    VehicleDetail: { vehicleId: string };
    UserForm: { user?: any } | undefined;
    WorkshopForm: { workshop?: any } | undefined;
    MaintenanceForm: { maintenance?: any } | undefined;
    InspectionForm: { inspection?: any } | undefined;
    UserList: undefined;
    VehicleList: undefined;
    WorkshopList: undefined;
    MaintenanceList: undefined;
    InspectionList: undefined;
    MaintenanceDetail: { maintenanceId: string };
    WorkshopDetail: { workshopId: string };
    InspectionDetail: { inspectionId: string };
    Profile: undefined;
    Help: undefined;
    AvailableWorkshopsScreen: undefined;
    WorkshopPendingMaintenances: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ✅ LOADING SCREEN COMPONENT
const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6f6' }}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ marginTop: 16, color: '#666' }}>Carregando...</Text>
    </View>
);

// ✅ AUTH STACK (Para usuários não autenticados)
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

// ✅ APP STACK (Para usuários autenticados)
const AppStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UserList" component={UserListScreen} />
        <Stack.Screen name="VehicleList" component={VehicleListScreen} />
        <Stack.Screen name="WorkshopList" component={WorkshopListScreen} />
        <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} />
        <Stack.Screen name="InspectionList" component={InspectionListScreen} />
        <Stack.Screen name="VehicleForm" component={VehicleFormScreen as React.ComponentType<any>} />
        <Stack.Screen name="UserForm" component={UserFormScreen as React.ComponentType<any>} />
        <Stack.Screen name="WorkshopForm" component={WorkshopFormScreen as React.ComponentType<any>} />
        <Stack.Screen name="MaintenanceForm" component={MaintenanceFormScreen as React.ComponentType<any>} />
        <Stack.Screen name="InspectionForm" component={InspectionFormScreen as React.ComponentType<any>} />
        <Stack.Screen name="VehicleDetail" component={require('../screens/VehicleDetailScreen').default} options={{ title: 'Detalhes do Veículo' }} />
        <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen as React.ComponentType<any>} options={{ title: 'Detalhes da Manutenção' }} />
        <Stack.Screen name="WorkshopDetail" component={WorkshopDetailScreen as React.ComponentType<any>} options={{ title: 'Detalhes da Oficina' }} />
        <Stack.Screen name="InspectionDetail" component={InspectionDetailScreen as React.ComponentType<any>} options={{ title: 'Detalhes da Inspeção' }} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AvailableWorkshopsScreen" component={AvailableWorkshopsScreen} />
        <Stack.Screen name="WorkshopPendingMaintenances" component={WorkshopPendingMaintenancesScreen} />
    </Stack.Navigator>
);

// ✅ MAIN APP NAVIGATOR
const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // ✅ MOSTRAR LOADING ENQUANTO VERIFICA AUTENTICAÇÃO
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
};

export default AppNavigator;