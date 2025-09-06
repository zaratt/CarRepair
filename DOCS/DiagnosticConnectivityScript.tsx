// 🔍 Script de Diagnóstico de Conectividade - Automazo
// Adicione este código temporariamente em uma tela para testar conectividade

import axios from 'axios';
import { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

const DiagnosticScreen = () => {
    const [results, setResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testConnectivity = async () => {
        setResults([]);
        addResult('🔍 Iniciando diagnóstico...');

        // 1. Testar variáveis de ambiente
        addResult(`📋 EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || 'NÃO DEFINIDA'}`);
        addResult(`📋 EXPO_PUBLIC_ENV: ${process.env.EXPO_PUBLIC_ENV || 'NÃO DEFINIDA'}`);

        // 2. Testar Health Check
        try {
            addResult('🏥 Testando Health Check...');
            const healthResponse = await axios.get('https://automazo-production.up.railway.app/health', {
                timeout: 10000
            });
            addResult(`✅ Health Check: ${healthResponse.status} - ${healthResponse.data.message}`);
        } catch (error: any) {
            addResult(`❌ Health Check falhou: ${error.message}`);
        }

        // 3. Testar API Base
        try {
            addResult('🌐 Testando API Base...');
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://automazo-production.up.railway.app/api';
            const response = await axios.get(`${apiUrl.replace('/api', '')}/health`, {
                timeout: 10000
            });
            addResult(`✅ API Base: ${response.status}`);
        } catch (error: any) {
            addResult(`❌ API Base falhou: ${error.message}`);
        }

        // 4. Testar endpoint de veículos (sem auth)
        try {
            addResult('🚗 Testando endpoint público...');
            const vehiclesResponse = await axios.get('https://automazo-production.up.railway.app/api/vehicles/brands', {
                timeout: 10000
            });
            addResult(`✅ Endpoint público: ${vehiclesResponse.status}`);
        } catch (error: any) {
            addResult(`❌ Endpoint público falhou: ${error.message}`);
        }

        // 5. Testar conectividade geral
        try {
            addResult('🌍 Testando conectividade geral...');
            const googleResponse = await axios.get('https://www.google.com', {
                timeout: 5000
            });
            addResult(`✅ Internet: ${googleResponse.status}`);
        } catch (error: any) {
            addResult(`❌ Internet falhou: ${error.message}`);
        }

        addResult('🎯 Diagnóstico concluído!');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔍 Diagnóstico de Conectividade</Text>

            <Button title="Executar Diagnóstico" onPress={testConnectivity} />

            <ScrollView style={styles.resultsContainer}>
                {results.map((result, index) => (
                    <Text key={index} style={styles.resultText}>
                        {result}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    resultsContainer: {
        marginTop: 20,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        maxHeight: 400,
    },
    resultText: {
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 5,
        lineHeight: 16,
    },
});

export default DiagnosticScreen;

/*
INSTRUÇÕES DE USO:

1. Adicione este componente temporariamente ao seu app
2. Navegue para esta tela
3. Execute o diagnóstico
4. Compartilhe os resultados para análise

EXEMPLO DE RESULTADO ESPERADO:
✅ EXPO_PUBLIC_API_URL: https://automazo-production.up.railway.app/api
✅ EXPO_PUBLIC_ENV: production
✅ Health Check: 200 - CarRepair API is running
✅ API Base: 200
✅ Endpoint público: 200
✅ Internet: 200

PROBLEMAS COMUNS:
❌ Se Health Check falha: Problema de conectividade ou certificado
❌ Se API Base falha: Problema com variáveis de ambiente
❌ Se Internet falha: Problema de rede do dispositivo
*/
