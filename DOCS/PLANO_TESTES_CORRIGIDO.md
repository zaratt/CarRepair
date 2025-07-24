# 🧪 PLANO DE TESTES COMPLETO - FASE 1 AUTHENTICATION

## 📊 STATUS ATUAL CONFIRMADO

### ✅ **CORRIGIDO:**
- ✅ Senhas dos usuários existentes atualizadas para bcrypt hash correto
- ✅ Usuários de teste prontos: joao.silva@email.com / maria.santos@oficina.com
- ✅ Senha padrão: `password123`

### ⚠️ **DADOS DE TESTE CORRETOS:**
- ❌ **CPF INVÁLIDO**: `12345678901` (rejeitado corretamente pelo algoritmo)
- ✅ **CPF VÁLIDO**: `11144477735` (usar este para registros)

---

## 🎯 **TESTE 1: LOGIN DE USUÁRIO EXISTENTE**

### Dados para Login:
```
Email: joao.silva@email.com
Senha: password123
```

### Resultado Esperado:
- ✅ Login com sucesso
- ✅ JWT token armazenado no AsyncStorage
- ✅ Redirecionamento para HomeScreen
- ✅ Estado de autenticação = true

---

## 🎯 **TESTE 2: LOGIN COM CREDENCIAIS INVÁLIDAS**

### Cenário A - Email Inválido:
```
Email: inexistente@test.com
Senha: password123
```

### Cenário B - Senha Inválida:
```
Email: joao.silva@email.com
Senha: senhaerrada
```

### Resultado Esperado:
- ❌ Login rejeitado
- ❌ Mensagem de erro exibida
- ❌ Usuário permanece na LoginScreen

---

## 🎯 **TESTE 3: REGISTRO DE NOVO USUÁRIO**

### Dados CORRETOS para Registro:
```
Nome Completo: Alan Ribeiro
Email: alan.teste@email.com
CPF: 11144477735  ⭐️ (CPF VÁLIDO)
Telefone: (11) 99999-8888
Senha: minhasenha123
Confirmar Senha: minhasenha123
```

### Validações que devem PASSAR:
- ✅ Nome: mínimo 2 caracteres
- ✅ Email: formato válido
- ✅ CPF: `11144477735` é válido
- ✅ Telefone: formato brasileiro
- ✅ Senha: mínimo 8 caracteres
- ✅ Confirmação: senhas iguais

### Resultado Esperado:
- ✅ Usuário criado com sucesso
- ✅ Login automático após registro
- ✅ Redirecionamento para HomeScreen

---

## 🎯 **TESTE 4: VALIDAÇÕES DE REGISTRO**

### Cenário A - CPF INVÁLIDO (erro esperado):
```
CPF: 12345678901  ⚠️ (este é inválido mesmo)
```
**Resultado:** ❌ "CPF inválido" (correto!)

### Cenário B - Email já existente:
```
Email: joao.silva@email.com  (já existe)
```
**Resultado:** ❌ "Email já cadastrado"

### Cenário C - Senhas diferentes:
```
Senha: teste123
Confirmar: teste456
```
**Resultado:** ❌ "Senhas não coincidem"

---

## 🎯 **TESTE 5: NAVEGAÇÃO E LOGOUT**

### Teste Logout:
1. Fazer login com usuário válido
2. Acessar HomeScreen
3. Clicar em Logout
4. Verificar redirecionamento para LoginScreen

### Resultado Esperado:
- ✅ Token removido do AsyncStorage
- ✅ Estado de autenticação = false
- ✅ Volta para LoginScreen

---

## 🎯 **TESTE 6: PERSISTÊNCIA DE SESSÃO**

### Teste de Persistência:
1. Fazer login com sucesso
2. Fechar app completamente
3. Reabrir app
4. Verificar se usuário continua logado

### Resultado Esperado:
- ✅ Usuário automaticamente autenticado
- ✅ Vai direto para HomeScreen
- ✅ Token válido recuperado do AsyncStorage

---

## 📱 **INSTRUÇÕES DE EXECUÇÃO**

### Passo 1: Iniciar Backend
```bash
cd backend
npm run dev
```

### Passo 2: Iniciar Frontend Mobile
```bash
cd frontend-mobile
npx expo start
```

### Passo 3: Executar Testes na Ordem
1. **TESTE 1** primeiro (login básico)
2. **TESTE 2** (credenciais inválidas)  
3. **TESTE 3** (registro novo usuário)
4. **TESTE 4** (validações)
5. **TESTE 5** (logout)
6. **TESTE 6** (persistência)

---

## 🚨 **DADOS IMPORTANTES PARA COPIAR**

### Usuários Existentes (senhas corrigidas):
```
joao.silva@email.com / password123
maria.santos@oficina.com / password123
```

### Dados para Novo Registro:
```
Nome: Alan Ribeiro
Email: alan.teste@email.com
CPF: 11144477735
Telefone: (11) 99999-8888
Senha: minhasenha123
```

---

## ✅ **CHECKLIST FINAL**
- [ ] Backend rodando na porta 3000
- [ ] Frontend mobile conectado
- [ ] Banco de dados conectado
- [ ] Usuários de teste confirmados
- [ ] CPF válido identificado: `11144477735`

**🎯 PRONTO PARA EXECUTAR OS TESTES!**
