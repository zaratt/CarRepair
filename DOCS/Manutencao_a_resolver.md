# 🔧 **Manutenção - Problemas a Resolver**

**Data de Criação**: 19 de julho de 2025  
**Status**: ⚠️ **PENDENTE - CRÍTICO**  
**Prioridade**: 🔴 **ALTA**

---

## 📋 **PROBLEMAS IDENTIFICADOS**

### **1. 💰 Valor Monetário - CRÍTICO**
**Status**: ❌ **NÃO FUNCIONA**

- **Problema**: Valor formatado "R$ 550,00" → `null` no banco
- **Comportamento**: 
  - Frontend envia: "R$ 550,00"
  - Backend recebe: String formatada
  - Parsing falha: Resultado `null` no database
  - Visualização: "Valor não informado"
  - Edição: Campo em branco

**Código Problemático**:
```javascript
// parseMonetaryValue() não está funcionando corretamente
// Frontend envia formatado, backend não processa
function parseMonetaryValue(value) {
    if (!value || value === '' || value === null || value === undefined) return null;
    let cleanValue = String(value);
    cleanValue = cleanValue
        .replace(/R\$\s?/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '') // Remove pontos (separadores de milhares)
        .replace(',', '.') // Substitui vírgula por ponto decimal
        .trim();
    const parsed = parseFloat(cleanValue);
    const result = isNaN(parsed) || parsed < 0 ? null : parsed;
    return result;
}
```

---

### **2. 📏 Quilometragem - CRÍTICO** 
**Status**: ❌ **DADOS INCORRETOS**

- **Problema**: Quilometragem "152.000" → `152` no banco
- **Comportamento**:
  - Frontend envia: "152.000" (formatado)
  - Backend converte: `152` (para no primeiro ponto)
  - Perda de dados: 152.000 km vira 152 km
  - Edição: Mostra valor incorreto

**Código Problemático**:
```javascript
function parseKilometerValue(value) {
    if (!value || value === '' || value === null || value === undefined) return null;
    let cleanValue = String(value);
    cleanValue = cleanValue
        .replace(/\s/g, '')
        .replace(/\./g, '') // Remove pontos (separadores de milhares)
        .trim();
    const parsed = parseInt(cleanValue, 10);
    const result = isNaN(parsed) || parsed < 0 ? null : parsed;
    return result;
}
```

**Impacto**: Dados de quilometragem completamente incorretos

---

### **3. 📎 Anexos - CRÍTICO**
**Status**: ❌ **UPLOAD NÃO GRAVA**

- **Problema**: Anexo é uploadado mas não é salvo no banco
- **Comportamento**:
  - Frontend faz upload da nota fiscal
  - Backend aparenta processar (200 OK)
  - Tabela `MaintenanceAttachment`: **VAZIA**
  - Anexo "desaparece" do sistema

**Endpoint Atual**:
```javascript
app.post('/api/maintenances/:id/attachments', attachmentUpload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📎 Upload de anexo para manutenção:', id);
        console.log('📁 Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum arquivo');
        
        const count = await prisma.maintenanceAttachment.count({ where: { maintenanceId: id } });
        console.log('📊 Anexos existentes:', count);
        
        if (count >= 3) return res.status(400).json({ error: 'Limite de 3 anexos por manutenção atingido' });
        if (!req.file) return res.status(400).json({ error: 'Arquivo é obrigatório' });
        
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const type = req.file.mimetype === 'application/pdf' ? 'pdf' : 'photo';
        const name = req.file.originalname;
        
        console.log('📎 Criando anexo:', { url, type, name, maintenanceId: id });
        
        const attachment = await prisma.maintenanceAttachment.create({
            data: { maintenanceId: id, url, type, name }
        });
        
        console.log('✅ Anexo criado com sucesso:', attachment.id);
        res.status(201).json(attachment);
    } catch (error) {
        console.error('❌ Erro ao adicionar anexo:', error);
        res.status(500).json({ error: 'Erro ao adicionar anexo', details: error.message });
    }
});
```

**Impacto**: Perda total de documentos importantes

---

### **4. 🗑️ Delete de Manutenção - CRÍTICO**
**Status**: ❌ **FALHA 404**

- **Problema**: Impossível excluir manutenções
- **Comportamento**:
  - Frontend solicita delete
  - Backend retorna erro 404 "Anexo não encontrado"  
  - Manutenção nunca é deletada
  - Registros ficam "órfãos" no sistema

**Erro Atual**:
```
GET http://localhost:3000/api/maintenances/68fc93d6-c442-4bea-b01b-6a56139704d7/attachments
Result: 200 OK

DELETE (anexo individual)
data:application/json; charset=utf-8;base64,eyJlcnJvciI6IkFuZXhvIG7Do28gZW5jb250cmFkbyJ9
// Decodificado: {"error":"Anexo não encontrado"}
```

**Causa**: Frontend tenta deletar anexos individuais antes da manutenção, mas eles não existem no banco.

