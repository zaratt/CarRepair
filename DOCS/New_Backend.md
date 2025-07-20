# 🚀 **NEW BACKEND - REFATORAÇÃO COMPLETA**

**Data de Criação**: 19 de julho de 2025  
**Status**: 🔄 **EM IMPLEMENTAÇÃO**  
**Versão**: 2.0.0 - TypeScript + Modular + FIPE Integration

---

## 📋 **VISÃO GERAL DO PROJETO**

### **🎯 OBJETIVOS DA REFATORAÇÃO:**
- ✅ **Migração para TypeScript**: Type safety e melhor developer experience
- ✅ **Arquitetura Modular**: Separação por domínios de negócio
- ✅ **Integração FIPE**: API oficial para dados de veículos
- ✅ **Clean Code**: Práticas modernas de desenvolvimento
- ✅ **Correção de Bugs**: Resolver problemas de parsing e anexos
- ✅ **Docker Otimizado**: Containerização moderna

### **📊 ESTADO ATUAL:**
- ❌ **Backend Atual**: index.js monolítico com 1000+ linhas
- ❌ **Problemas Críticos**: Parsing de valores, upload de anexos, delete de manutenções
- ❌ **Tabelas Obsoletas**: Brand e Model serão substituídas pela API FIPE
- ✅ **Banco Limpo**: Todas as tabelas foram removidas, pronto para migração

---

## 📁 **NOVA ESTRUTURA DE PASTAS**

```
backend/
├── 📂 src/                          # Código TypeScript
│   ├── 📂 config/                   # Configurações
│   │   ├── database.ts              # Configuração Prisma
│   │   ├── cors.ts                  # Configuração CORS
│   │   ├── multer.ts                # Configuração upload de arquivos
│   │   └── fipe.ts                  # Configuração API FIPE
│   │
│   ├── 📂 types/                    # Tipos TypeScript
│   │   ├── express.d.ts             # Extensões do Express
│   │   ├── auth.ts                  # Interfaces de autenticação
│   │   ├── common.ts                # Tipos comuns
│   │   └── index.ts                 # Re-exports
│   │
│   ├── 📂 middleware/               # Middlewares
│   │   ├── auth.ts                  # Autenticação JWT
│   │   ├── validation.ts            # Validação de dados
│   │   ├── errorHandler.ts          # Tratamento de erros
│   │   ├── logger.ts                # Logging de requisições
│   │   └── rateLimit.ts             # Rate limiting
│   │
│   ├── 📂 utils/                    # Utilitários
│   │   ├── validators.ts            # Validadores de dados
│   │   ├── formatters.ts            # Formatação de dados (parseMonetaryValue, etc)
│   │   ├── generators.ts            # Geradores de código
│   │   ├── logger.ts                # Winston logger
│   │   ├── errors.ts                # Classes de erro customizadas
│   │   └── asyncHandler.ts          # Wrapper para async functions
│   │
│   ├── 📂 external/                 # Integrações externas
│   │   └── 📂 fipe/                 # API FIPE
│   │       ├── fipe.client.ts       # Cliente HTTP para FIPE
│   │       ├── fipe.service.ts      # Lógica de negócio FIPE
│   │       ├── fipe.controller.ts   # Controller FIPE
│   │       ├── fipe.routes.ts       # Rotas FIPE
│   │       ├── fipe.types.ts        # Interfaces FIPE
│   │       └── fipe.cache.ts        # Cache para API FIPE
│   │
│   ├── 📂 modules/                  # Módulos por domínio
│   │   │
│   │   ├── 📂 auth/                 # 🔐 AUTENTICAÇÃO
│   │   │   ├── auth.controller.ts   # Login, register, refresh
│   │   │   ├── auth.service.ts      # Lógica de autenticação
│   │   │   ├── auth.routes.ts       # Rotas de auth
│   │   │   ├── auth.types.ts        # Interfaces de auth
│   │   │   └── auth.validation.ts   # Validações específicas
│   │   │
│   │   ├── 📂 users/                # 👥 USUÁRIOS
│   │   │   ├── users.controller.ts  # CRUD de usuários
│   │   │   ├── users.service.ts     # Lógica de negócio
│   │   │   ├── users.routes.ts      # Rotas de usuários
│   │   │   ├── users.types.ts       # Interfaces de usuários
│   │   │   └── users.validation.ts  # Validações
│   │   │
│   │   ├── 📂 vehicles/             # 🚗 VEÍCULOS (COM FIPE)
│   │   │   ├── vehicles.controller.ts # CRUD de veículos
│   │   │   ├── vehicles.service.ts    # Integração com FIPE
│   │   │   ├── vehicles.routes.ts     # Rotas de veículos
│   │   │   ├── vehicles.types.ts      # Interfaces
│   │   │   └── vehicles.validation.ts # Validações FIPE
│   │   │
│   │   ├── 📂 maintenances/         # 🔧 MANUTENÇÕES (CORRIGIDO)
│   │   │   ├── maintenances.controller.ts # CRUD manutenções
│   │   │   ├── maintenances.service.ts    # Lógica + parsing corrigido
│   │   │   ├── maintenances.routes.ts     # Rotas
│   │   │   ├── maintenances.types.ts      # Interfaces
│   │   │   ├── maintenances.validation.ts # Validações
│   │   │   └── 📂 attachments/            # Sub-módulo anexos
│   │   │       ├── attachments.controller.ts # Upload/download
│   │   │       ├── attachments.service.ts    # Lógica de arquivos
│   │   │       └── attachments.routes.ts     # Rotas de anexos
│   │   │
│   │   ├── 📂 inspections/          # 🔍 VISTORIAS
│   │   │   ├── inspections.controller.ts # CRUD vistorias
│   │   │   ├── inspections.service.ts    # Lógica de negócio
│   │   │   ├── inspections.routes.ts     # Rotas
│   │   │   ├── inspections.types.ts      # Interfaces
│   │   │   └── inspections.validation.ts # Validações
│   │   │
│   │   └── 📂 workshops/            # 🏪 OFICINAS
│   │       ├── workshops.controller.ts # CRUD oficinas
│   │       ├── workshops.service.ts    # Lógica de negócio
│   │       ├── workshops.routes.ts     # Rotas
│   │       ├── workshops.types.ts      # Interfaces
│   │       └── workshops.validation.ts # Validações
│   │
│   ├── 📂 database/                 # Database utilities
│   │   ├── client.ts                # Prisma client singleton
│   │   └── migrations/              # Utilitários de migração
│   │
│   ├── 📂 cache/                    # Sistema de cache
│   │   ├── cache.interface.ts       # Interface comum
│   │   ├── memory.cache.ts          # Cache em memória
│   │   └── redis.cache.ts           # Cache Redis (futuro)
│   │
│   ├── 📄 app.ts                    # Configuração do Express
│   ├── 📄 server.ts                 # Inicialização do servidor
│   └── 📄 routes.ts                 # Agregador de rotas
│
├── 📂 prisma/                       # Prisma schema & migrations
│   ├── schema.prisma                # Schema atualizado com FIPE
│   └── migrations/                  # Migrações
│
├── 📂 uploads/                      # Armazenamento de arquivos
├── 📂 dist/                         # Build TypeScript (gerado)
├── 📄 package.json                  # Dependências + scripts
├── 📄 tsconfig.json                 # Configuração TypeScript
├── 📄 .env                          # Variáveis de ambiente
├── 📄 .env.example                  # Template de variáveis
├── 📄 Dockerfile                    # Container otimizado
├── 📄 docker-compose.yml            # Ambiente de desenvolvimento
└── 📄 .gitignore                    # Arquivos ignorados
```

