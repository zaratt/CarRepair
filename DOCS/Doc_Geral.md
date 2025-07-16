# Documentação Geral do Sistema

## 1. Visão Geral
- SaaS para gerenciamento de manutenções de veículos pós-garantia.
- Interfaces: Web (oficinas) e Mobile (donos de carros).
- Blockchain para garantir autenticidade dos registros.
- IA para leitura automática de orçamentos.
- Armazenamento de PDFs de vistorias.

## 2. Subdomínios
- Subdomínios personalizados para oficinas premium.
- Padrão: domínio principal com caminhos personalizados.

### Prós
| Vantagem   | Descrição                                 |
|------------|--------------------------------------------|
| Branding   | Reforça identidade da oficina              |
| SEO        | Melhora visibilidade online                |
| Isolamento | Facilita separação lógica no backend       |

### Contras
| Desvantagem  | Descrição                                |
|--------------|-------------------------------------------|
| Custo        | SSL para cada subdomínio                  |
| Complexidade | Gerenciamento de DNS e roteamento         |
| Escalabilidade| Mais subdomínios = mais manutenção       |

## 3. Fluxos de Funcionamento
- Cenário 1: Oficina usa a aplicação (Web)
- Cenário 2: Oficina não usa a aplicação (Mobile + IA)
- Listas e diagramas para cada fluxo

## 4. Estrutura das Tabelas do Banco de Dados

### users (Usuários)
| Coluna        | Tipo         | Descrição                        |
|-------------- |-------------|----------------------------------|
| id            | UUID        | Identificador único              |
| name          | VARCHAR(100)| Nome completo                    |
| email         | VARCHAR(100)| E-mail                           |
| cpf_cnpj      | VARCHAR(14) | CPF (dono) ou CNPJ (oficina)     |
| password_hash | VARCHAR(255)| Hash da senha                    |
| role          | ENUM        | 'owner' (dono) ou 'workshop'     |
| created_at    | TIMESTAMP   | Data de criação                  |

### vehicles (Veículos)
| Coluna        | Tipo         | Descrição                        |
|-------------- |-------------|----------------------------------|
| id            | UUID        | Identificador único              |
| vin           | VARCHAR(17) | Número VIN (único)               |
| license_plate | VARCHAR(8)  | Placa do veículo                 |
| model         | VARCHAR(50) | Modelo do carro                  |
| year          | INT         | Ano de fabricação                |
| owner_id      | UUID        | FK para users (dono)             |
| created_at    | TIMESTAMP   | Data de criação                  |

### workshops (Oficinas)
| Coluna        | Tipo         | Descrição                        |
|-------------- |-------------|----------------------------------|
| id            | UUID        | Identificador único              |
| user_id       | UUID        | FK para users (oficina)          |
| address       | VARCHAR(200)| Endereço                         |
| phone         | VARCHAR(15) | Telefone de contato              |
| subdomain     | VARCHAR(50) | Subdomínio (opcional)            |
| created_at    | TIMESTAMP   | Data de criação                  |

### maintenances (Manutenções)
| Coluna          | Tipo           | Descrição                              |
|-----------------|----------------|----------------------------------------|
| id              | UUID           | Identificador único                    |
| vehicle_id      | UUID           | FK para vehicles                       |
| workshop_id     | UUID           | FK para workshops (pode ser nulo)      |
| date            | DATE           | Data do serviço                        |
| description     | TEXT           | Descrição do serviço                   |
| products        | TEXT           | Produtos utilizados                    |
| mileage         | INT            | Quilometragem                          |
| value           | DECIMAL(10,2)  | Valor do serviço                       |
| blockchain_hash | VARCHAR(66)    | Hash da transação na blockchain        |
| status          | ENUM           | 'pending', 'validated', 'recorded'     |
| created_at      | TIMESTAMP      | Data de criação                        |

### inspections (Vistorias)
| Coluna        | Tipo         | Descrição                        |
|-------------- |-------------|----------------------------------|
| id            | UUID        | Identificador único              |
| maintenance_id| UUID        | FK para maintenances             |
| file_url      | VARCHAR(255)| URL do PDF (ex.: AWS S3)         |
| uploaded_by   | UUID        | FK para users (quem enviou)      |
| created_at    | TIMESTAMP   | Data de upload                   |

## 5. Considerações Finais

### Escalabilidade
O modelo SaaS permite adicionar novas oficinas e usuários sem grandes mudanças na infraestrutura.
Blockchain Polygon suporta alto volume de transações com baixo custo.

### Segurança
Dados sensíveis (CPF, VIN) são criptografados no banco de dados.
PDFs de vistoria são armazenados em serviços seguros (ex.: AWS S3 com acesso restrito).

### Próximos Passos
- Prototipar a interface web (oficina) e mobile (dono).
- Integrar IA de OCR/NLP para leitura de documentos.
- Configurar a blockchain Polygon e testar transações.
- Desenvolver a API para conectar os sistemas.

