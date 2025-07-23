# 🚀 TESTE DE AUTENTICAÇÃO - ENDPOINTS

## 📋 Endpoints Implementados

### ✅ 1. Registro de Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "password": "MinhaSenh@123",
    "confirmPassword": "MinhaSenh@123",
    "document": "12345678901",
    "phone": "(11) 99999-9999",
    "city": "São Paulo",
    "state": "SP"
  }'
```

### ✅ 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "password": "MinhaSenh@123"
  }'
```

### ✅ 3. Perfil do Usuário (requires token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### ✅ 4. Alterar Senha (requires token)
```bash
curl -X PUT http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "currentPassword": "MinhaSenh@123",
    "newPassword": "NovaSenha@456",
    "confirmNewPassword": "NovaSenha@456"
  }'
```

## 🔐 Validações de Senha Implementadas

- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula  
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial
- ✅ Confirmação de senha obrigatória

## 🛡️ Recursos de Segurança

- ✅ **Hash bcrypt** com salt rounds 12
- ✅ **Rate limiting** para tentativas de login
- ✅ **JWT tokens** com refresh token
- ✅ **Validação de CPF/CNPJ** integrada
- ✅ **Sanitização de dados** na resposta

## 📊 Exemplo de Resposta (Login)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "João Silva",
      "email": "joao@teste.com",
      "type": "user",
      "profile": "car_owner",
      "phone": "(11) 99999-9999",
      "city": "São Paulo",
      "state": "SP",
      "isValidated": true,
      "createdAt": "2025-01-22T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

## ⚠️ Para Usuários Existentes

Execute o script SQL para adicionar senhas aos usuários existentes:
```sql
-- Senha padrão: TempPass123!
UPDATE "User" SET password = '$2b$12$LQv3c1yqBwEHxPxeRpP31.s/qN36eKxmQQPa1KbV0I0rKFI/qXX6K' 
WHERE password IS NULL;
```