---

## 🗃️ **NOVO SCHEMA PRISMA COM FIPE**

### **📊 Schema Atualizado:**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserType {
  cliente
  oficina
  admin
}

enum ServiceStatus {
  pendente
  em_andamento
  concluido
  cancelado
}

enum ValidationStatus {
  registrado
  validado
  rejeitado
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  phone     String?
  userType  UserType
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  vehicles     Vehicle[]
  workshops    Workshop[]
  maintenances Maintenance[]
  inspections  Inspection[]

  @@map("users")
}

model Vehicle {
  id        String   @id @default(cuid())
  userId    String
  
  // ✅ DADOS FIPE INTEGRADOS
  vehicleType     String  // "cars", "motorcycles", "trucks"
  brand           String  // "Honda" (nome oficial FIPE)
  model           String  // "Civic 1.6 16V" (nome oficial FIPE)
  year            Int     // 2023
  fuel            String  // "Gasolina", "Flex", "Diesel", etc.
  
  // ✅ DADOS FIPE PARA CONSULTAS FUTURAS
  fipeBrandValue  String  // "honda" (slug da API)
  fipeModelValue  String  // "civic-16-16v" (slug da API)  
  fipeYearValue   String  // "2023-1" (código da API)
  
  // ✅ DADOS DO USUÁRIO
  plate           String  @unique // "ABC-1234"
  color           String? // "Preto", "Branco", etc.
  
  // ✅ DADOS FIPE OPCIONAIS (para referência)
  fipePrice       String? // "R$ 95.000,00"
  fipeCode        String? // "001004-0"
  fipeMonth       String? // "Janeiro 2025"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  maintenances Maintenance[]
  inspections  Inspection[]

  @@map("vehicles")
}

model Workshop {
  id          String  @id @default(cuid())
  userId      String
  name        String
  description String?
  address     String
  phone       String?
  email       String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  maintenances Maintenance[]

  @@map("workshops")
}

