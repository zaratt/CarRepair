import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';

// 📊 Interface para resumo do dashboard
interface DashboardSummary {
    totalVehicles: number;
    totalMaintenances: number;
    averageSpending: number;
    totalWorkshopsUsed: number;
}

// 🚗 Interface para veículos do dashboard
interface VehicleDashboard {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    currentKm: number;
    totalMaintenances: number;
    averageSpending: number;
    upcomingMaintenances: {
        id: string;
        description: string;
        scheduledDate: string;
        estimatedCost?: number;
    }[];
}

/**
 * 📊 Obter resumo do dashboard do usuário
 */
export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'ID do usuário é obrigatório'
            });
            return;
        }

        // Buscar estatísticas do usuário
        const [
            totalVehicles,
            totalMaintenances,
            maintenanceSpending,
            workshopsUsed
        ] = await Promise.all([
            // Total de veículos
            prisma.vehicle.count({
                where: { ownerId: userId }
            }),

            // Total de manutenções
            prisma.maintenance.count({
                where: {
                    vehicle: { ownerId: userId }
                }
            }),

            // Gastos em manutenções
            prisma.maintenance.aggregate({
                where: {
                    vehicle: { ownerId: userId },
                    value: { not: null }
                },
                _avg: {
                    value: true
                }
            }),

            // Total de oficinas utilizadas
            prisma.maintenance.findMany({
                where: {
                    vehicle: { ownerId: userId }
                },
                select: {
                    workshopId: true
                },
                distinct: ['workshopId']
            })
        ]);

        const summary: DashboardSummary = {
            totalVehicles,
            totalMaintenances,
            averageSpending: maintenanceSpending._avg?.value || 0,
            totalWorkshopsUsed: workshopsUsed.filter(w => w.workshopId !== null).length
        };

        res.json({
            success: true,
            message: 'Resumo do dashboard obtido com sucesso',
            data: summary
        });

    } catch (error) {
        next(error);
    }
};

/**
 * 🚗 Obter veículos do dashboard com manutenções próximas
 */
export const getDashboardVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'ID do usuário é obrigatório'
            });
            return;
        }

        // Buscar veículos do usuário com relacionamentos
        const vehicles = await prisma.vehicle.findMany({
            where: { ownerId: userId },
            include: {
                maintenances: {
                    include: {
                        workshop: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    }
                },
                brand: {
                    select: {
                        name: true
                    }
                },
                model: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Processar dados dos veículos
        const vehiclesDashboard: VehicleDashboard[] = vehicles.map((vehicle) => {
            // Calcular estatísticas de manutenção
            const completedMaintenances = vehicle.maintenances.filter(m => m.value !== null);
            const totalMaintenances = vehicle.maintenances.length;
            const totalSpending = completedMaintenances.reduce((sum, m) => sum + (m.value || 0), 0);
            const averageSpending = completedMaintenances.length > 0 ? totalSpending / completedMaintenances.length : 0;

            // Para manutenções próximas, vamos usar as mais recentes que ainda não foram realizadas
            // Como o schema atual não tem status de agendamento, vamos simular com as 3 mais recentes
            const upcomingMaintenances = vehicle.maintenances
                .slice(0, 3) // Pegar as 3 mais recentes
                .map(m => ({
                    id: m.id,
                    description: m.description || 'Manutenção sem descrição',
                    scheduledDate: m.date.toISOString(),
                    estimatedCost: m.value || undefined
                }));

            return {
                id: vehicle.id,
                brand: vehicle.brand?.name || 'Marca não informada',
                model: vehicle.model?.name || 'Modelo não informado',
                licensePlate: vehicle.licensePlate,
                currentKm: vehicle.currentKm || 0,
                totalMaintenances,
                averageSpending,
                upcomingMaintenances
            };
        });

        res.json({
            success: true,
            message: 'Veículos do dashboard obtidos com sucesso',
            data: vehiclesDashboard
        });

    } catch (error) {
        next(error);
    }
};