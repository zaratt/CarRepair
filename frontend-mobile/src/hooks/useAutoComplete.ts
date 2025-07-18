import { useEffect, useMemo, useState } from 'react';
import * as api from '../api/api';
import { getStoredUser } from '../utils/auth';

// Tipos
interface Suggestion {
    text: string;
    type: 'history' | 'workshop';
    priority?: number;
}

interface MaintenanceHistoryItem {
    id: string;
    description: string;
    serviceType: string;
    frequency?: number;
}

interface WorkshopService {
    service: string;
    frequency: number;
}

interface UseAutoCompleteOptions {
    minLength?: number;
    maxSuggestions?: number;
    workshopId?: string;
}

interface UseAutoCompleteReturn {
    suggestions: Suggestion[];
    isLoading: boolean;
    getSuggestions: (query: string) => Suggestion[];
    clearSuggestions: () => void;
}

/**
 * Hook para auto-complete inteligente que combina:
 * 1. Histórico pessoal do usuário
 * 2. Serviços mais comuns da oficina selecionada
 */
export const useAutoComplete = (options: UseAutoCompleteOptions = {}): UseAutoCompleteReturn => {
    const {
        minLength = 2,
        maxSuggestions = 10,
        workshopId
    } = options;

    // Estados
    const [userHistory, setUserHistory] = useState<MaintenanceHistoryItem[]>([]);
    const [workshopServices, setWorkshopServices] = useState<WorkshopService[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    // Estado para armazenar o usuário atual
    const [user, setUser] = useState<any>(null);

    // Carregar usuário armazenado
    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await getStoredUser();
            setUser(storedUser);
        };
        loadUser();
    }, []);

    // Carregar histórico do usuário
    useEffect(() => {
        if (!user?.userId) return;

        const fetchUserHistory = async () => {
            try {
                setIsLoading(true);
                const response = await api.getUserMaintenanceHistory(user.userId);

                // Processar serviços do histórico
                const allServices = [...response.services, ...response.recentServices];

                // Calcular frequência de cada tipo de serviço
                const serviceFrequency: { [key: string]: number } = {};
                allServices.forEach(service => {
                    const key = service.toLowerCase();
                    serviceFrequency[key] = (serviceFrequency[key] || 0) + 1;
                });

                // Criar array de serviços únicos com frequência
                const uniqueServices = Object.keys(serviceFrequency).map(serviceType => ({
                    id: `history-${serviceType}`,
                    description: serviceType,
                    serviceType,
                    frequency: serviceFrequency[serviceType]
                }));

                setUserHistory(uniqueServices);
            } catch (error) {
                console.error('Erro ao carregar histórico do usuário:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserHistory();
    }, [user?.userId]);

    // Carregar serviços da oficina
    useEffect(() => {
        if (!workshopId) return;

        const fetchWorkshopServices = async () => {
            try {
                setIsLoading(true);
                const response = await api.getWorkshopCommonServices(workshopId);

                // Assumindo que a resposta é um array de strings (nomes dos serviços)
                const services: WorkshopService[] = response.map((service, index) => ({
                    service,
                    frequency: response.length - index // Prioridade baseada na ordem
                }));

                setWorkshopServices(services);
            } catch (error) {
                console.error('Erro ao carregar serviços da oficina:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkshopServices();
    }, [workshopId]);

    // Função para gerar sugestões baseadas na query
    const getSuggestions = useMemo(() => {
        return (query: string): Suggestion[] => {
            if (!query || query.length < minLength) {
                return [];
            }

            const normalizedQuery = query.toLowerCase().trim();
            const newSuggestions: Suggestion[] = [];

            // Sugestões do histórico pessoal (maior prioridade)
            userHistory.forEach(item => {
                if (item.serviceType.toLowerCase().includes(normalizedQuery)) {
                    newSuggestions.push({
                        text: item.serviceType,
                        type: 'history',
                        priority: (item.frequency || 1) * 2 // Dobrar prioridade do histórico pessoal
                    });
                }
            });

            // Sugestões dos serviços da oficina
            workshopServices.forEach(service => {
                if (service.service.toLowerCase().includes(normalizedQuery)) {
                    // Evitar duplicatas com histórico pessoal
                    const alreadyExists = newSuggestions.some(
                        s => s.text.toLowerCase() === service.service.toLowerCase()
                    );

                    if (!alreadyExists) {
                        newSuggestions.push({
                            text: service.service,
                            type: 'workshop',
                            priority: service.frequency
                        });
                    }
                }
            });

            // Ordenar por prioridade (maior primeiro) e limitar resultados
            return newSuggestions
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .slice(0, maxSuggestions);
        };
    }, [userHistory, workshopServices, minLength, maxSuggestions]);

    // Função para limpar sugestões
    const clearSuggestions = () => {
        setSuggestions([]);
    };

    return {
        suggestions,
        isLoading,
        getSuggestions: (query: string) => {
            const newSuggestions = getSuggestions(query);
            setSuggestions(newSuggestions);
            return newSuggestions;
        },
        clearSuggestions
    };
};
