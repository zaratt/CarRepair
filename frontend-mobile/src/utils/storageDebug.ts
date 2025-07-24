import AsyncStorage from '@react-native-async-storage/async-storage';

// 🧹 SCRIPT DE LIMPEZA COMPLETA DO ASYNCSTORAGE
export const clearAllStorage = async (): Promise<void> => {
    try {
        console.log('🧹 Iniciando limpeza completa do AsyncStorage...');

        // Limpar todas as chaves
        await AsyncStorage.clear();

        console.log('✅ AsyncStorage limpo completamente!');
        console.log('📱 Reinicie o app para aplicar mudanças');

    } catch (error) {
        console.error('❌ Erro ao limpar AsyncStorage:', error);
    }
};

// 🔍 SCRIPT PARA DEBUG DO ASYNCSTORAGE
export const debugStorage = async (): Promise<void> => {
    try {
        console.log('🔍 Verificando conteúdo do AsyncStorage...');

        const keys = await AsyncStorage.getAllKeys();
        console.log('📋 Chaves encontradas:', keys);

        for (const key of keys) {
            const value = await AsyncStorage.getItem(key);
            console.log(`🔑 ${key}:`, value?.substring(0, 100) + (value && value.length > 100 ? '...' : ''));
        }

    } catch (error) {
        console.error('❌ Erro ao verificar AsyncStorage:', error);
    }
};

// 🎯 USO:
// Para limpar: await clearAllStorage();
// Para debug: await debugStorage();