model Maintenance {
  id               String           @id @default(cuid())
  vehicleId        String
  workshopId       String?
  userId           String
  date             DateTime
  description      String
  products         String?
  value            Float?           // ✅ CORRIGIDO: Float para valores monetários
  mileage          Int?             // ✅ CORRIGIDO: Int para quilometragem
  serviceStatus    ServiceStatus    @default(concluido)
  validationStatus ValidationStatus @default(registrado)
  validationCode   String           @unique
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relacionamentos
  vehicle     Vehicle                 @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  workshop    Workshop?               @relation(fields: [workshopId], references: [id], onDelete: SetNull)
  user        User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  attachments MaintenanceAttachment[]
  inspections Inspection[]

  @@map("maintenances")
}

model MaintenanceAttachment {
  id            String      @id @default(cuid())
  maintenanceId String
  filename      String
  originalName  String
  mimeType      String
  size          Int
  attachmentType String     // "nota_fiscal", "foto_servico", "garantia", etc.
  createdAt     DateTime    @default(now())

  // Relacionamentos
  maintenance Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@map("maintenance_attachments")
}

model Inspection {
  id               String           @id @default(cuid())
  vehicleId        String
  userId           String
  maintenanceId    String?          // Inspeção pode estar relacionada a uma manutenção
  date             DateTime
  description      String
  mileage          Int?
  inspectionType   String           // "preventiva", "pos_manutencao", "geral"
  status           String           @default("concluida") // "pendente", "concluida"
  observations     String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relacionamentos
  vehicle     Vehicle               @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user        User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  maintenance Maintenance?          @relation(fields: [maintenanceId], references: [id], onDelete: SetNull)
  attachments InspectionAttachment[]

  @@map("inspections")
}

model InspectionAttachment {
  id           String     @id @default(cuid())
  inspectionId String
  filename     String
  originalName String
  mimeType     String
  size         Int
  attachmentType String   // "foto_veiculo", "documento", "laudo", etc.
  createdAt    DateTime   @default(now())

  // Relacionamentos
  inspection Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)

  @@map("inspection_attachments")
}
```

### **🔄 MUDANÇAS PRINCIPAIS:**
- ❌ **Removidas**: Tabelas `Brand` e `Model` (substituídas pela API FIPE)
- ✅ **Vehicle**: Integração completa com dados FIPE
- ✅ **Maintenance**: Campos `value` e `mileage` corrigidos
- ✅ **Attachments**: Estrutura melhorada para uploads

---

## 📋 **PLANO DE IMPLEMENTAÇÃO EM FASES**

### **🎯 ESTRATÉGIA:**
- **Fases pequenas e incrementais** para validação constante
- **Commits funcionais** a cada fase completa
- **Testes manuais** antes de cada commit
- **Rollback fácil** se necessário

---

## 🔥 **FASE 1: SETUP BÁSICO E CONFIGURAÇÃO**
**Duração**: 2-3 horas  
**Objetivo**: Base TypeScript + Prisma + Estrutura de pastas

### **📋 Checklist Fase 1:**

#### **1.1 Configuração TypeScript (30 min)**
- [ ] Instalar dependências TypeScript
- [ ] Configurar `tsconfig.json`
- [ ] Configurar `package.json` com scripts
- [ ] Criar estrutura de pastas base

#### **1.2 Schema Prisma (30 min)**
- [ ] Atualizar `schema.prisma` com nova estrutura
- [ ] Aplicar migração inicial
- [ ] Verificar tabelas no pgAdmin

#### **1.3 Configurações Base (45 min)**
- [ ] `src/config/database.ts` - Cliente Prisma
- [ ] `src/config/cors.ts` - Configuração CORS
- [ ] `src/config/fipe.ts` - Configuração API FIPE
- [ ] `src/utils/logger.ts` - Sistema de logs

#### **1.4 Servidor Básico (45 min)**
- [ ] `src/app.ts` - Configuração Express
- [ ] `src/server.ts` - Inicialização
- [ ] Health check endpoint
- [ ] Middleware de logging

### **✅ Critérios de Validação Fase 1:**
```bash
# Testar servidor funcionando
npm run dev
curl http://localhost:3000/health
# Response: {"status": "ok", "version": "2.0.0"}

# Verificar banco conectado
# Logs devem mostrar: "✅ Database connected successfully"

# Verificar tabelas criadas no pgAdmin
# Deve ter: users, vehicles, workshops, maintenances, etc.
```

### **📦 Commit Fase 1:**
```bash
git add .
git commit -m "feat: setup básico TypeScript + Prisma + estrutura modular

