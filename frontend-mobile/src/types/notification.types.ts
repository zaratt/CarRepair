// 🔔 Sistema de Notificações CarRepair
// Tipos e interfaces para notificações inteligentes

export interface NotificationSettings {
    id: string;
    userId: string;
    // Manutenções Preventivas
    maintenanceNotifications: {
        enabled: boolean;
        byMileage: boolean;      // Por quilometragem
        byTime: boolean;         // Por tempo
        recommendations: boolean; // Baseado em histórico
        advanceNotice: number;   // Dias de antecedência (7, 15, 30)
    };
    // Vistorias Situacionais
    inspectionNotifications: {
        enabled: boolean;
        sellingReminder: boolean;    // Lembrete ao vender
        buyingReminder: boolean;     // Lembrete ao comprar
        annualSuggestion: boolean;   // Sugestão anual opcional
    };
    // Dicas e Cuidados
    tipsNotifications: {
        enabled: boolean;
        seasonal: boolean;       // Dicas sazonais
        personalized: boolean;   // Baseado em perfil
        performance: boolean;    // Análises de performance
    };
    // Configurações Gerais
    general: {
        preferredTime: string;   // "08:00" formato HH:mm
        maxFrequency: 'daily' | 'weekly' | 'monthly';
        sound: boolean;
        vibration: boolean;
        pushEnabled: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface NotificationRule {
    id: string;
    type: NotificationType;
    category: NotificationCategory;
    trigger: NotificationTrigger;
    title: string;
    message: string;
    priority: NotificationPriority;
    enabled: boolean;
    conditions?: NotificationCondition[];
}

export interface NotificationHistory {
    id: string;
    userId: string;
    vehicleId?: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    scheduledFor: string;
    sentAt?: string;
    status: NotificationStatus;
    priority: NotificationPriority;
    actionTaken?: 'viewed' | 'dismissed' | 'acted' | 'scheduled_maintenance';
    relatedId?: string; // ID da manutenção/vistoria relacionada
    createdAt: string;
}

export interface ScheduledNotification {
    id: string;
    userId: string;
    vehicleId?: string;
    rule: NotificationRule;
    scheduledFor: string;
    data?: any; // Dados contextuais específicos
    created: string;
}

// Enums e Constantes
export enum NotificationType {
    MAINTENANCE_MILEAGE = 'maintenance_mileage',
    MAINTENANCE_TIME = 'maintenance_time',
    MAINTENANCE_RECOMMENDATION = 'maintenance_recommendation',
    INSPECTION_SELLING = 'inspection_selling',
    INSPECTION_BUYING = 'inspection_buying',
    INSPECTION_ANNUAL = 'inspection_annual',
    TIP_SEASONAL = 'tip_seasonal',
    TIP_PERSONALIZED = 'tip_personalized',
    TIP_PERFORMANCE = 'tip_performance',
    DOCUMENT_EXPIRY = 'document_expiry'
}

export enum NotificationCategory {
    MAINTENANCE = 'maintenance',
    INSPECTION = 'inspection',
    TIPS = 'tips',
    DOCUMENTS = 'documents'
}

export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum NotificationStatus {
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface NotificationTrigger {
    type: 'mileage' | 'time' | 'date' | 'event' | 'condition';
    value?: number;
    unit?: 'km' | 'days' | 'months' | 'years';
    compareOperator?: '>=' | '<=' | '=' | '>' | '<';
    eventType?: 'vehicle_added' | 'maintenance_added' | 'user_preference_changed';
}

export interface NotificationCondition {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: any;
}

// Templates de Notificação
export interface NotificationTemplate {
    id: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    priority: NotificationPriority;
    variables: string[]; // Variáveis que podem ser substituídas: {vehiclePlate}, {mileage}, etc.
}

// Estatísticas de Notificações
export interface NotificationStats {
    total: number;
    sent: number;
    delivered: number;
    actionTaken: number;
    byCategory: Record<NotificationCategory, number>;
    byType: Record<NotificationType, number>;
    effectiveness: number; // Percentual de ações tomadas
}

// Dados contextuais para notificações inteligentes
export interface NotificationContext {
    userId: string;
    vehicleId?: string;
    currentMileage?: number;
    lastMaintenanceDate?: string;
    lastMaintenanceType?: string;
    vehicleAge?: number;
    monthlyMileage?: number;
    maintenancePattern?: 'regular' | 'irregular' | 'delayed';
    seasonalContext?: 'summer' | 'winter' | 'rainy' | 'dry';
}

// Constantes para facilitar o uso
export const NOTIFICATION_DEFAULTS = {
    ADVANCE_NOTICE_DAYS: [7, 15, 30],
    PREFERRED_TIMES: ['08:00', '12:00', '18:00'],
    MAX_FREQUENCY_OPTIONS: ['daily', 'weekly', 'monthly'] as const,

    // Quilometragens padrão para lembretes
    MILEAGE_INTERVALS: {
        OIL_CHANGE: [5000, 10000],
        GENERAL_MAINTENANCE: [10000, 20000, 30000],
        FILTER_CHANGE: [15000, 30000],
        TIRE_ROTATION: [10000, 20000],
        BRAKE_CHECK: [50000],
        BATTERY_CHECK: [100000]
    },

    // Intervalos de tempo
    TIME_INTERVALS: {
        OIL_CHANGE: 6, // meses
        GENERAL_MAINTENANCE: 12, // meses
        BATTERY_CHECK: 24, // meses
        DOCUMENT_RENEWAL: 12 // meses (IPVA, seguro)
    }
} as const;

export const NOTIFICATION_MESSAGES = {
    MAINTENANCE: {
        OIL_CHANGE: {
            title: "🔧 Hora da troca de óleo!",
            message: "Seu {vehicleBrand} {vehicleModel} está próximo de {mileage}km. Que tal agendar a troca de óleo?"
        },
        GENERAL_MAINTENANCE: {
            title: "⚙️ Revisão preventiva",
            message: "Já faz {months} meses desde a última revisão do seu {vehiclePlate}. Vamos cuidar bem dele?"
        },
        RECOMMENDATION: {
            title: "💡 Recomendação personalizada",
            message: "Baseado no seu histórico, sugerimos verificar {serviceType} no seu {vehiclePlate}"
        }
    },
    INSPECTION: {
        SELLING: {
            title: "📋 Venda mais fácil com vistoria",
            message: "Uma vistoria pode aumentar a confiança do comprador. Quer fazer antes de vender seu {vehiclePlate}?"
        },
        BUYING: {
            title: "🔍 Compra segura",
            message: "Lembre-se de solicitar vistoria antes de finalizar a compra. Sua segurança é importante!"
        },
        ANNUAL: {
            title: "📋 Vistoria preventiva",
            message: "Que tal fazer uma vistoria preventiva do seu {vehiclePlate} este ano?"
        }
    },
    TIPS: {
        SEASONAL: {
            SUMMER: {
                title: "☀️ Cuidados de verão",
                message: "Verifique o ar condicionado e a pressão dos pneus. O calor pode afetar seu veículo!"
            },
            WINTER: {
                title: "❄️ Cuidados de inverno",
                message: "Bateria e sistema de aquecimento merecem atenção especial nesta época!"
            },
            RAINY: {
                title: "🌧️ Época de chuvas",
                message: "Palhetas do para-brisa e freios são essenciais para dirigir na chuva com segurança!"
            }
        }
    }
} as const;
