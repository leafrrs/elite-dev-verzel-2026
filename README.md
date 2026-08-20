# Verzel Elite Dev Challenge 2026

## Sobre o projeto
O **Event Platform** é a solução desenvolvida para o desafio técnico Verzel Elite Dev 2026. Trata-se de um sistema Full-Stack voltado à criação, venda, validação e gestão de ingressos para eventos físicos. O fluxo cobre desde a pesquisa de filmes no catálogo da TMDb pelo organizador, até a geração de reservas, simulação de pagamento, e uma portaria com validação via QR Code.

## Funcionalidades e Perfis (RBAC)

O sistema atende através de três personas distintas:

### Cliente (CLIENT)
- **Catálogo Público:** Visualização de eventos futuros publicados na plataforma.
- **Reserva de Pista (GA):** Compra de ingressos baseados em estoque geral.
- **Reserva Numerada (SEATED):** Escolha de assentos específicos via mapa interativo.
- **Checkout / Pagamento:** Fluxo de simulação de pagamento aprovado ou recusado.
- **Meus Ingressos:** Painel para visualizar ingressos adquiridos.
- **Validação QR Code:** Exibição do QR Code contendo os dados de autenticação.
- **Compartilhamento por Link:** Geração de um link seguro para emprestar ou conceder a visualização do ingresso para terceiros.

### Organizador (ORGANIZER)
- **Integração Externa (TMDb):** Pesquisa e seleção de filmes na API The Movie Database para preencher os dados base do evento na plataforma.
- **Criação de Eventos:** Configuração de estoque, lotação e precificação.
- **Geração de Assentos:** O sistema gera automaticamente fileiras e números de assentos baseados na capacidade total de eventos SEATED.
- **Meus Eventos:** Listagem dos próprios eventos criados.
- **Edição Protegida:** Alteração de informações básicas de eventos pertencentes ao usuário logado.

### Portaria (GATE_STAFF)
- **Painel de Controle:** Seleção do evento atual para o controle de fluxo.
- **Scanner de Câmera:** Leitura do QR Code com aprovação criptográfica de integridade.
- **Validação Manual:** Input exigindo exclusivamente a digitação do código do ingresso (`ticketCode`).
- **Validação de Contexto:** Verificação se o ingresso pertence ao evento selecionado na portaria.
- **Consumo Único:** O sistema executa uma atualização condicional atômica. O consumo de ingressos já utilizados é impedido.

## Arquitetura

**Padrão Estrutural:** Client-Server model, com separação entre Frontend SPA e Backend REST.
A arquitetura do Backend opera nas camadas: `Route → Middleware → Schema (Zod) → Controller → Service → Prisma`.

**Integração Externa:** O Frontend não contata a API do TMDb diretamente. A pesquisa flui através do Backend (BFF), de forma que o token do TMDb não é exposto ao navegador do usuário. O Organizador pesquisa o filme, seleciona o resultado, e utiliza os dados retornados como base para configurar e criar o evento.

**Concorrência e Transações:**
- Reservas de assentos utilizam atualizações condicionais no banco para impedir que duas requisições concorrentes reservem o mesmo recurso.
- O consumo de ingressos na portaria também utiliza atualização condicional de estado para prevenir duplo consumo.
- Transações do Prisma são utilizadas quando múltiplas operações precisam ser persistidas atomicamente.

**QR Code / HMAC:**
- O backend calcula uma assinatura HMAC para o ingresso na sua criação ou visualização.
- O QR Code transporta os dados e essa assinatura.
- Na portaria, o backend recalcula a assinatura com a mesma chave secreta local.
- A função `timingSafeEqual` do Node.js é utilizada para comparar as assinaturas, prevenindo ataques de tempo (timing attacks).

## Tecnologias

**Backend:**
- Node.js
- Express
- TypeScript
- Prisma ORM 5.10+
- Zod
- Bcrypt.js e JsonWebToken
- Banco de Dados: SQLite

**Frontend:**
- React 19 + Vite
- React Router DOM v7
- SCSS / SASS
- HTML5-QRCode
- Oxlint

## Estrutura de Pastas
```text
/backend
  ├── prisma/       
  ├── src/
      ├── config/   
      ├── controllers/
      ├── middlewares/ 
      ├── routes/
      ├── schemas/  
      └── services/ 
/frontend
  ├── src/
      ├── components/ 
      ├── layouts/
      ├── pages/    
      ├── routes/
      ├── services/ 
      ├── styles/   
      └── types/    
```

## Pré-Requisitos

- **Node.js** instalado
- **npm** instalado
- **TMDb Read Access Token** (pode ser obtido nas configurações de conta da API The Movie Database).

## Configuração de Ambiente

Na pasta `backend/`, crie o seu arquivo `.env` tomando como base o `.env.example`:

```env
PORT=3333
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_jwt"
QR_SECRET_KEY="sua_chave_hmac"
TMDB_ACCESS_TOKEN="seu_token_aqui" 
```
*O backend exige que a variável `TMDB_ACCESS_TOKEN` esteja definida na inicialização. Ela não deve ser commitada.*

## Migrations e Banco de Dados

O banco de dados pode ser reconstruído integralmente utilizando o histórico de migrations versionadas.
O projeto conta com a migration `20260820140000_add_ticket_share_token`, que adiciona o campo `shareToken` e sua restrição de unicidade (`UNIQUE`) à tabela de tickets.