---

## 🔍 **ANÁLISE TÉCNICA**

### **🎯 Causas Raiz Identificadas:**

1. **Parsing de Dados**: Funções auxiliares não processam corretamente valores formatados
2. **Comunicação Frontend-Backend**: Incompatibilidade de formatos
3. **Upload de Arquivos**: Endpoint pode ter problema na persistência
4. **Relacionamentos Prisma**: Delete em cascata com problemas
5. **Transações**: Possível problema de commit no banco

### **🧪 Testes Realizados:**

- ✅ **Criação**: Manutenção é criada mas com dados incorretos
- ❌ **Valores**: Sempre salvos como `null` ou incorretos
- ❌ **Anexos**: Upload bem-sucedido mas não persiste
- ❌ **Edição**: Campos carregam vazios/incorretos
- ❌ **Exclusão**: Falha total com erro 404

### **📊 Logs de Teste:**
```bash
# POST /api/maintenances
📥 Dados recebidos: { value: "R$ 550,00", mileage: "152.000", workshopId: "..." }
💰 Parsing valor monetário: { original: "R$ 550,00", cleanValue: "R$ 550,00" }
💰 Valor limpo: "55000"
💰 Resultado final: 55000  # ❌ INCORRETO - deveria ser 550
📏 Parsing quilometragem: { original: "152.000", cleanValue: "152.000" }
📏 Valor limpo: "152000"
📏 Resultado final: 152000  # ✅ CORRETO
✅ Manutenção criada: { id: "...", value: 55000, mileage: 152000 }

# Verificação no banco:
SELECT value, mileage FROM Maintenance WHERE id = '...';
# Resultado: value = null, mileage = 152  # ❌ AMBOS INCORRETOS
```

---

## 📊 **IMPACTO NO SISTEMA**

### **🔴 Crítico - Sistema Inutilizável**
- **Dados Financeiros**: Perdidos (valores sempre null)
- **Dados de Quilometragem**: Incorretos (diferença de 1000x)
- **Documentos**: Não são salvos (notas fiscais perdidas)
- **Gerenciamento**: Impossível deletar registros

### **👥 Impacto no Usuário**
- **Confiabilidade**: Zero (dados sempre incorretos)
- **Usabilidade**: Muito baixa (campos vazios na edição)
- **Produtividade**: Impactada (re-trabalho manual constante)

### **💼 Impacto no Negócio**
- **Dados Históricos**: Não confiáveis para relatórios
- **Auditoria**: Impossível rastrear gastos reais
- **Compliance**: Documentos fiscais não são mantidos

---

## 🚀 **PRÓXIMOS PASSOS SUGERIDOS**

### **🔧 Correções Prioritárias:**

#### **1. Debug Completo do Flow de Dados**
```bash
# Adicionar logs em cada etapa:
console.log('1. Frontend enviou:', req.body);
console.log('2. Parsing monetário:', parseMonetaryValue(value));
console.log('3. Parsing quilometragem:', parseKilometerValue(mileage));
console.log('4. Dados para Prisma:', data);
console.log('5. Resultado do create:', maintenance);
console.log('6. Verificação no banco:', await prisma.maintenance.findUnique(...));
```

#### **2. Revisão das Funções de Parsing**
```javascript
// Teste isolado das funções:
console.log('Teste Monetário:');
console.log(parseMonetaryValue("R$ 550,00")); // Deve retornar 550
console.log(parseMonetaryValue("550,00"));     // Deve retornar 550
console.log(parseMonetaryValue("550.00"));     // Deve retornar 550

console.log('Teste Quilometragem:');
console.log(parseKilometerValue("152.000"));   // Deve retornar 152000
console.log(parseKilometerValue("152000"));     // Deve retornar 152000
console.log(parseKilometerValue("152"));        // Deve retornar 152
```

#### **3. Análise do Upload de Anexos**
```bash
# Verificar cada etapa:
1. Arquivo chega ao multer?
2. Prisma.create é executado?
3. Transação é commitada?
4. Registro existe na tabela?
```

#### **4. Correção do Delete**
```javascript
// Implementar delete seguro:
async function safeDeleteMaintenance(maintenanceId) {
    return await prisma.$transaction(async (tx) => {
        // 1. Deletar anexos primeiro
        await tx.maintenanceAttachment.deleteMany({
            where: { maintenanceId }
        });
        
        // 2. Deletar manutenção
        await tx.maintenance.delete({
            where: { id: maintenanceId }
        });
    });
}
```

### **🧪 Plano de Testes Detalhado:**

#### **Teste 1: Criação de Manutenção**
```bash
POST /api/maintenances
{
  "vehicleId": "valid-vehicle-id",
  "workshopId": "valid-workshop-id", 
  "date": "2025-07-19",
  "description": "Teste de parsing",
  "value": "R$ 550,00",
  "mileage": "152.000",
  "products": "Óleo, filtro"
}

# Verificar:
1. Response status = 201
2. Response.value = 550
3. Response.mileage = 152000
4. Banco: SELECT value, mileage FROM Maintenance WHERE id = 'response.id'
```

