import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';
import { customTheme } from './src/styles/theme';

const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={customTheme}>
            <AppNavigator />
          </PaperProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}