Fluxo para instalação:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
```

## Instalação e Execução: Backend

Após configurar o `.env` e aplicar as migrations e o seed:

```bash
cd backend
npm run dev
```

## Instalação e Execução: Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

## Usuários de Demonstração (Seed)

| Papel | Email | Senha | Finalidade |
| --- | --- | --- | --- |
| **ORGANIZER** | organizador@verzel.com.br | 123456 | Criar eventos, pesquisar filmes. |
| **CLIENT** | cliente1@verzel.com.br | 123456 | Comprar ingressos e compartilhar. |
| **CLIENT** | cliente2@verzel.com.br | 123456 | Testar restrições e concorrência. |
| **GATE_STAFF**| portaria@verzel.com.br | 123456 | Validar ingressos (câmera ou manual). |

## Roteiro de Avaliação

1. Acesse a aplicação e faça login como `organizador@verzel.com.br` (senha: 123456).
2. Pesquise um filme na aba de eventos, utilize os dados do TMDb e crie um evento do tipo SEATED.
3. Faça logout e entre como `cliente1@verzel.com.br` (senha: 123456).
4. Visualize o catálogo, selecione o evento recém-criado e reserve assentos.
5. Simule a aprovação do pagamento para efetivar o ingresso.
6. Abra a página do ingresso gerado e clique para compartilhar. Copie o link e acesse em uma aba anônima para visualizar os detalhes restritos sem login.
7. Faça logout e entre como `portaria@verzel.com.br` (senha: 123456).
8. Selecione o evento correto na tela de controle.
9. Faça a leitura do QR Code pela câmera ou digite manualmente o `ticketCode`.
10. Tente validar o mesmo ingresso novamente para verificar o bloqueio de duplo consumo ("Já utilizado").

## Endpoints Principais

| Método | Endpoint | Papel | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | *Public* | Autenticação e geração de JWT. |
| `GET` | `/events` | *Public* | Listagem do catálogo de eventos. |
| `POST` | `/reservations` | `CLIENT` | Criação de reserva para evento GENERAL_ADMISSION ou SEATED. |
| `POST` | `/reservations/:id/pay` | `CLIENT` | Pagamento da reserva. |
| `POST` | `/tickets/validate` | `GATE_STAFF` | Consumo na portaria via QR Code (com HMAC). |
| `POST` | `/tickets/validate/manual` | `GATE_STAFF` | Consumo na portaria digitando o `ticketCode`. |
| `POST` | `/tickets/:code/share` | `CLIENT` | Geração do link seguro de compartilhamento. |
| `GET` | `/tickets/shared/:shareToken` | *Public* | Visualização pública limitada do ingresso compartilhado. |
| `GET` | `/external/tmdb/search` | `ORGANIZER` | Busca na API do The Movie Database (BFF). |

## Compartilhamento de Ingresso

Os clientes podem compartilhar seus ingressos através de uma rota web:
- Somente o proprietário (autenticado) pode gerar o link.
- O link utiliza um shareToken aleatório e imprevisível, sem expor identificadores internos desnecessários.
- A página do ingresso compartilhado é pública, permitindo que a outra pessoa apresente o ingresso na portaria sem necessitar de uma conta própria.
- O compartilhamento não transfere ownership da conta. O ingresso continua sujeito à regra estrita de consumo único.

## Limitações Conhecidas

- Reservas no status PENDING não possuem expiração automática nesta versão.
- Não existe busca ou filtro no catálogo público atualmente.
- A compra de ingresso da modalidade GENERAL_ADMISSION ocorre com limite de uma unidade por reserva.
- Links de ingressos compartilhados não possuem expiração ou mecanismo de revogação nesta versão.
- Não há funcionalidade de exclusão ou cancelamento manual de eventos/ingressos.
- Não existe suíte de testes automatizada integrada ao comando `npm test`.
- O projeto não possui deploy em ambiente público (apenas local).

## Segurança

O projeto utiliza técnicas de segurança como:
- Bcrypt para hash de senhas de usuários.
- JSON Web Token (JWT) para autenticação e identificação do usuário nas requisições protegidas.
- Role-Based Access Control (RBAC) isolando escopos de clientes, portaria e organizadores.
- Validação de ownership (pertencimento) ao listar ou interagir com dados.
- Validação de DTOs rigorosa via biblioteca Zod.
- Uso de HMAC para gerar e assinar as informações expostas do ingresso, somado ao `timingSafeEqual` na portaria.
- Geração criptograficamente aleatória para tokens de compartilhamento (`shareToken`) e códigos de ingresso (`ticketCode`).
- Atualizações condicionais no banco de dados para reserva de assentos e consumo na portaria.

## Testes e Qualidade

O projeto pode ser validado e compilado localmente.

**Backend:**
```bash
cd backend
npm run build
```

**Frontend:**
```bash
cd frontend
npm run build
npm run lint
```

Atualmente, não existe uma suíte automatizada integrada ao comando `npm test`. Os processos críticos de concorrência e integridade foram aferidos através de testes manuais e simulações focadas.

## Uso de IA

Ferramentas de IA foram utilizadas como apoio durante o desenvolvimento para discussão de arquitetura, revisão de código e exploração de cenários de teste. O processo e as principais decisões estão documentados em `AI_USAGE.md`.