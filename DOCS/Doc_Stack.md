# Stack Recomendada

https://x.com/brunocroh/status/1948118826320830717

## 1. Backend

## 2. Banco de Dados
# Stack do Projeto

## Backend
- Node.js
- Express
- TypeScript
- Prisma ORM (com suporte a campos array, ex: String[] para feedback estruturado)
- PostgreSQL

## Frontend Web
- React
- TypeScript
- Vite
- React Native Paper (componentes compartilhados)

## Frontend Mobile
- React Native (Expo)
- React Native Paper
- @kolking/react-native-rating (estrelas de avaliação)
- Chips de feedback estruturado

## Outras Ferramentas
- Docker
- ESLint
- Nginx (web)

## Observações
- Prisma configurado para uso de migrations e seed.
- O campo `review` em ratings é um array de strings (feedback estruturado).
- Integração mobile e web com backend unificado.
- **Justificativa:** Cross-platform, plugins para câmera e notificações.

## 5. Blockchain
- **Tecnologia:** Polygon + Web3.js + Solidity + Truffle/Hardhat
- **Justificativa:** Baixo custo, alta velocidade, integração Node.js.

## 6. IA (OCR + NLP)
- **Tecnologia:** Google Cloud Vision + Python (spaCy, Transformers)
- **Justificativa:** OCR robusto, NLP poderoso, integração via microserviço.

## 7. Armazenamento de Arquivos
- **Tecnologia:** AWS S3 (alternativa: Google Cloud Storage, Azure Blob)
- **Justificativa:** Escalável, seguro, URLs pré-assinadas.

## 8. Comunicação Externa
- **Tecnologia:** Twilio (SMS) + WhatsApp Business API (alternativa: Nexmo)
- **Justificativa:** Notificações, mensagens interativas.

## 9. Infraestrutura
- **Tecnologia:** Docker + AWS ECS + Nginx + CI/CD (GitHub Actions ou AWS CodePipeline)
- **Justificativa:** Portabilidade, escalabilidade, proxy reverso, subdomínios.

---

### Resumo da Stack Recomendada

| Camada           | Tecnologia                        |Justificativa                              |
|------------------|-------------------------------------------------------------------------------|
| Backend          | Node.js + Express                 | Rápido, escalável, integrações fáceis      |
| Banco de Dados   | PostgreSQL                        | Relacional, robusto                        |
| Frontend Web     | React                             | Reutilização, comunidade forte             |
| Frontend Mobile  | React Native                      | Cross-platform, câmera/notificações        |
| Blockchain       | Polygon + Web3.js                 | Baixo custo, integração com Node.js        |
| IA               | Google Vision + Python            | OCR preciso, NLP poderoso                  |
| Armazenamento    | AWS S3                            | Escalável, seguro                          |
| Comunicação      | Twilio + WhatsApp API             | SMS e mensagens interativas                |
| Infraestrutura   | Docker + AWS ECS                  | Portabilidade, escalabilidade              |

