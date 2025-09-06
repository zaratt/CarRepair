# 📱 Plano Completo EAS Build - Automazo App

## 🎯 Objetivo
Preparar o app mobile Automazo para distribuição em produção nas lojas de aplicativos (App Store e Google Play).

---

## 📋 Pré-requisitos

### 1. Contas Necessárias
- [ ] **Expo Account** - Já configurada
- [ ] **Apple Developer Account** ($99/ano) - Para iOS
- [ ] **Google Play Console** ($25 taxa única) - Para Android

### 2. Configurações do Projeto
- [ ] Backend em produção ✅ - `https://automazo-production.up.railway.app`
- [ ] Frontend mobile configurado ✅
- [ ] Certificados de assinatura (será criado pelo EAS)

---

## 🔧 Parte 1: Configuração Inicial do EAS

### 1.1 Instalação do EAS CLI

```bash
# Instalar EAS CLI globalmente
npm install -g @expo/eas-cli

# Fazer login na conta Expo
eas login

# Verificar se está logado
eas whoami
```

### 1.2 Configuração do Projeto

```bash
# Navegar para o diretório do projeto
cd /Users/alanribeiro/GitHub/CarRepair/frontend-mobile

# Inicializar configuração EAS
eas build:configure
```

**Isso criará:**
- `eas.json` - Configurações de build
- Configurará o projeto no Expo

---

## 📄 Parte 2: Configuração do app.json

### 2.1 Verificar Configurações Atuais

O arquivo `app.json` deve conter:

```json
{
  "expo": {
    "name": "Automazo",
    "slug": "automazo-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F7C910"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.automazo.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F7C910"
      },
      "package": "com.automazo.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "SERÁ_GERADO_AUTOMATICAMENTE"
      }
    }
  }
}
```

### 2.2 Configurações Essenciais para Produção

```json
{
  "expo": {
    "name": "Automazo",
    "slug": "automazo-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F7C910"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.automazo.app",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleDisplayName": "Automazo",
        "NSCameraUsageDescription": "Este app precisa acessar a câmera para fotografar veículos e documentos.",
        "NSPhotoLibraryUsageDescription": "Este app precisa acessar a galeria para selecionar fotos de veículos."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F7C910"
      },
      "package": "com.automazo.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Este app precisa acessar suas fotos para upload de imagens de veículos."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "SERÁ_GERADO"
      }
    }
  }
}
```

---

## ⚙️ Parte 3: Configuração do eas.json

### 3.1 Configuração Padrão

Após executar `eas build:configure`, o arquivo `eas.json` será criado:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://automazo-production.up.railway.app/api",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.2 Configuração Avançada

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000/api",
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://automazo-production.up.railway.app/api",
        "EXPO_PUBLIC_ENV": "preview"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://automazo-production.up.railway.app/api",
        "EXPO_PUBLIC_ENV": "production"
      },
      "ios": {
        "buildNumber": "1.0.0"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "SEU_APPLE_ID@email.com",
        "ascAppId": "SERÁ_GERADO_APÓS_CRIAR_APP_NO_APP_STORE_CONNECT",
        "appleTeamId": "SEU_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 🏗️ Parte 4: Processo de Build

### 4.1 Build de Desenvolvimento

```bash
# Build para desenvolvimento (teste interno)
eas build --platform all --profile development

# Ou separadamente:
eas build --platform ios --profile development
eas build --platform android --profile development
```

### 4.2 Build de Preview

```bash
# Build para preview (teste antes da produção)
eas build --platform all --profile preview
```

### 4.3 Build de Produção

```bash
# Build final para as lojas
eas build --platform all --profile production

# Ou separadamente:
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## 📱 Parte 5: Configurações Específicas por Plataforma

### 5.1 iOS (App Store)

#### Pré-requisitos:
- [ ] Apple Developer Account ($99/ano)
- [ ] App criado no App Store Connect
- [ ] Bundle Identifier único: `com.automazo.app`

#### Configurações app.json:
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.automazo.app",
  "buildNumber": "1",
  "infoPlist": {
    "CFBundleDisplayName": "Automazo",
    "NSCameraUsageDescription": "Para fotografar veículos e documentos",
    "NSPhotoLibraryUsageDescription": "Para selecionar fotos da galeria"
  }
}
```

#### Comandos:
```bash
# Build iOS
eas build --platform ios --profile production

# Submit para App Store
eas submit --platform ios
```

### 5.2 Android (Google Play)

#### Pré-requisitos:
- [ ] Google Play Console Account ($25)
- [ ] App criado no Google Play Console
- [ ] Package name único: `com.automazo.app`

#### Configurações app.json:
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#F7C910"
  },
  "package": "com.automazo.app",
  "versionCode": 1,
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE"
  ]
}
```

#### Comandos:
```bash
# Build Android
eas build --platform android --profile production

