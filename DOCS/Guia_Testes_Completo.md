# 🧪 Guia Completo de Testes - Automazo

## 🎯 Objetivo
Testar todas as funcionalidades do sistema Automazo com backend em produção no Railway.

**Backend de Produção:** `https://automazo-production.up.railway.app`

---

## 📝 CPFs Válidos para Testes

Use estes CPFs válidos durante os testes:
- `11144477735` - CPF principal para testes
- `12345678909` - CPF alternativo 1
- `98765432100` - CPF alternativo 2
- `11122233396` - CPF alternativo 3

⚠️ **Importante:** 
- **CPF:** Sempre use CPFs válidos (11 dígitos) que passem na validação
- **CNPJ:** Use CNPJs válidos (14 dígitos) para empresas
- **Senha:** Deve ter pelo menos 8 caracteres, incluindo: maiúscula, minúscula, número e caractere especial
- **Telefone:** Use formato `(XX) XXXXX-XXXX`

---

## 📱 Parte 1: Testes do Frontend Mobile

### 🚀 1.1 Iniciando o App Mobile

1. **Abrir terminal no diretório do projeto:**
   ```bash
   cd /Users/alanribeiro/GitHub/CarRepair/frontend-mobile
   npm start
   ```

2. **Verificar que o .env está configurado:**
   ```
   EXPO_PUBLIC_API_URL=https://automazo-production.up.railway.app/api
   EXPO_PUBLIC_ENV=production
   ```

3. **Opções para teste:**
   - **Expo Go (iOS/Android):** Escanear QR code no app Expo Go
   - **Simulador iOS:** Pressionar `i` no terminal
   - **Emulador Android:** Pressionar `a` no terminal
   - **Web:** Pressionar `w` no terminal

### 🔐 1.2 Testando Autenticação

#### Teste de Registro:
1. **Na tela inicial, tocar em "Criar Conta"**
2. **Preencher formulário:**
   - Nome: `Teste User`
   - Email: `teste.novo@automazo.com`
   - Telefone: `(11) 99988-7766` (formato obrigatório)
   - CPF: `11144477735` (CPF válido para testes)
   - Senha: `Senha123!` (deve ter maiúscula, minúscula, número e símbolo)
   - Confirmar senha: `Senha123!`
   - Perfil: Selecionar "Cliente"

3. **Verificar:**
   - ✅ Formulário aceita dados válidos
   - ✅ Validação de CPF funciona
   - ✅ Confirmação de senha funciona
   - ✅ API retorna resposta (sucesso ou erro)
   - ✅ Navegação após registro

#### Teste de Login:
1. **Usar credenciais registradas ou criar uma conta**
2. **Preencher formulário de login:**
   - Email: `teste.novo@automazo.com`
   - Senha: `Senha123!`

3. **Verificar:**
   - ✅ Login é aceito
   - ✅ Token é armazenado
   - ✅ Navegação para dashboard principal
   - ✅ Estado de autenticação persiste

### 🚗 1.3 Testando Funcionalidades de Veículos

#### Adicionar Veículo:
1. **Navegar para a tela de veículos**
2. **Tocar no botão "+"**
3. **Preencher dados:**
   - Marca: Selecionar da lista
   - Modelo: Selecionar da lista
   - Ano: `2020`
   - Placa: `ABC1234`
   - VIN (opcional): `1HGBH41JXMN109186`

4. **Verificar:**
   - ✅ Lista de marcas carrega da API
   - ✅ Lista de modelos filtra por marca
   - ✅ Validação de placa funciona
   - ✅ Veículo é criado e aparece na lista

#### Editar Veículo:
1. **Tocar em um veículo da lista**
2. **Tocar no botão "Editar"**
3. **Alterar dados e salvar**

4. **Verificar:**
   - ✅ Dados são pré-preenchidos
   - ✅ Alterações são salvas
   - ✅ Lista é atualizada

### 🔧 1.4 Testando Manutenções

#### Adicionar Manutenção:
1. **Navegar para manutenções**
2. **Tocar no botão "+"**
3. **Preencher:**
   - Veículo: Selecionar da lista
   - Oficina: Selecionar da lista
   - Tipo: "Troca de óleo"
   - Descrição: "Troca de óleo 5W30"
   - Data: Selecionar data
   - Quilometragem: `50000`
   - Valor: `R$ 150,00`

4. **Verificar:**
   - ✅ Listas carregam corretamente
   - ✅ Validações funcionam
   - ✅ Manutenção é criada

### 🏪 1.5 Testando Oficinas

#### Listar Oficinas:
1. **Navegar para oficinas**
2. **Verificar lista de oficinas**

#### Adicionar Oficina (se houver permissão):
1. **Tocar no botão "+"**
2. **Preencher dados completos**
3. **Salvar e verificar**

### 👥 1.6 Testando Usuários

#### Listar Usuários:
1. **Navegar para usuários**
2. **Verificar lista baseada no perfil**

### 🔔 1.7 Testando Notificações

1. **Verificar ícone de notificações**
2. **Tocar para ver lista**
3. **Verificar se notificações carregam**

---

## 🌐 Parte 2: Testes do Frontend Web

### 🚀 2.1 Iniciando o App Web

1. **Abrir terminal:**
   ```bash
   cd /Users/alanribeiro/GitHub/CarRepair/frontend-web
   npm run dev
   ```

2. **Abrir navegador em:** `http://localhost:5173`

3. **Verificar que o proxy está funcionando:**
   - Abrir DevTools (F12)
   - Verificar se requests para `/api/*` são redirecionados

### 🔍 2.2 Testando Interface Web

#### Dashboard Principal:
1. **Verificar componentes principais:**
   - ✅ Estatísticas gerais
   - ✅ Gráficos (se houver)
   - ✅ Navegação lateral