- Configuração TypeScript completa
- Schema Prisma atualizado com integração FIPE  
- Estrutura de pastas modular
- Servidor básico funcionando
- Health check endpoint
- Sistema de logs configurado"
```

---

## 🔥 **FASE 2: UTILITÁRIOS E MIDDLEWARE**
**Duração**: 2-3 horas  
**Objetivo**: Funções auxiliares + middleware essencial

### **📋 Checklist Fase 2:**

#### **2.1 Utilitários Core (60 min)**
- [ ] `src/utils/formatters.ts` - parseMonetaryValue, parseKilometerValue (CORRIGIDOS)
- [ ] `src/utils/validators.ts` - Validadores customizados
- [ ] `src/utils/generators.ts` - Geradores de código
- [ ] `src/utils/errors.ts` - Classes de erro customizadas
- [ ] `src/utils/asyncHandler.ts` - Wrapper para async functions

#### **2.2 Middleware Sistema (60 min)**
- [ ] `src/middleware/errorHandler.ts` - Tratamento global de erros
- [ ] `src/middleware/validation.ts` - Validação de requests
- [ ] `src/middleware/logger.ts` - Logging de requisições
- [ ] `src/middleware/rateLimit.ts` - Rate limiting

#### **2.3 Sistema de Tipos (30 min)**
- [ ] `src/types/common.ts` - Tipos comuns
- [ ] `src/types/express.d.ts` - Extensões Express
- [ ] `src/types/index.ts` - Re-exports

### **✅ Critérios de Validação Fase 2:**
```bash
# Testar formatação de valores
curl -X POST http://localhost:3000/test/format -d '{"value": "R$ 550,00"}' -H "Content-Type: application/json"
# Response: {"formatted": 550}

# Testar tratamento de erros
curl http://localhost:3000/test/error
# Response: {"error": "Test error", "timestamp": "..."}

# Verificar rate limiting
# Múltiplas requisições rápidas devem retornar 429
```

### **📦 Commit Fase 2:**
```bash
git add .
git commit -m "feat: utilitários e middleware essenciais

- Formatters corrigidos (parseMonetaryValue, parseKilometerValue)
- Sistema de tratamento de erros global
- Middleware de validação e rate limiting
- Tipos TypeScript organizados
- Wrapper asyncHandler para controllers"
```

---

## 🔥 **FASE 3: INTEGRAÇÃO API FIPE**
**Duração**: 3-4 horas  
**Objetivo**: Cliente FIPE + cache + endpoints completos

### **📋 Checklist Fase 3:**

#### **3.1 Cliente FIPE (90 min)**
- [ ] `src/external/fipe/fipe.client.ts` - Cliente HTTP com retry
- [ ] `src/external/fipe/fipe.types.ts` - Interfaces da API
- [ ] `src/cache/cache.interface.ts` - Interface de cache
- [ ] `src/cache/memory.cache.ts` - Cache em memória

#### **3.2 Service FIPE (90 min)**
- [ ] `src/external/fipe/fipe.service.ts` - Lógica de negócio
- [ ] Busca de tipos (carros, motos, caminhões)
- [ ] Busca de marcas por tipo
- [ ] Busca de modelos por marca
- [ ] Busca de anos por modelo
- [ ] Sistema de cache inteligente

#### **3.3 API Endpoints (60 min)**
- [ ] `src/external/fipe/fipe.controller.ts` - Controllers
- [ ] `src/external/fipe/fipe.routes.ts` - Rotas
- [ ] Integração com app principal

### **✅ Critérios de Validação Fase 3:**
```bash
# Testar tipos de veículos
curl http://localhost:3000/api/fipe/types
# Response: [{"key": "cars", "name": "Carros"}, ...]

# Testar marcas de carros
curl http://localhost:3000/api/fipe/cars/brands
# Response: [{"name": "Honda", "value": "honda"}, ...]

# Testar modelos da Honda
curl http://localhost:3000/api/fipe/cars/brands/honda
# Response: [{"name": "CIVIC 1.6 16V", "value": "civic-16-16v"}, ...]

# Testar busca inteligente
curl "http://localhost:3000/api/fipe/search?q=civic&type=cars"
# Response: {"brands": [], "models": [...], "suggestions": [...]}
```

### **📦 Commit Fase 3:**
```bash
git add .
git commit -m "feat: integração completa com API FIPE v2

- Cliente HTTP FIPE com retry e cache
- Service com busca de tipos, marcas, modelos e anos
- Cache em memória com TTL configurável
- Endpoints RESTful para dados FIPE
- Busca inteligente com auto-complete
- Sistema de mapeamento de combustíveis"
```

---

## 🔥 **FASE 4: MÓDULO AUTH**
**Duração**: 2-3 horas  
**Objetivo**: Sistema de autenticação JWT completo

### **📋 Checklist Fase 4:**

#### **4.1 Service e Controller (90 min)**
- [ ] `src/modules/auth/auth.types.ts` - Interfaces de auth
- [ ] `src/modules/auth/auth.service.ts` - Lógica JWT + bcrypt
- [ ] `src/modules/auth/auth.controller.ts` - Login, register, refresh
- [ ] `src/modules/auth/auth.validation.ts` - Validações específicas

#### **4.2 Middleware Auth (60 min)**
- [ ] `src/middleware/auth.ts` - Verificação JWT
- [ ] Proteção de rotas
- [ ] Extração de usuário do token

#### **4.3 Rotas e Integração (30 min)**
- [ ] `src/modules/auth/auth.routes.ts` - Rotas de auth
- [ ] Integração com app principal

### **✅ Critérios de Validação Fase 4:**
```bash
# Testar registro
curl -X POST http://localhost:3000/api/auth/register -d '{"email": "test@test.com", "password": "123456", "name": "Test User"}' -H "Content-Type: application/json"
# Response: {"token": "...", "user": {...}}

