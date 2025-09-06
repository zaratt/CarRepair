# 🔍 Script de Diagnóstico de Conectividade - Automazo

## 📋 Resumo
Este é um componente React Native/Expo para testar conectividade com a API do backend em produção.

## 🚀 Como Implementar

### 1. Criar o arquivo no seu projeto
Crie o arquivo `src/screens/DiagnosticScreen.tsx` na pasta do frontend-mobile:

```tsx
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import Constants from 'expo-constants';

const DiagnosticScreen = () => {
    const [results, setResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testConnectivity = async () => {
        setResults([]);
        addResult('🔍 Iniciando diagnóstico...');

        // 1. Testar variáveis de ambiente
        const apiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
                      'NÃO DEFINIDA';
        const env = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENV || 
                   'NÃO DEFINIDA';
        
        addResult(`📋 EXPO_PUBLIC_API_URL: ${apiUrl}`);
        addResult(`📋 EXPO_PUBLIC_ENV: ${env}`);

        // 2. Testar Health Check
        try {
            addResult('🏥 Testando Health Check...');
            const response = await fetch('https://automazo-production.up.railway.app/health', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
                const data = await response.json();
                addResult(`✅ Health Check: ${response.status} - ${data.message || 'OK'}`);
            } else {
                addResult(`❌ Health Check: ${response.status} - ${response.statusText}`);
            }
        } catch (error: any) {
            addResult(`❌ Health Check falhou: ${error.message}`);
        }

        // 3. Testar API Base
        try {
            addResult('🌐 Testando API Base...');
            const response = await fetch('https://automazo-production.up.railway.app/api/vehicles/brands', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
                addResult(`✅ API Base: ${response.status}`);
            } else {
                addResult(`❌ API Base: ${response.status} - ${response.statusText}`);
            }
        } catch (error: any) {
            addResult(`❌ API Base falhou: ${error.message}`);
        }

        addResult('🎯 Diagnóstico concluído!');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔍 Diagnóstico de Conectividade</Text>
            <Button title="🚀 Executar Diagnóstico" onPress={testConnectivity} />
            
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
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 15,
        marginTop: 20,
        borderRadius: 10,
    },
    resultText: {
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 8,
    },
});

export default DiagnosticScreen;
```

### 2. Adicionar ao Navigator
No seu arquivo de navegação (AppNavigator.tsx ou similar):

```tsx
import DiagnosticScreen from '../screens/DiagnosticScreen';

// Dentro do Stack.Navigator:
<Stack.Screen 
  name="Diagnostic" 
  component={DiagnosticScreen} 
  options={{ title: 'Diagnóstico' }}
/>
```

### 3. Instalar dependências necessárias
```bash
cd frontend-mobile
npm install expo-constants
```

## 📊 Resultados Esperados

### ✅ Sucesso Total
```
📋 EXPO_PUBLIC_API_URL: https://automazo-production.up.railway.app/api
📋 EXPO_PUBLIC_ENV: production
✅ Health Check: 200 - CarRepair API is running
✅ API Base: 200
```

### ❌ Problemas Comuns

#### Problema 1: Variáveis de Ambiente
```
📋 EXPO_PUBLIC_API_URL: NÃO DEFINIDA
📋 EXPO_PUBLIC_ENV: NÃO DEFINIDA
```
**Solução**: Verificar arquivo `.env` e configuração do Expo

#### Problema 2: Network Error
```
❌ Health Check falhou: Network request failed
```
**Solução**: Problema de conectividade ou firewall

#### Problema 3: API Indisponível
```
❌ Health Check: 500 - Internal Server Error
```
**Solução**: Backend com problemas, verificar Railway

## 🛠️ Troubleshooting

### 1. Erros de Compilação
Se aparecerem erros sobre React ou React Native:
- Certifique-se de estar dentro da pasta `frontend-mobile`
- Execute `npm install` para instalar dependências

### 2. Expo Constants não funciona
```bash
npx expo install expo-constants
```

### 3. Fetch API não funciona
O Expo já inclui fetch nativo, mas se houver problemas:
```bash
npm install whatwg-fetch
```

## 🎯 Como Usar para Debug

### Cenário 1: "Network Error" no dispositivo físico
1. Execute o diagnóstico
2. Verifique se o Health Check passa
3. Se falhar, problema de rede/certificado
4. Se passar, problema na configuração do cliente API

### Cenário 2: Login/Register não funciona
1. Execute o diagnóstico
2. Teste os endpoints da API
3. Verifique se as variáveis de ambiente estão corretas

### Cenário 3: App funciona no simulador mas não no dispositivo
1. Execute em ambos
2. Compare os resultados
3. Foque nas diferenças de conectividade

## 📱 Compatibilidade

- ✅ Expo SDK 49+
- ✅ React Native 0.72+
- ✅ iOS e Android
- ✅ Expo Go e builds standalone
- ✅ Dispositivos físicos e simuladores

## 🔄 Status Atual do Backend

### Backend Railway (Produção)
- **URL**: https://automazo-production.up.railway.app
- **Status**: ✅ Online
- **Health Check**: `/health` → 200 OK
- **API Base**: `/api` → Funcional

### Configuração Corrigida
- ✅ `client.ts` atualizado para usar `EXPO_PUBLIC_ENV`
- ✅ Timeout aumentado para 15000ms
- ✅ URL de produção configurada corretamente

## 📝 Notas Importantes

1. **Não commitar este arquivo para produção** - É apenas para debug
2. **Remover após resolver problemas** - Não deixar no app final
3. **Usar apenas em desenvolvimento** - Não expor em builds de produção
4. **Testar em dispositivo real** - Simulador pode mascarar problemas de rede

## 🆘 Em Caso de Emergência

Se o diagnóstico falhar completamente:

1. **Verificar status do Railway**:
   ```bash
   curl https://automazo-production.up.railway.app/health
   ```

2. **Testar conectividade básica**:
   ```bash
   ping automazo-production.up.railway.app
   ```

3. **Verificar logs do Railway**:
   - Acessar dashboard do Railway
   - Verificar logs em tempo real

4. **Resetar configuração local**:
   ```bash
   cd frontend-mobile
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```
