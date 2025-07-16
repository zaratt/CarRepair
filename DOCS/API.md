# API Reference - CarRepair

Documentação dos principais endpoints da API do CarRepair, incluindo exemplos de requests e responses, modelos de dados e observações importantes.

---

## Autenticação

### POST /api/auth/login
- **Body:** `{ email, password }`
- **Response:** `{ token, user }`

---

## Oficinas

### GET /api/workshops
Lista todas as oficinas.

### GET /api/workshops/:id
Detalhes de uma oficina.

### POST /api/workshops
Cria uma nova oficina.
- **Body:** 
```json
{
  "name": "Nome da Oficina",
  "userId": "...",
  "address": "Endereço da oficina",
  "phone": "Telefone",
  "subdomain": "opcional"
}
```

**Nota:** Este endpoint é usado automaticamente quando o usuário seleciona "Oficina não listada" no formulário de manutenção, criando uma oficina temporária para registro da manutenção.

---

## Avaliações (Ratings)

### GET /api/workshops/:id/ratings
Lista todas as avaliações de uma oficina.

#### Exemplo de response:
```json
[
  {
    "id": "...",
    "userId": "...",
    "workshopId": "...",
    "value": 5,
    "review": ["Atendimento", "Prazo"],
    "createdAt": "2025-07-14T12:00:00Z",
    "user": { "name": "Maria Motorista" }
  }
]
```

### POST /api/workshops/:id/rate
Cria ou atualiza avaliação do usuário logado para a oficina.
- **Body:**
```json
{
  "userId": "...",
  "value": 4,
  "review": ["Atendimento", "Limpeza"]
}
```
- **Response:** 200 OK

---

## Favoritos

### GET /api/users/:userId/favorites
Lista oficinas favoritas do usuário.

### POST /api/workshops/:id/favorite
Adiciona oficina aos favoritos do usuário.
- **Body:** `{ userId }`

### POST /api/workshops/:id/unfavorite
Remove oficina dos favoritos do usuário.
- **Body:** `{ userId }`

---

## Veículos

### GET /api/vehicles
Lista veículos do usuário.

### GET /api/vehicles/:id/last-maintenance
Retorna informações da última manutenção de um veículo.

#### Exemplo de response:
```json
{
  "hasLastMaintenance": true,
  "lastMaintenance": {
    "id": "maintenance-uuid",
    "date": "2024-06-01",
    "mileage": 85000,
    "description": "Troca de óleo e filtro",
    "workshopName": "Oficina Carlos"
  }
}
```

---

## Dashboard

### GET /api/dashboard/summary/:userId
Retorna estatísticas gerais do usuário (car_owner).

#### Exemplo de response:
```json
{
  "totalVehicles": 3,
  "totalMaintenances": 15,
  "averageSpending": 245.50,
  "totalWorkshopsUsed": 5
}
```

### GET /api/dashboard/vehicles/:userId
Lista veículos do usuário com estatísticas individuais.

#### Exemplo de response:
```json
[
  {
    "id": "vehicle-uuid",
    "brand": "Toyota",
    "model": "Corolla",
    "licensePlate": "ABC-1234",
    "currentKm": 85000,
    "totalMaintenances": 8,
    "averageSpending": 320.75,
    "upcomingMaintenances": []
  }
]
```

---

## Sistema de Status Automático

### POST /api/maintenances/update-status
Atualiza automaticamente o status das manutenções.
- **Fluxo:** 'registered' → 'pending' (após 2 dias) → 'validated' (oficina confirma)
- **Response:**
```json
{
  "success": true,
  "updatedToPending": 5,
  "message": "Status automático atualizado com sucesso. 5 manutenções atualizadas."
}
```

### PUT /api/maintenances/:id/validate
Permite que uma oficina valide uma manutenção (muda status para 'validated').
- **Body:** `{ "userId": "id_do_usuario_da_oficina" }`
- **Validações:** 
  - Usuário deve ser dono de uma oficina
  - Manutenção deve pertencer à oficina do usuário
- **Response:** Manutenção atualizada com relacionamentos

### GET /api/workshops/:userId/pending-maintenances
Lista manutenções pendentes de validação para uma oficina.
- **Params:** `userId` (ID do usuário dono da oficina)
- **Response:** Array de manutenções com status 'pending'
- **Includes:** vehicle (com brand, model, owner)

**Nota:** O sistema roda automaticamente um scheduler a cada 24 horas para atualizar os status das manutenções.

---

## Observações
- O campo `review` em ratings agora é um array de strings (chips de feedback).
- O sistema impede múltiplas avaliações por usuário/oficina.
- Favoritar/desfavoritar é refletido imediatamente na UI mobile.

---

> Para fluxos completos, wireframes e plano de desenvolvimento, consulte o arquivo [Doc_Expandido.md](./Doc_Expandido.md).