# Testar login
curl -X POST http://localhost:3000/api/auth/login -d '{"email": "test@test.com", "password": "123456"}' -H "Content-Type: application/json"
# Response: {"token": "...", "user": {...}}

# Testar rota protegida
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/auth/profile
# Response: {"user": {...}}
```

### **📦 Commit Fase 4:**
```bash
git add .
git commit -m "feat: sistema de autenticação JWT completo

- Service de autenticação com bcrypt e JWT
- Controllers para login, register e refresh token
- Middleware de proteção de rotas
- Validações específicas para auth
- Tipos TypeScript para autenticação"
```

---

## 🔥 **FASE 5: MÓDULO USERS**
**Duração**: 2 horas  
**Objetivo**: CRUD completo de usuários

### **📋 Checklist Fase 5:**

#### **5.1 Service e Controller (75 min)**
- [ ] `src/modules/users/users.types.ts` - Interfaces
- [ ] `src/modules/users/users.service.ts` - CRUD + validações
- [ ] `src/modules/users/users.controller.ts` - Endpoints
- [ ] `src/modules/users/users.validation.ts` - Validações

#### **5.2 Rotas e Integração (45 min)**
- [ ] `src/modules/users/users.routes.ts` - Rotas CRUD
- [ ] Proteção com middleware auth
- [ ] Integração com app principal

### **✅ Critérios de Validação Fase 5:**
```bash
# Testar listagem de usuários (autenticado)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users
# Response: [{"id": "...", "name": "...", "email": "..."}, ...]

# Testar criação de usuário
curl -X POST -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users -d '{"name": "New User", "email": "new@test.com"}' -H "Content-Type: application/json"
# Response: {"id": "...", "name": "New User", ...}

# Testar busca por ID
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users/USER_ID
# Response: {"id": "USER_ID", "name": "...", ...}
```

### **📦 Commit Fase 5:**
```bash
git add .
git commit -m "feat: módulo de usuários completo

- CRUD completo de usuários
- Service com validações de negócio
- Controllers com tratamento de erros
- Rotas protegidas por autenticação
- Validações de entrada de dados"
```

---

## 🔥 **FASE 6: MÓDULO VEHICLES COM FIPE**
**Duração**: 3-4 horas  
**Objetivo**: CRUD de veículos integrado com FIPE

### **📋 Checklist Fase 6:**

#### **6.1 Service Vehicles (120 min)**
- [ ] `src/modules/vehicles/vehicles.types.ts` - Interfaces
- [ ] `src/modules/vehicles/vehicles.service.ts` - CRUD + FIPE
- [ ] Validação de dados FIPE antes de salvar
- [ ] Busca automática de preço FIPE
- [ ] Cache de dados do veículo

#### **6.2 Controller e Validações (90 min)**
- [ ] `src/modules/vehicles/vehicles.controller.ts` - CRUD
- [ ] `src/modules/vehicles/vehicles.validation.ts` - Validações FIPE
- [ ] Endpoint de auto-complete para cadastro
- [ ] Endpoint de validação de placa

#### **6.3 Rotas e Integração (30 min)**
- [ ] `src/modules/vehicles/vehicles.routes.ts` - Rotas
- [ ] Integração com app principal

### **✅ Critérios de Validação Fase 6:**
```bash
# Testar criação de veículo com FIPE
curl -X POST -H "Authorization: Bearer TOKEN" http://localhost:3000/api/vehicles -d '{
  "vehicleType": "cars",
  "fipeBrandValue": "honda", 
  "fipeModelValue": "civic-16-16v",
  "fipeYearValue": "2023-1",
  "plate": "ABC-1234",
  "color": "Preto"
}' -H "Content-Type: application/json"
# Response: {"id": "...", "brand": "Honda", "model": "Civic 1.6 16V", "year": 2023, "fuel": "Gasolina", ...}

# Testar listagem de veículos
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/vehicles
# Response: [{"id": "...", "brand": "Honda", "plate": "ABC-1234", ...}, ...]

# Testar auto-complete
curl -H "Authorization: Bearer TOKEN" "http://localhost:3000/api/vehicles/autocomplete?q=civic"
# Response: {"suggestions": ["Honda Civic 1.6 16V", ...]}
```

### **📦 Commit Fase 6:**
```bash
git add .
git commit -m "feat: módulo de veículos com integração FIPE

