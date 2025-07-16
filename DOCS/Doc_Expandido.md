
# Documentação Expandida

> **Atenção:** Para detalhes completos dos endpoints da API (rotas, métodos, exemplos de payload e response), consulte o arquivo [API.md](./API.md).

---

### Exemplo de uso dos novos endpoints de anexos

#### Upload de anexo (foto ou PDF)
- **Endpoint:** `POST /maintenances/:id/attachments`
- **Headers:** `Content-Type: multipart/form-data`
- **Body:**
    - Campo `file`: arquivo (imagem ou PDF)
- **Resposta:**
```json
{
  "id": "uuid",
  "maintenanceId": "uuid-da-manutencao",
  "url": "https://.../uploads/arquivo.jpg",
  "type": "photo", // ou "pdf"
  "name": "nome_original.pdf",
  "createdAt": "2025-07-06T12:34:56.789Z"
}
```

#### Listar anexos de uma manutenção
- **Endpoint:** `GET /maintenances/:id/attachments`
- **Resposta:**
```json
[
  {
    "id": "uuid",
    "maintenanceId": "uuid-da-manutencao",
    "url": "https://.../uploads/arquivo.jpg",
    "type": "photo",
    "name": "foto1.jpg",
    "createdAt": "2025-07-06T12:34:56.789Z"
  },
  {
    "id": "uuid2",
    "maintenanceId": "uuid-da-manutencao",
    "url": "https://.../uploads/arquivo.pdf",
    "type": "pdf",
    "name": "ordem_servico.pdf",
    "createdAt": "2025-07-06T12:35:10.123Z"
  }
]
```

#### Remover anexo
- **Endpoint:** `DELETE /maintenances/:maintenanceId/attachments/:attachmentId`
- **Resposta:** HTTP 204 (sem conteúdo)

---

## 2. Fluxos Detalhados
- Passo a passo de cada cenário (oficina usa/não usa sistema)
- Tabelas e listas para facilitar entendimento

## 3. Cenários da Aplicação

### Cenário 1: Oficina Usa a Aplicação

#### Registro de Manutenção
- **Endpoint:** `POST /maintenances`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
    ```json
    {
      "vehicle_id": "uuid-do-veiculo",
      "date": "2025-03-12",
      "description": "Troca de óleo e filtro",
      "products": "Óleo 5W-30, filtro de óleo",
      "mileage": 50000,
      "value": 300.00
    }
    ```
- **Resposta:** `{ "maintenance_id": "uuid", "status": "pending" }`
- **Fluxo:** Oficina cria o registro; notificação é enviada ao cliente.

#### Detalhes da Manutenção
- **Endpoint:** `GET /maintenances/:id`
- **Descrição:** Retorna detalhes da manutenção para revisão/aprovação.

#### Aprovação da Manutenção
- **Endpoint:** `PATCH /maintenances/:id/approve`
- **Headers:** `Authorization: Bearer <token>` (dono do carro)
- **Body:** `{ "approved": true }`
- **Resposta:** `{ "status": "recorded", "blockchain_hash": "0x..." }`
- **Fluxo:** Cliente aprova, e dados vão para a blockchain.

#### Upload de Vistoria
- **Endpoint:** `POST /inspections`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Multipart/form-data com arquivo PDF
- **Resposta:** `{ "inspection_id": "uuid", "file_url": "https://s3.amazonaws.com/..." }`

---

### Cenário 2: Oficina Não Usa a Aplicação

#### Escaneamento e Extração
- **Endpoint:** `POST /maintenances/scan`
- **Headers:** `Authorization: Bearer <token>` (dono do carro)
- **Body:** Multipart/form-data com imagem do orçamento
- **Resposta:**
    ```json
    {
      "maintenance_id": "uuid",
      "extracted_data": {
        "date": "2025-03-12",
        "description": "Troca de óleo",
        "products": "Óleo 5W-30",
        "mileage": 50000,
        "value": 300.00
      },
      "status": "pending"
    }
    ```
- **Fluxo:** IA processa a imagem e retorna dados para revisão.

#### Validação da Manutenção
- **Endpoint:** `POST /maintenances/:id/validate`
- **Body:** `{ "workshop_contact": "whatsapp:+5511999999999" }`
- **Resposta:** `{ "status": "validation_sent" }`

#### Webhook de Validação
- **Endpoint:** `/webhooks/validation`
- **Body:** `{ "maintenance_id": "uuid", "response": "Sim" }`
- **Fluxo:** Após validação, registra na blockchain.

#### Upload de Vistoria
- Mesmo endpoint do Cenário 1 (POST /inspections).

---

## 4. Integração com Blockchain e IA

