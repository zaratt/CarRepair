import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import { customTheme } from './src/styles/theme';

const queryClient = new QueryClient();

export default function TestApp() {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <PaperProvider theme={customTheme}>
                    <NavigationContainer>
                        <TabNavigator />
                    </NavigationContainer>
                </PaperProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
