# 🚨 COMANDOS EMERGENCIAIS - LIMPEZA DE TOKEN

## 🧹 **MÉTODO 1: Limpeza via Console (Recomendado)**

### No terminal do Expo, execute:
```bash
# Pare o servidor Expo (Ctrl+C)
# Depois reinicie com cache limpo
npx expo start --clear
```

## 🧹 **MÉTODO 2: Limpeza Manual do AsyncStorage**

### Adicione temporariamente ao HomeScreen.tsx:
```typescript
// ⚠️ APENAS PARA DEBUG - REMOVER DEPOIS
import { clearAllStorage } from '../utils/storageDebug';

// No componente, adicione um botão temporário:
<Button onPress={clearAllStorage} mode="outlined">
  🧹 LIMPAR STORAGE (DEBUG)
</Button>
```

## 🎯 **MÉTODO 3: Reset Completo do App**

### Reinicie completamente:
1. Feche o app no simulador
2. Pare o Expo (Ctrl+C)
3. Execute: `npx expo start --clear`
4. Reabra o app

---

## 📱 **CONFIGURAÇÃO iOS ONLY**

Para evitar tentativas de abrir Android, adicione ao `app.json`:

```json
{
  "expo": {
    "platforms": ["ios", "web"]
  }
}
```

---

## ✅ **EXECUTE AGORA:**

1. **Pare o Expo** (Ctrl+C no terminal)
2. **Reinicie com cache limpo**: `npx expo start --clear`
3. **Teste o login novamente**

O erro de token corrompido deve desaparecer!