### Blockchain (Polygon)
#### Ferramentas:
- Web3.js ou Ethers.js para interação com a blockchain.
- Contrato inteligente em Solidity para registrar manutenções.

#### Contrato Inteligente (Exemplo Simplificado):
```solidity
pragma solidity ^0.8.0;

contract MaintenanceRegistry {
    struct Maintenance {
        string vin;
        address workshop;
        address owner;
        string description;
        string products;
        uint mileage;
        uint value;
        uint timestamp;
    }

    mapping(bytes32 => Maintenance) public records;

    function registerMaintenance(
        string memory vin,
        string memory description,
        string memory products,
        uint mileage,
        uint value
    ) public {
        bytes32 id = keccak256(abi.encodePacked(vin, block.timestamp));
        records[id] = Maintenance(vin, msg.sender, tx.origin, description, products, mileage, value, block.timestamp);
    }

    function getMaintenance(bytes32 id) public view returns (Maintenance memory) {
        return records[id];
    }
}
```

#### Fluxo:
Após aprovação/validação, a API chama o método registerMaintenance.
Hash da transação é salvo em maintenances.blockchain_hash.

---

### IA (Leitura de Documentos)
#### Tecnologia:
- OCR: Google Cloud Vision API para converter imagem em texto.
- NLP: Modelo treinado (ex.: spaCy ou BERT) para extrair campos estruturados.

#### Processo:
1. Cliente envia imagem via /maintenances/scan.
2. API chama Google Cloud Vision: `POST https://vision.googleapis.com/v1/images:annotate`.
3. Texto bruto é processado por NLP para identificar: data, descrição, produtos, etc.
4. Dados são retornados ao cliente para revisão.

#### Treinamento:
Coletar 50-100 exemplos de orçamentos reais para ajustar o modelo NLP.

---

## 5. Wireframes Básicos (Descrição Textual)

### Versão Web (Oficina)
- **Tela de Login:**
  - Campos: E-mail, Senha; Botão "Entrar".
- **Dashboard:**
  - Lista de manutenções pendentes/concluídas.
  - Botão "Nova Manutenção".
- **Formulário de Manutenção:**
  - Campos: VIN/Placa, Data, Descrição, Produtos, Quilometragem, Valor.
  - Botão "Salvar e Enviar ao Cliente".
- **Upload de Vistoria:**
  - Área de drag-and-drop para PDF; Botão "Enviar".

### Versão Mobile (Dono do Carro)
- **Tela Inicial:**
  - Lista de carros cadastrados; Botão "Adicionar Carro".
- **Registro de Manutenção:**
  - Botão "Escanear Orçamento" (abre câmera).
- **Formulário pré-preenchido com dados extraídos;** Botão "Revisar e Enviar".
- **Histórico:**
  - Lista de manutenções com filtros (data, tipo de serviço).
  - Detalhes: Data, Serviço, Produtos, Valor, Link para PDF de vistoria.
- **Aprovação:**
  - Notificação com dados da oficina; Botões "Aprovar" / "Rejeitar".

---

## 6. Plano Inicial de Desenvolvimento
### Fase 1: Prototipagem (4-6 semanas)
#### Backend:
- Configurar API com Node.js + PostgreSQL.
- Implementar autenticação JWT.
- Criar endpoints básicos (/auth, /maintenances).

#### Frontend:
- Prototipar interface web (React) e mobile (React Native).
- Focar em telas de login e registro de manutenção.

#### Testes:
- Testar fluxo do Cenário 1 (oficina registra, cliente aprova).

### Fase 2: Integração com IA e Blockchain (6-8 semanas)
#### IA:
- Integrar Google Cloud Vision para OCR.
- Desenvolver script NLP básico para extração de dados.

#### Blockchain:
- Deploy do contrato na testnet da Polygon.
- Integrar Web3.js na API para chamadas ao contrato.

#### Testes:
- Testar Cenário 2 (escaneamento + validação externa).

### Fase 3: Refinamento e Lançamento (4-6 semanas)
#### Funcionalidades Extras:
- Upload de vistorias (integração com AWS S3).
- Suporte a subdomínios (configuração no Nginx ou similar).

#### Polimento:
- Melhorar UX/UI com feedback de usuários.
- Otimizar custos na Polygon (ex.: batch de transações).

#### Lançamento:
- Deploy em produção; oferecer beta para oficinas e clientes.

---

## 7. Considerações Adicionais
### Custo Estimado:
- IA: ~$0,01 por escaneamento (Google Vision).
- Blockchain: ~$0,001 por transação (Polygon).
- Hospedagem: $50-100/mês (AWS ou similar).

### Escalabilidade:
- Usar filas (ex.: RabbitMQ) para processar escaneamentos em larga escala.

### Segurança:
- Criptografar dados sensíveis no banco com AES-256.