#### Gestão de Veículos:
1. **Navegar para seção de veículos**
2. **Verificar:**
   - ✅ Lista carrega da API
   - ✅ Filtros funcionam
   - ✅ Paginação (se houver)
   - ✅ CRUD completo

#### Gestão de Manutenções:
1. **Navegar para manutenções**
2. **Testar todas as operações**

#### Gestão de Oficinas:
1. **Navegar para oficinas**
2. **Testar funcionalidades**

#### Gestão de Usuários:
1. **Navegar para usuários**
2. **Verificar permissões de acesso**

---

## 🔍 Parte 3: Testes de API Backend

### 🏥 3.1 Health Check

```bash
curl -s https://automazo-production.up.railway.app/health
```

**Esperado:** Status 200 com informações do sistema

### 🔐 3.2 Autenticação

#### Registrar usuário:
```bash
curl -X POST https://automazo-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste API",
    "email": "api@teste.com",
    "phone": "(11) 99988-7766",
    "document": "11144477735",
    "password": "Senha123!",
    "confirmPassword": "Senha123!"
  }'
```

#### Login:
```bash
curl -X POST https://automazo-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@teste.com",
    "password": "Senha123!"
  }'
```

### 🚗 3.3 Veículos

#### Listar marcas:
```bash
curl -s https://automazo-production.up.railway.app/api/vehicles/brands
```

#### Listar modelos por marca:
```bash
curl -s "https://automazo-production.up.railway.app/api/vehicles/models?brandId=1"
```

---

## 📋 Checklist de Testes

### ✅ Frontend Mobile:
- [ ] App inicia sem erros
- [ ] Splash screen carrega
- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Listagem de veículos funciona
- [ ] Adição de veículo funciona
- [ ] Edição de veículo funciona
- [ ] Listagem de manutenções funciona
- [ ] Adição de manutenção funciona
- [ ] Listagem de oficinas funciona
- [ ] Listagem de usuários funciona
- [ ] Notificações funcionam
- [ ] Logout funciona
- [ ] Navegação entre telas funciona

### ✅ Frontend Web:
- [ ] App carrega no navegador
- [ ] Dashboard principal funciona
- [ ] Proxy da API funciona
- [ ] CRUD de veículos funciona
- [ ] CRUD de manutenções funciona
- [ ] CRUD de oficinas funciona
- [ ] Gestão de usuários funciona
- [ ] Interface responsiva

### ✅ Backend:
- [ ] Health check responde
- [ ] Autenticação funciona
- [ ] Endpoints de veículos funcionam
- [ ] Endpoints de manutenções funcionam
- [ ] Endpoints de oficinas funcionam
- [ ] Endpoints de usuários funcionam
- [ ] Upload de arquivos funciona
- [ ] Validações funcionam

---

## 🐛 Possíveis Problemas e Soluções

### Frontend Mobile:
- **Erro de rede:** Verificar se .env está correto
- **App não carrega:** Limpar cache do Expo
- **API não responde:** Verificar conectividade

### Problemas de Validação:

#### ❌ "CPF ou CNPJ inválido"
**Causa:** CPF/CNPJ não passa na validação matemática
**Solução:** Use apenas CPFs/CNPJs válidos da lista de testes
- ✅ `11144477735` 
- ✅ `12345678909`
- ✅ `98765432100`

#### ❌ "Password must contain..."
**Causa:** Senha não atende aos critérios de segurança
**Solução:** Use senha forte:
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 maiúscula (A-Z)
- ✅ Pelo menos 1 minúscula (a-z)
- ✅ Pelo menos 1 número (0-9)
- ✅ Pelo menos 1 caractere especial (!@#$%^&*)
- ✅ Exemplo: `Senha123!`

#### ❌ "Phone must be in format..."
**Causa:** Formato de telefone incorreto
**Solução:** Use formato: `(XX) XXXXX-XXXX`
- ✅ Exemplo: `(11) 99988-7766`

#### ❌ "Email already exists"
**Causa:** Email já foi registrado
**Solução:** Use email diferente ou delete usuário existente

### Problemas de Rede (Dispositivo Físico):

#### ❌ "Network Error" em dispositivos físicos
**Causa:** Configuração de ambiente ou conectividade
**Soluções:**

1. **Verificar variáveis de ambiente:**
   - Confirme que `.env` tem `EXPO_PUBLIC_ENV=production`
   - Reinicie o Expo: `npm start` (força reload do .env)

2. **Recarregar app no dispositivo:**
   - No Expo Go: Feche e abra o app novamente
   - Ou: Sacuda o dispositivo → "Reload"

3. **Verificar conectividade:**
   - Teste se o dispositivo acessa a internet
   - Teste: `https://automazo-production.up.railway.app/health` no navegador móvel

4. **Limpar cache:**
   - No Expo Go: Settings → Clear cache
   - Ou reinstalar o app Expo Go

5. **Certificado SSL:**
   - Alguns dispositivos podem ter problemas com certificados
   - Teste em diferentes redes (WiFi/4G)

**URLs para testar diretamente no navegador móvel:**
- Health: `https://automazo-production.up.railway.app/health`
- API Base: `https://automazo-production.up.railway.app/api`

### Frontend Web:
- **Proxy não funciona:** Verificar vite.config.ts
- **CORS errors:** Verificar configurações do backend

### Backend:
- **500 errors:** Verificar logs no Railway
- **Database errors:** Verificar conexão Prisma

---

## 📊 Relatório de Testes

Após concluir os testes, documentar:

1. **Funcionalidades que funcionam ✅**
2. **Problemas encontrados ❌**
3. **Sugestões de melhorias 💡**
4. **Performance observada ⚡**