# Submit para Google Play
eas submit --platform android
```

---

## 🎨 Parte 6: Assets e Ícones

### 6.1 Requisitos de Imagens

#### Ícone Principal (icon.png):
- **Tamanho:** 1024x1024px
- **Formato:** PNG
- **Fundo:** Transparente ou sólido
- **Atual:** `./assets/icon.png`

#### Splash Screen:
- **Tamanho:** Variável (recomendado: 1242x2436px)
- **Formato:** PNG
- **Fundo:** #F7C910 (amarelo Automazo)
- **Atual:** `./assets/splash-icon.png`

#### Adaptive Icon (Android):
- **Tamanho:** 1024x1024px
- **Formato:** PNG
- **Fundo transparente:** Para foreground
- **Atual:** `./assets/adaptive-icon.png`

### 6.2 Verificação dos Assets

```bash
# Verificar se os assets existem
ls -la /Users/alanribeiro/GitHub/CarRepair/frontend-mobile/assets/
```

---

## 🔒 Parte 7: Certificados e Assinatura

### 7.1 iOS Certificates

O EAS automaticamente:
- Cria certificados de desenvolvimento
- Cria certificados de distribuição
- Gerencia provisioning profiles
- Configura no Apple Developer Portal

### 7.2 Android Keystores

O EAS automaticamente:
- Cria keystore para assinatura
- Gerencia chaves de upload
- Configura no Google Play Console

### 7.3 Comandos para Gerenciar Certificados

```bash
# Listar certificados
eas credentials

# Configurar manualmente (se necessário)
eas credentials:configure

# Sincronizar com Apple/Google
eas credentials:sync
```

---

## 🚀 Parte 8: Cronograma de Execução

### Fase 1: Preparação (1-2 dias)
1. [ ] Verificar e ajustar app.json
2. [ ] Verificar assets (ícones, splash)
3. [ ] Configurar contas (Apple/Google)
4. [ ] Instalar EAS CLI
5. [ ] Configurar eas.json

### Fase 2: Build de Desenvolvimento (1 dia)
1. [ ] Build development profile
2. [ ] Teste em dispositivos
3. [ ] Correções necessárias

### Fase 3: Build de Preview (1 dia)
1. [ ] Build preview profile
2. [ ] Testes finais
3. [ ] Validações

### Fase 4: Build de Produção (1-2 dias)
1. [ ] Build production profile
2. [ ] Submit para lojas
3. [ ] Configurar metadata das lojas

### Fase 5: Publicação (3-7 dias)
1. [ ] Review da Apple (2-7 dias)
2. [ ] Review do Google (1-3 dias)
3. [ ] Publicação nas lojas

---

## 📋 Checklist Final

### Antes do Build:
- [ ] Backend em produção funcionando
- [ ] Todas as funcionalidades testadas
- [ ] Assets preparados (ícones, splash)
- [ ] app.json configurado
- [ ] .env configurado para produção
- [ ] Contas Apple/Google criadas

### Durante o Build:
- [ ] EAS CLI instalado e logado
- [ ] eas.json configurado
- [ ] Build development executado
- [ ] Build preview executado
- [ ] Testes realizados

### Após o Build:
- [ ] Apps criados nas lojas
- [ ] Metadata configurada
- [ ] Screenshots preparadas
- [ ] Descrições escritas
- [ ] Submit realizado

---

## 🛠️ Comandos Resumidos

```bash
# Preparação
npm install -g @expo/eas-cli
eas login
cd /Users/alanribeiro/GitHub/CarRepair/frontend-mobile

# Configuração inicial
eas build:configure

# Builds
eas build --platform all --profile development
eas build --platform all --profile preview
eas build --platform all --profile production

# Submit
eas submit --platform ios
eas submit --platform android

# Gerenciamento
eas credentials
eas build:list
eas submit:list
```

---

## 📊 Estimativas

### Tempo Total: 5-10 dias
- Preparação: 1-2 dias
- Builds e testes: 2-3 dias
- Submit e review: 3-7 dias

### Custos:
- Apple Developer: $99/ano
- Google Play: $25 (única vez)
- EAS Build: Gratuito (limite mensal)

---

## 🆘 Solução de Problemas

### Problemas Comuns:
1. **Build falha:** Verificar logs com `eas build:list`
2. **Certificados:** Usar `eas credentials`
3. **Assets inválidos:** Verificar tamanhos e formatos
4. **API não funciona:** Verificar variáveis de ambiente

### Recursos:
- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Forums](https://forums.expo.dev/)
- [Discord Expo](https://chat.expo.dev/)

---

✅ **Plano completo preparado! Ready para executar quando necessário.**
