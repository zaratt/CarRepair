import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VehicleProvider, useVehicleContext } from '../hooks/useVehicleContext';
import { AppColors } from '../styles/colors';

// 🧪 Componente de conteúdo que usa o contexto
const VehicleApiTestContent = () => {
    const {
        vehicles,
        vehiclesCount,
        stats,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        createSuccess,
        updateSuccess,
        deleteSuccess,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        refetch,
        clearErrors,
        isUsingRealAPI
    } = useVehicleContext();

    // 🧪 Dados de teste para criar veículo
    const testVehicleData = {
        brandId: 'brand-1',
        modelId: 'model-1',
        yearManufacture: 2020,
        modelYear: 2020,
        licensePlate: 'ABC1234',
        fuelType: 'FLEX' as const,
        vin: '1HGBH41JXMN109186',
        color: 'Prata',
        chassisNumber: 'CH123456789',
        engineNumber: 'EN987654321',
        transmission: 'Automático',
        category: 'Sedan',
        notes: 'Veículo de teste criado pela API',
    };

    // 🧪 Função para testar criação
    const handleTestCreate = () => {
        console.log('🧪 Testando criação de veículo...');
        createVehicle(testVehicleData);
    };

    // 🧪 Função para testar atualização
    const handleTestUpdate = () => {
        if (vehicles.length > 0) {
            const vehicleId = vehicles[0].id;
            console.log('🧪 Testando atualização de veículo:', vehicleId);
            updateVehicle(vehicleId, {
                color: 'Azul',
            });
        } else {
            console.log('⚠️ Nenhum veículo disponível para atualizar');
        }
    };

    // 🧪 Função para testar exclusão
    const handleTestDelete = () => {
        if (vehicles.length > 0) {
            const vehicleId = vehicles[0].id;
            console.log('🧪 Testando exclusão de veículo:', vehicleId);
            deleteVehicle(vehicleId);
        } else {
            console.log('⚠️ Nenhum veículo disponível para excluir');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

                {/* Header */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="headlineSmall" style={styles.title}>
                            🧪 Teste da API de Veículos
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Fase 2: Integração com Backend Real
                        </Text>

                        <View style={styles.systemIndicator}>
                            <Chip
                                icon={isUsingRealAPI ? 'cloud' : 'wrench'}
                                mode="outlined"
                                style={[
                                    styles.systemChip,
                                    { borderColor: isUsingRealAPI ? AppColors.primary : AppColors.secondary }
                                ]}
                            >
                                {isUsingRealAPI ? '🌐 API Real' : '🔧 Sistema Mock'}
                            </Chip>
                        </View>
                    </Card.Content>
                </Card>

                {/* Estados de Loading */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            📊 Estados de Loading
                        </Text>

                        <View style={styles.statusGrid}>
                            <Chip mode={isLoading ? 'flat' : 'outlined'}>
                                {isLoading ? '🔄' : '✅'} Carregando: {isLoading.toString()}
                            </Chip>
                            <Chip mode={isCreating ? 'flat' : 'outlined'}>
                                {isCreating ? '🔄' : '✅'} Criando: {isCreating.toString()}
                            </Chip>
                            <Chip mode={isUpdating ? 'flat' : 'outlined'}>
                                {isUpdating ? '🔄' : '✅'} Atualizando: {isUpdating.toString()}
                            </Chip>
                            <Chip mode={isDeleting ? 'flat' : 'outlined'}>
                                {isDeleting ? '🔄' : '✅'} Excluindo: {isDeleting.toString()}
                            </Chip>
                        </View>
                    </Card.Content>
                </Card>

                {/* Dados dos Veículos */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            🚗 Dados dos Veículos
                        </Text>

                        <Text variant="bodyLarge" style={styles.dataText}>
                            Total de veículos: {vehiclesCount}
                        </Text>

                        {stats && (
                            <View style={styles.statsContainer}>
                                <Text variant="bodyMedium">📈 Estatísticas:</Text>
                                <Text variant="bodySmall">• Total: {stats.totalVehicles}</Text>
                                <Text variant="bodySmall">• Ativos: {stats.activeVehicles}</Text>
                                <Text variant="bodySmall">• Inativos: {stats.inactiveVehicles}</Text>
                                <Text variant="bodySmall">• Média de ano: {stats.averageYear}</Text>
                                <Text variant="bodySmall">• Marca mais comum: {stats.mostCommonBrand}</Text>
                            </View>
                        )}

                        {vehicles.length > 0 && (
                            <View style={styles.vehiclesContainer}>
                                <Text variant="bodyMedium">🚙 Veículos:</Text>
                                {vehicles.slice(0, 3).map((vehicle, index) => (
                                    <Text key={vehicle.id} variant="bodySmall" style={styles.vehicleItem}>
                                        {index + 1}. ID: {vehicle.id.slice(0, 8)}...
                                    </Text>
                                ))}
                                {vehicles.length > 3 && (
                                    <Text variant="bodySmall" style={styles.moreVehicles}>
                                        ... e mais {vehicles.length - 3} veículos
                                    </Text>
                                )}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Estados de Sucesso */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            ✅ Estados de Sucesso
                        </Text>

                        <View style={styles.statusGrid}>
                            <Chip
                                mode={createSuccess ? 'flat' : 'outlined'}
                                style={createSuccess ? styles.successChip : undefined}
                            >
                                Criação: {createSuccess ? '✅' : '⭕'}
                            </Chip>
                            <Chip
                                mode={updateSuccess ? 'flat' : 'outlined'}
                                style={updateSuccess ? styles.successChip : undefined}
                            >
                                Atualização: {updateSuccess ? '✅' : '⭕'}
                            </Chip>
                            <Chip
                                mode={deleteSuccess ? 'flat' : 'outlined'}
                                style={deleteSuccess ? styles.successChip : undefined}
                            >
                                Exclusão: {deleteSuccess ? '✅' : '⭕'}
                            </Chip>
                        </View>
                    </Card.Content>
                </Card>

                {/* Erros */}
                {(error || createError || updateError || deleteError) && (
                    <Card style={[styles.card, styles.errorCard]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.errorTitle}>
                                ❌ Erros
                            </Text>

                            {error && <Text variant="bodySmall" style={styles.errorText}>Geral: {error}</Text>}
                            {createError && <Text variant="bodySmall" style={styles.errorText}>Criação: {createError}</Text>}
                            {updateError && <Text variant="bodySmall" style={styles.errorText}>Atualização: {updateError}</Text>}
                            {deleteError && <Text variant="bodySmall" style={styles.errorText}>Exclusão: {deleteError}</Text>}

                            <Button
                                mode="outlined"
                                onPress={clearErrors}
                                style={styles.clearErrorsButton}
                            >
                                Limpar Erros
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {/* Ações de Teste */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            🧪 Ações de Teste
                        </Text>

                        <View style={styles.actionButtons}>
                            <Button
                                mode="contained"
                                onPress={refetch}
                                icon="refresh"
                                style={styles.actionButton}
                                disabled={isLoading}
                            >
                                Recarregar
                            </Button>

                            <Button
                                mode="contained"
                                onPress={handleTestCreate}
                                icon="plus"
                                style={styles.actionButton}
                                disabled={isCreating}
                            >
                                Criar Teste
                            </Button>

                            <Button
                                mode="contained"
                                onPress={handleTestUpdate}
                                icon="pencil"
                                style={styles.actionButton}
                                disabled={isUpdating || vehicles.length === 0}
                            >
                                Atualizar
                            </Button>

                            <Button
                                mode="contained"
                                onPress={handleTestDelete}
                                icon="delete"
                                style={[styles.actionButton, styles.deleteButton]}
                                disabled={isDeleting || vehicles.length === 0}
                            >
                                Excluir
                            </Button>
                        </View>
                    </Card.Content>
                </Card>

                {/* Footer */}
                <Card style={[styles.card, styles.footerCard]}>
                    <Card.Content>
                        <Text variant="bodySmall" style={styles.footerText}>
                            💡 Esta tela demonstra a integração da Fase 2 (API de Veículos) do plano de backend.
                            Quando USE_REAL_API=true, todas as operações serão feitas contra o backend real.
                        </Text>
                    </Card.Content>
                </Card>

            </ScrollView>
        </SafeAreaView>
    );
};

// 🧪 Componente principal com Provider
export default function VehicleApiTestScreen() {
    return (
        <VehicleProvider>
            <VehicleApiTestContent />
        </VehicleProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 4,
    },
    subtitle: {
        color: AppColors.text,
        opacity: 0.8,
        marginBottom: 16,
    },
    systemIndicator: {
        alignItems: 'flex-start',
    },
    systemChip: {
        backgroundColor: 'transparent',
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 12,
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dataText: {
        color: AppColors.text,
        marginBottom: 8,
    },
    statsContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: AppColors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.gray,
    },
    vehiclesContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: AppColors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.gray,
    },
    vehicleItem: {
        color: AppColors.text,
        marginLeft: 8,
    },
    moreVehicles: {
        color: AppColors.text,
        opacity: 0.6,
        marginLeft: 8,
        fontStyle: 'italic',
    },
    successChip: {
        backgroundColor: AppColors.primary,
    },
    errorCard: {
        borderColor: AppColors.danger,
        borderWidth: 1,
    },
    errorTitle: {
        color: AppColors.danger,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    errorText: {
        color: AppColors.danger,
        marginBottom: 4,
    },
    clearErrorsButton: {
        marginTop: 8,
        borderColor: AppColors.danger,
    },
    actionButtons: {
        gap: 12,
    },
    actionButton: {
        backgroundColor: AppColors.primary,
        marginBottom: 8,
    },
    deleteButton: {
        backgroundColor: AppColors.danger,
    },
    footerCard: {
        backgroundColor: AppColors.primary,
        opacity: 0.9,
    },
    footerText: {
        color: AppColors.white,
        textAlign: 'center',
        lineHeight: 20,
    },
});
