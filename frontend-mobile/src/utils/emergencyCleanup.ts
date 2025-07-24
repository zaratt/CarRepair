import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚨 LIMPEZA EMERGENCIAL DO ASYNCSTORAGE
export const emergencyStorageCleanup = async (): Promise<void> => {
    try {
        console.log('🚨 Iniciando limpeza emergencial do AsyncStorage...');

        // Verificar todas as chaves
        const keys = await AsyncStorage.getAllKeys();

        let hasCorruptedData = false;

        for (const key of keys) {
            try {
                const value = await AsyncStorage.getItem(key);
                // ✅ Verificar se dados estão corrompidos (sem caracteres problemáticos)
                if (value && (value.length < 2 || (key.includes('token') && !value.includes('.')))) {
                    console.warn(`🔧 Dados possivelmente corrompidos encontrados em: ${key}`);
                    hasCorruptedData = true;
                    break;
                }
            } catch (error) {
                console.warn(`🔧 Erro ao ler chave ${key}:`, error);
                hasCorruptedData = true;
                break;
            }
        }

        if (hasCorruptedData) {
            console.log('🧹 Limpando todo o AsyncStorage devido a dados corrompidos...');
            await AsyncStorage.clear();
            console.log('✅ AsyncStorage limpo completamente!');
            return;
        }

        console.log('✅ AsyncStorage verificado - nenhum dado corrompido encontrado');

    } catch (error) {
        console.error('❌ Erro durante limpeza emergencial:', error);
        // Se houver erro, fazer limpeza completa por segurança
        try {
            await AsyncStorage.clear();
            console.log('✅ Limpeza completa de segurança realizada');
        } catch (clearError) {
            console.error('❌ Erro crítico ao limpar AsyncStorage:', clearError);
        }
    }
};

export default emergencyStorageCleanup;
