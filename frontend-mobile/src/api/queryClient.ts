import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// 🔧 Configuração do React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache por 5 minutos
            staleTime: 5 * 60 * 1000,
            // Manter dados em cache por 10 minutos quando não utilizados
            gcTime: 10 * 60 * 1000, // Novo nome no React Query v5
            // Não refetch automaticamente no focus (pode ser ativado depois)
            refetchOnWindowFocus: false,
            // Retry apenas 2 vezes em caso de erro
            retry: 2,
            // Função de retry customizada
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
            // Retry 1 vez para mutações
            retry: 1,
        },
    },
});

// 🎯 Provider do React Query
interface ReactQueryProviderProps {
    children: React.ReactNode;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({ children }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// 🔑 Keys para queries (organização e invalidação)
export const queryKeys = {
    // Autenticação
    auth: {
        user: ['auth', 'user'] as const,
    },
    // Veículos
    vehicles: {
        all: ['vehicles'] as const,
        lists: () => [...queryKeys.vehicles.all, 'list'] as const,
        list: (filters: string) => [...queryKeys.vehicles.lists(), { filters }] as const,
        details: () => [...queryKeys.vehicles.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
    },
    // Manutenções
    maintenances: {
        all: ['maintenances'] as const,
        lists: () => [...queryKeys.maintenances.all, 'list'] as const,
        list: (filters: string) => [...queryKeys.maintenances.lists(), { filters }] as const,
        details: () => [...queryKeys.maintenances.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.maintenances.details(), id] as const,
    },
    // Vistorias
    inspections: {
        all: ['inspections'] as const,
        lists: () => [...queryKeys.inspections.all, 'list'] as const,
        list: (filters: string) => [...queryKeys.inspections.lists(), { filters }] as const,
        details: () => [...queryKeys.inspections.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.inspections.details(), id] as const,
    },
    // Notificações
    notifications: {
        all: ['notifications'] as const,
        settings: ['notifications', 'settings'] as const,
        history: ['notifications', 'history'] as const,
        stats: ['notifications', 'stats'] as const,
    },
} as const;

// 🔧 Utilitários do React Query
export const reactQueryUtils = {
    // Invalidar todas as queries de uma seção
    invalidateVehicles: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
    invalidateMaintenances: () => queryClient.invalidateQueries({ queryKey: queryKeys.maintenances.all }),
    invalidateInspections: () => queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all }),
    invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),

    // Invalidar tudo (útil após login/logout)
    invalidateAll: () => queryClient.invalidateQueries(),

    // Limpar cache
    clearCache: () => queryClient.clear(),

    // Obter dados do cache sem fazer request
    getVehiclesCache: () => queryClient.getQueryData(queryKeys.vehicles.all),
    getUserCache: () => queryClient.getQueryData(queryKeys.auth.user),
};

export { queryClient };
export default queryClient;