#### **Teste 2: Upload de Anexo**
```bash
POST /api/maintenances/:id/attachments
Content-Type: multipart/form-data
file: nota_fiscal.pdf

# Verificar:
1. Response status = 201
2. Response.url existe
3. Banco: SELECT * FROM MaintenanceAttachment WHERE maintenanceId = ':id'
4. Arquivo existe em uploads/
```

#### **Teste 3: Edição de Manutenção**
```bash
GET /api/maintenances/:id
# Verificar se valores aparecem formatados corretamente

PUT /api/maintenances/:id
{
  "value": "R$ 750,00",
  "mileage": "155.000"
}
# Verificar se parsing funciona na edição
```

#### **Teste 4: Delete de Manutenção**
```bash
DELETE /api/maintenances/:id
# Verificar:
1. Response status = 200
2. Manutenção removida do banco
3. Anexos removidos em cascata
4. Sem erros 404
```

---

## 🛠️ **CÓDIGO DE DEBUGGING SUGERIDO**

### **Para inserir no POST /api/maintenances:**
```javascript
console.log('=== DEBUG CRIAÇÃO MANUTENÇÃO ===');
console.log('1. Raw body:', req.body);
console.log('2. Value original:', value);
console.log('3. Mileage original:', mileage);

const parsedValue = parseMonetaryValue(value);
const parsedMileage = parseKilometerValue(mileage);

console.log('4. Value parseado:', parsedValue);
console.log('5. Mileage parseado:', parsedMileage);

const maintenance = await prisma.maintenance.create({
    data: {
        // ... outros campos
        value: parsedValue,
        mileage: parsedMileage
    }
});

console.log('6. Manutenção criada:', {
    id: maintenance.id,
    value: maintenance.value,
    mileage: maintenance.mileage
});

// Verificação imediata no banco
const verification = await prisma.maintenance.findUnique({
    where: { id: maintenance.id },
    select: { value: true, mileage: true }
});

console.log('7. Verificação no banco:', verification);
console.log('=== FIM DEBUG ===');
```

---

## 📝 **NOTAS ADICIONAIS**

### **🔍 Observações Técnicas:**
- **Ambiente**: Desenvolvimento local (não Docker)
- **Database**: PostgreSQL via Prisma
- **Frontend**: React Native com validação e formatação
- **Backend**: Node.js + Express + Prisma
- **Upload**: Multer para arquivos

### **⚠️ Workaround Atual**
- Ajuste manual dos valores diretamente no banco de dados
- Remoção de registros via SQL direto
- **NÃO SUSTENTÁVEL PARA PRODUÇÃO**

### **📊 Schema Prisma Relevante:**
```prisma
model Maintenance {
  id               String                  @id @default(uuid())
  vehicleId        String
  workshopId       String?
  value            Float? // ✅ Nullable
  mileage          Int    // ✅ Obrigatório
  // ... outros campos
  attachments      MaintenanceAttachment[]
}

model MaintenanceAttachment {
  id            String      @id @default(uuid())
  maintenanceId String
  maintenance   Maintenance @relation(fields: [maintenanceId], references: [id])
  url           String
  type          String
  name          String?
  createdAt     DateTime    @default(now())
}
```

---

## 🎯 **CRITÉRIO DE SUCESSO**

A resolução será considerada completa quando:

### **✅ Critérios Funcionais:**
- ✅ Valor "R$ 550,00" for salvo como `550.00` no banco
- ✅ Quilometragem "152.000" for salva como `152000` no banco  
- ✅ Anexos uploadados aparecerem na tabela `MaintenanceAttachment`
- ✅ Edição carregar valores formatados corretamente
- ✅ Delete funcionar sem erros 404

### **✅ Critérios Técnicos:**
- ✅ Logs mostrarem parsing correto em todas as etapas
- ✅ Verificação no banco confirmar dados corretos
- ✅ Upload de arquivo persistir no banco e filesystem
- ✅ Transações de delete funcionarem atomicamente

### **✅ Critérios de Qualidade:**
- ✅ Todos os testes manuais passarem
- ✅ Sem necessidade de intervenção manual no banco
- ✅ Sistema funcionar end-to-end
- ✅ Dados históricos permanecerem íntegros

---

## 📞 **CONTATO E RESPONSABILIDADE**

**📅 Data de Última Atualização**: 19 de julho de 2025  
**👤 Reportado por**: Usuario  
**🔄 Status**: Aguardando resolução técnica  
**🚨 Urgência**: Sistema crítico não funcional  

### **🎯 Próxima Sessão:**
- Implementar debugging detalhado
- Testar cada função isoladamente  
- Resolver problemas um por vez
- Validar correções com dados reais

---

**⚠️ IMPORTANTE**: Este documento deve ser atualizado conforme o progresso da resolução.
