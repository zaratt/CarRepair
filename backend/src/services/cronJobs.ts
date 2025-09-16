import cron from 'node-cron';
import { cleanupExpiredNotifications, markOldNotificationsAsRead } from './notificationService';

// ✅ JOB CRON: Limpeza diária de notificações expiradas
// Executa todos os dias às 02:00
cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Iniciando limpeza automática de notificações...');

    try {
        const expiredCount = await cleanupExpiredNotifications();
        const markedCount = await markOldNotificationsAsRead();

        console.log(`✅ Limpeza concluída:
- ${expiredCount} notificações expiradas removidas
- ${markedCount} notificações antigas marcadas como lidas`);
    } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
    }
});

// ✅ JOB CRON: Verificação de lembretes de manutenção
// Executa todos os dias às 08:00
cron.schedule('0 8 * * *', async () => {
    console.log('🔧 Verificando lembretes de manutenção...');

    try {
        // TODO: Implementar verificação baseada em quilometragem
        // Este job seria usado para verificar veículos que precisam de manutenção
        console.log('ℹ️ Verificação de manutenção: implementação pendente');
    } catch (error) {
        console.error('❌ Erro na verificação de manutenção:', error);
    }
});

// ✅ JOB CRON: Verificação de lembretes de inspeção
// Executa todas as segundas-feiras às 09:00
cron.schedule('0 9 * * 1', async () => {
    console.log('📋 Verificando lembretes de inspeção...');

    try {
        // TODO: Implementar verificação de datas de vencimento de inspeção
        // Este job seria usado para verificar inspeções próximas do vencimento
        console.log('ℹ️ Verificação de inspeção: implementação pendente');
    } catch (error) {
        console.error('❌ Erro na verificação de inspeção:', error);
    }
});

export const initializeCronJobs = () => {
    console.log('⏰ Tarefas automáticas de notificação inicializadas:');
    console.log('   - Limpeza diária às 02:00');
    console.log('   - Verificação de manutenção às 08:00');
    console.log('   - Verificação de inspeção às segundas 09:00');
};