- CRUD de veículos com dados FIPE automatizados
- Validação de marca, modelo e ano via API FIPE
- Auto-complete para cadastro de veículos
- Cache de dados FIPE por veículo
- Busca automática de preço de referência"
```

---

## 🔥 **FASE 7: MÓDULO MAINTENANCES (CORRIGIDO)**
**Duração**: 3-4 horas  
**Objetivo**: CRUD manutenções com problemas corrigidos

### **📋 Checklist Fase 7:**

#### **7.1 Service Maintenances (120 min)**
- [ ] `src/modules/maintenances/maintenances.types.ts` - Interfaces
- [ ] `src/modules/maintenances/maintenances.service.ts` - CRUD + parsing corrigido
- [ ] Funções parseMonetaryValue e parseKilometerValue integradas
- [ ] Validação de relacionamentos (veículo, oficina)
- [ ] Busca avançada com filtros

#### **7.2 Controller e Validações (90 min)**
- [ ] `src/modules/maintenances/maintenances.controller.ts` - CRUD
- [ ] `src/modules/maintenances/maintenances.validation.ts` - Validações
- [ ] Logs detalhados para debugging
- [ ] Tratamento de erros específicos

#### **7.3 Rotas e Integração (30 min)**
- [ ] `src/modules/maintenances/maintenances.routes.ts` - Rotas
- [ ] Integração com app principal

### **✅ Critérios de Validação Fase 7:**
```bash
# Testar criação de manutenção (COM PARSING CORRETO)
curl -X POST -H "Authorization: Bearer TOKEN" http://localhost:3000/api/maintenances -d '{
  "vehicleId": "VEHICLE_ID",
  "date": "2025-01-19",
  "description": "Troca de óleo",
  "value": "R$ 550,00",
  "mileage": "152.000",
  "products": "Óleo 5W30, Filtro"
}' -H "Content-Type: application/json"
# Response: {"id": "...", "value": 550, "mileage": 152000, ...} ← VALORES CORRETOS!

# Verificar no banco de dados
# value = 550.00 (não null)
# mileage = 152000 (não 152)

# Testar edição
curl -X PUT -H "Authorization: Bearer TOKEN" http://localhost:3000/api/maintenances/MAINTENANCE_ID -d '{
  "value": "R$ 750,00",
  "mileage": "155.000"
}' -H "Content-Type: application/json"
# Response: {"id": "...", "value": 750, "mileage": 155000, ...} ← PARSING FUNCIONANDO!
```

### **📦 Commit Fase 7:**
```bash
git add .
git commit -m "feat: módulo de manutenções com parsing corrigido

- CRUD de manutenções com valores corretos
- parseMonetaryValue: R$ 550,00 → 550 (funciona!)
- parseKilometerValue: 152.000 → 152000 (corrigido!)
- Validações de relacionamentos
- Logs detalhados para debugging
- Tratamento de erros específicos"
```

---

## 🔥 **FASE 8: MÓDULO ATTACHMENTS (CORRIGIDO)**
**Duração**: 2-3 horas  
**Objetivo**: Upload/download de anexos funcionando

### **📋 Checklist Fase 8:**

#### **8.1 Service Attachments (90 min)**
- [ ] `src/modules/maintenances/attachments/attachments.service.ts` - Upload/download
- [ ] Validação de tipos de arquivo
- [ ] Compressão de imagens
- [ ] Organização de arquivos por manutenção

#### **8.2 Controller e Rotas (90 min)**
- [ ] `src/modules/maintenances/attachments/attachments.controller.ts` - Endpoints
- [ ] `src/modules/maintenances/attachments/attachments.routes.ts` - Rotas
- [ ] Middleware de upload configurado
- [ ] Tratamento de erros de upload

### **✅ Critérios de Validação Fase 8:**
```bash
# Testar upload de anexo
curl -X POST -H "Authorization: Bearer TOKEN" -F "file=@nota_fiscal.pdf" http://localhost:3000/api/maintenances/MAINTENANCE_ID/attachments
# Response: {"id": "...", "filename": "...", "originalName": "nota_fiscal.pdf", ...}

# Verificar no banco de dados
# Tabela maintenance_attachments deve ter registro
SELECT * FROM maintenance_attachments WHERE maintenanceId = 'MAINTENANCE_ID';
# Resultado: Registro existe! ← PROBLEMA RESOLVIDO!

# Testar listagem de anexos
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/maintenances/MAINTENANCE_ID/attachments
# Response: [{"id": "...", "filename": "...", "url": "..."}, ...]

# Testar download
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/maintenances/MAINTENANCE_ID/attachments/ATTACHMENT_ID/download
# Response: Arquivo binário
```

### **📦 Commit Fase 8:**
```bash
git add .
git commit -m "feat: sistema de anexos funcionando

