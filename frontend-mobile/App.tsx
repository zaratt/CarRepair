import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/components/SplashScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { customTheme } from './src/styles/theme';

const queryClient = new QueryClient();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={customTheme}>
            <NotificationProvider>
              <AppNavigator />
              {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
            </NotificationProvider>
          </PaperProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}