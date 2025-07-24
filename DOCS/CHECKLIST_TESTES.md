# 🧪 CHECKLIST DE TESTES - PRONTO PARA EXECUÇÃO

## ✅ SERVIÇOS ATIVOS
- ✅ Backend: http://localhost:3000
- ✅ Frontend Mobile: Expo rodando
- ✅ Banco de dados conectado
- ✅ Senhas corrigidas

---

## 🎯 TESTE 1: LOGIN USUÁRIO EXISTENTE

### 📱 No app mobile:
1. Abrir tela de Login
2. Inserir dados:
   ```
   Email: joao.silva@email.com
   Senha: password123
   ```
3. Clicar em "Entrar"

### ✅ Resultado Esperado:
- Login com sucesso
- Redirecionamento para HomeScreen
- Token salvo no AsyncStorage

---

## 🎯 TESTE 2: LOGIN COM CREDENCIAIS INVÁLIDAS

### 📱 Testar email inexistente:
```
Email: inexistente@test.com
Senha: password123
```

### 📱 Testar senha incorreta:
```
Email: joao.silva@email.com
Senha: senhaerrada
```

### ✅ Resultado Esperado:
- Erro de autenticação
- Mensagem de erro exibida
- Permanece na LoginScreen

---

## 🎯 TESTE 3: REGISTRO NOVO USUÁRIO

### 📱 Na tela de registro, inserir:
```
Nome Completo: Alan Ribeiro
Email: alan.teste@email.com
CPF: 11144477735  ⭐️ (válido)
Telefone: (11) 99999-8888
Senha: minhasenha123
Confirmar Senha: minhasenha123
```

### ✅ Resultado Esperado:
- Usuário criado com sucesso
- Login automático
- Redirecionamento para HomeScreen

---

## 🎯 TESTE 4: VALIDAÇÕES

### 📱 Testar CPF inválido:
```
CPF: 12345678901  (deve rejeitar)
```

### 📱 Testar email já existente:
```
Email: joao.silva@email.com  (deve rejeitar)
```

### ✅ Resultado Esperado:
- Mensagens de erro apropriadas
- Formulário não submete

---

## 🎯 TESTE 5: LOGOUT E PERSISTÊNCIA

### 📱 Após login bem-sucedido:
1. Fazer logout
2. Fechar app completamente
3. Reabrir app
4. Verificar se volta para login

---

## 🚀 INSTRUÇÕES DE EXECUÇÃO

1. **Conecte seu dispositivo** ao Expo (escaneie QR code)
2. **Execute os testes na ordem** (1 → 2 → 3 → 4 → 5)
3. **Reporte qualquer erro** que encontrar
4. **Anote o comportamento** de cada teste

---

## 📊 DADOS PARA COPIAR/COLAR

### Usuários Existentes:
```
joao.silva@email.com / password123
maria.santos@oficina.com / password123
```

### Novo Usuário (Teste 3):
```
Nome: Alan Ribeiro
Email: alan.teste@email.com
CPF: 11144477735
Telefone: (11) 99999-8888
Senha: minhasenha123
```

**🎯 INICIE COM TESTE 1 - LOGIN BÁSICO!**