- Upload de arquivos para manutenções
- Persistência correta no banco de dados
- Validação de tipos de arquivo (PDF, JPG, PNG)
- Endpoints de listagem e download
- Organização de arquivos por manutenção
- Tratamento de erros de upload"
```

---

## 🔥 **FASE 9: DELETE SEGURO (CORRIGIDO)**
**Duração**: 1-2 horas  
**Objetivo**: Exclusão de manutenções funcionando

### **📋 Checklist Fase 9:**

#### **9.1 Delete Transacional (60 min)**
- [ ] Função `safeDeleteMaintenance` em maintenances.service.ts
- [ ] Delete em cascata: anexos → inspeções → manutenção
- [ ] Transações para garantir consistência
- [ ] Logs detalhados do processo

#### **9.2 Endpoint Delete (30 min)**
- [ ] Controller atualizado para usar função segura
- [ ] Tratamento de erros específicos
- [ ] Retorno adequado de status codes

### **✅ Critérios de Validação Fase 9:**
```bash
# Testar exclusão de manutenção
curl -X DELETE -H "Authorization: Bearer TOKEN" http://localhost:3000/api/maintenances/MAINTENANCE_ID
# Response: {"message": "Manutenção excluída com sucesso"} ← SEM ERRO 404!

# Verificar no banco
SELECT * FROM maintenances WHERE id = 'MAINTENANCE_ID';
# Resultado: Nenhum registro (deletado)

SELECT * FROM maintenance_attachments WHERE maintenanceId = 'MAINTENANCE_ID';
# Resultado: Nenhum registro (deletado em cascata)

# Testar exclusão de ID inexistente
curl -X DELETE -H "Authorization: Bearer TOKEN" http://localhost:3000/api/maintenances/ID_INEXISTENTE
# Response: {"error": "Manutenção não encontrada"} (404 correto)
```

### **📦 Commit Fase 9:**
```bash
git add .
git commit -m "feat: sistema de exclusão seguro funcionando

- Delete transacional com cascata automática
- Exclusão de anexos + inspeções + manutenção
- Função safeDeleteMaintenance robusta
- Tratamento correto de erros 404
- Logs detalhados do processo de exclusão
- Status codes adequados"
```

---

## 🔥 **FASE 10: MÓDULOS RESTANTES**
**Duração**: 3-4 horas  
**Objetivo**: Workshops e Inspections completos

### **📋 Checklist Fase 10:**

#### **10.1 Módulo Workshops (90 min)**
- [ ] `src/modules/workshops/workshops.service.ts` - CRUD
- [ ] `src/modules/workshops/workshops.controller.ts` - Endpoints
- [ ] `src/modules/workshops/workshops.routes.ts` - Rotas
- [ ] Relacionamento com usuários e manutenções

#### **10.2 Módulo Inspections (120 min)**
- [ ] `src/modules/inspections/inspections.service.ts` - CRUD
- [ ] `src/modules/inspections/inspections.controller.ts` - Endpoints
- [ ] `src/modules/inspections/inspections.routes.ts` - Rotas
- [ ] Sistema de anexos para inspeções

### **📦 Commit Fase 10:**
```bash
git add .
git commit -m "feat: módulos workshops e inspections completos

- CRUD completo para oficinas
- CRUD completo para inspeções
- Sistema de anexos para inspeções
- Relacionamentos corretos entre entidades
- Validações específicas de negócio"
```

---

## 🔥 **FASE 11: INTEGRAÇÃO E TESTES FINAIS**
**Duração**: 2-3 horas  
**Objetivo**: Integração completa + testes end-to-end

### **📋 Checklist Fase 11:**

#### **11.1 Integração Final (90 min)**
- [ ] `src/routes.ts` - Agregador de todas as rotas
- [ ] `src/app.ts` - Configuração final do Express
- [ ] Middleware de CORS atualizado
- [ ] Documentação de endpoints

#### **11.2 Testes End-to-End (120 min)**
- [ ] Fluxo completo: Usuário → Veículo → Manutenção → Anexo
- [ ] Teste de integração FIPE
- [ ] Teste de parsing de valores
- [ ] Teste de upload e delete
- [ ] Validação de dados no banco

### **✅ Critérios de Validação Fase 11:**
```bash
# TESTE COMPLETO DO FLUXO:

# 1. Criar usuário
curl -X POST http://localhost:3000/api/auth/register -d '{"email": "test@final.com", "password": "123456", "name": "Test Final"}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login -d '{"email": "test@final.com", "password": "123456"}' | jq -r '.token')

# 3. Criar veículo com FIPE
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/vehicles -d '{"vehicleType": "cars", "fipeBrandValue": "honda", "fipeModelValue": "civic-16-16v", "fipeYearValue": "2023-1", "plate": "TEST-123"}'

# 4. Criar manutenção
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/maintenances -d '{"vehicleId": "VEHICLE_ID", "date": "2025-01-19", "description": "Teste final", "value": "R$ 999,99", "mileage": "999.999"}'

# 5. Upload anexo
curl -X POST -H "Authorization: Bearer $TOKEN" -F "file=@test.pdf" http://localhost:3000/api/maintenances/MAINTENANCE_ID/attachments

# 6. Verificar dados no banco
# value = 999.99 ✅
# mileage = 999999 ✅
# attachment existe ✅

# 7. Delete manutenção
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/maintenances/MAINTENANCE_ID

