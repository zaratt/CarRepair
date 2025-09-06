# CarRepair (App name - Automazo)

Sistema completo para gestão de oficinas, manutenções e experiência do dono do carro.

## Visão Geral
O CarRepair é uma plataforma que conecta oficinas e donos de veículos, permitindo:
- Gestão de manutenções e histórico
- Avaliação de oficinas (rating + feedback estruturado)
- Favoritar oficinas
- Upload de vistorias e orçamentos
- Experiência mobile e web

## Stack Principal
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend Web:** React, TypeScript, Vite
- **Frontend Mobile:** React Native (Expo), React Native Paper, @kolking/react-native-rating
- **Outros:** Docker, ESLint, Nginx (web)

## Como rodar o projeto

### 1. Clonar o repositório
```bash
git clone <repo-url>
cd CarRepair
```

### 2. Instalar dependências
#### Backend
```bash
cd backend
npm install
```
#### Frontend Web
```bash
cd ../frontend-web
npm install
```
#### Frontend Mobile
```bash
cd ../frontend-mobile
npm install
```

### 3. Configurar o banco de dados
- Configure o `.env` do backend com a string de conexão do PostgreSQL
- Rode as migrações:
```bash
cd backend
npx prisma migrate dev
```

### 4. Rodar os serviços
- Backend:
```bash
cd backend
npm run dev
```
- Frontend Web:
```bash
cd ../frontend-web
npm run dev
```
- Frontend Mobile (Expo):
```bash
cd ../frontend-mobile
npx expo start
```

## Funcionalidades Principais
- Cadastro e login de usuários (oficina e dono do carro)
- Gestão de carros, manutenções e vistorias
- Avaliação de oficinas (estrelas + chips de feedback)
- Favoritar/desfavoritar oficinas (com feedback visual)
- Upload de arquivos (PDF, imagens)
- Histórico de manutenções e aprovações

## Documentação
- [Doc_Expandido.md](./DOCS/Doc_Expandido.md): visão geral, fluxos, wireframes
- [Doc_Stack.md](./DOCS/Doc_Stack.md): stack detalhada
- [API.md](./DOCS/API.md): documentação dos endpoints

---

> Para detalhes de endpoints, payloads e exemplos, consulte o arquivo [API.md](./DOCS/API.md).