# 8. Verificar exclusão
# Manutenção e anexos deletados ✅
```

### **📦 Commit Fase 11:**
```bash
git add .
git commit -m "feat: backend refatorado completo e funcional

- Integração completa de todos os módulos
- API FIPE totalmente integrada
- Problemas de parsing corrigidos
- Sistema de anexos funcionando
- Delete seguro implementado
- Testes end-to-end validados
- Backend TypeScript modular completo"
```

---

## 🚀 **FASE 12: OTIMIZAÇÕES E DEPLOY**
**Duração**: 2-3 horas  
**Objetivo**: Performance + Docker + Documentação

### **📋 Checklist Fase 12:**

#### **12.1 Performance (60 min)**
- [ ] Cache Redis para FIPE (opcional)
- [ ] Compressão gzip
- [ ] Rate limiting por endpoint
- [ ] Otimização de queries Prisma

#### **12.2 Docker Atualizado (60 min)**
- [ ] Dockerfile multi-stage otimizado
- [ ] docker-compose.yml atualizado
- [ ] Variáveis de ambiente documentadas
- [ ] Health checks configurados

#### **12.3 Documentação (60 min)**
- [ ] README.md atualizado
- [ ] Documentação de API
- [ ] Guia de instalação
- [ ] Changelog

### **📦 Commit Fase 12:**
```bash
git add .
git commit -m "feat: otimizações finais e documentação

- Docker multi-stage otimizado
- Cache e performance melhorados
- Rate limiting configurado
- Documentação completa
- Ready for production"
```

---

## 📊 **RESUMO DAS FASES**

| Fase | Duração | Objetivo | Status |
|------|---------|----------|--------|
| **1** | 2-3h | Setup TypeScript + Prisma | ⏳ Pendente |
| **2** | 2-3h | Utilitários + Middleware | ⏳ Pendente |
| **3** | 3-4h | Integração FIPE | ⏳ Pendente |
| **4** | 2-3h | Módulo Auth | ⏳ Pendente |
| **5** | 2h | Módulo Users | ⏳ Pendente |
| **6** | 3-4h | Módulo Vehicles + FIPE | ⏳ Pendente |
| **7** | 3-4h | Módulo Maintenances (corrigido) | ⏳ Pendente |
| **8** | 2-3h | Módulo Attachments (corrigido) | ⏳ Pendente |
| **9** | 1-2h | Delete Seguro (corrigido) | ⏳ Pendente |
| **10** | 3-4h | Workshops + Inspections | ⏳ Pendente |
| **11** | 2-3h | Integração + Testes | ⏳ Pendente |
| **12** | 2-3h | Otimizações + Deploy | ⏳ Pendente |

### **📈 Total Estimado: 28-38 horas**
### **🎯 Implementação: 12 fases incrementais**
### **✅ Validação: Testes a cada fase**

---

## 🔄 **ESTRATÉGIA DE IMPLEMENTAÇÃO**

### **💡 PRINCIPIOS:**
1. **Incremental**: Uma fase por vez
2. **Validação**: Testes antes de cada commit  
3. **Rollback**: Possibilidade de voltar a qualquer fase
4. **Modular**: Cada módulo independente
5. **Funcional**: Commits sempre funcionais

### **📋 WORKFLOW POR FASE:**
```bash
# 1. Implementar fase
git checkout -b fase-X-nome-da-fase

# 2. Desenvolver funcionalidades
# ... código ...

# 3. Testar manualmente
npm run dev
# ... testes ...

# 4. Validar critérios
# ... checklist da fase ...

# 5. Commit funcional
git add .
git commit -m "feat: descrição da fase"

# 6. Merge para main
git checkout main
git merge fase-X-nome-da-fase

# 7. Tag da versão
git tag v2.0.0-fase-X

# 8. Push
git push origin main --tags
```

---

## 📝 **PRÓXIMOS PASSOS**

### **🎯 INICIAR IMPLEMENTAÇÃO:**

1. **✅ Confirmar banco limpo** no pgAdmin
2. **🔧 Configurar .env** com DATABASE_URL correto
3. **🚀 Implementar Fase 1** (Setup básico)
4. **🧪 Validar** critérios da Fase 1
5. **📦 Commit** funcional
6. **➡️ Prosseguir** para Fase 2

### **📞 SUPORTE:**
- **Documentação**: Este arquivo
- **Troubleshooting**: Logs detalhados em cada fase
- **Rollback**: Git tags para voltar a qualquer fase

---

**🎉 BACKEND 2.0 - ARQUITETURA MODERNA, MODULAR E ESCALÁVEL!**

**📅 Data de Última Atualização**: 19 de julho de 2025  
**👤 Documentado por**: Assistant  
**🔄 Status**: Pronto para implementação  
**🎯 Próxima ação**: Iniciar Fase 1 - Setup Básico

---

**🚀 VAMOS TRANSFORMAR O BACKEND EM UMA SOLUÇÃO PROFISSIONAL DE CLASSE MUNDIAL!**
