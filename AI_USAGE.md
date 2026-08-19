# Registro de Uso de Inteligência Artificial — Desafio Elite Dev (Verzel)

Este documento registra de forma transparente as decisões técnicas importantes tomadas com o auxílio da Inteligência Artificial (Google Antigravity/Gemini) durante a consolidação do Back-End.

---

### Decisão 01: Modelagem de reserva e assento

- **Problema:** A tabela de `Reservation` não possuía uma ligação direta com o assento (`seatId`), o que dificultava saber exatamente qual cadeira o usuário estava reservando.
- **Sugestão da IA:** Adicionar o `seatId` opcional em `Reservation`, criando uma relação direta, mantendo a tabela `Seat` apenas para o status físico.
- **Decisão tomada:** Adicionar `seatId` opcional em `Reservation` e permitir um array de reservas em `Seat`.
- **Por que aceitei:** Porque isso garante o histórico de quem tentou reservar a cadeira e permite que a mesma tabela de reservas seja utilizada para eventos sem cadeira marcada (suporte futuro a GENERAL_ADMISSION).
- **O que foi implementado:** Schema do Prisma atualizado (`Reservation` ganhou `seatId`, `Seat` ganhou `reservations`).

---

### Decisão 02: Concorrência e overbooking

- **Problema:** A checagem clássica de estoque (ler, verificar se é > 0 e depois atualizar) falha em milissegundos se duas requisições ocorrerem juntas, causando overbooking (estoque negativo) ou dupla reserva na mesma cadeira.
- **Sugestão da IA:** Usar concorrência otimista via Banco de Dados com atualização condicional atômica (`updateMany`), verificando e abatendo o saldo/status em um único comando no Prisma.
- **Decisão tomada:** Adotar atualização atômica (`updateMany`) sempre checando o estado atual na cláusula `where`.
- **Por que aceitei:** Diferenciei perfeitamente que "transação" garante que as tabelas mudem juntas, mas apenas a "atomicidade" com trava condicional impede que duas requisições leiam o mesmo dado concorrentemente.
- **O que foi implementado:** `reserveGeneralTicket` e `reserveSeatedTicket` usam `updateMany` checando `availableStock: { gt: 0 }` e `status: "AVAILABLE"`. Se `count === 0`, estouram erro 409.

---

### Decisão 03: Pagamento e autorização

- **Problema:** Qualquer pessoa autenticada conseguia disparar o pagamento da reserva de outro usuário (IDOR), e o botão de pagamento não protegia contra múltiplos cliques (concorrência que geraria ingressos infinitos).
- **Sugestão da IA:** Verificar se o `userId` logado bate com o dono da reserva e fazer a transição de status (`PENDING` -> `CONFIRMED`/`REFUSED`) também usando atomicidade condicional.
- **Decisão tomada:** Seguir com a verificação de propriedade e aplicar transição atômica nos dois cenários (Aprovar e Recusar).
- **Por que aceitei:** Para garantir que, num clique duplo ou ataque malicioso, apenas uma requisição tenha sucesso na cobrança. Também devolvemos o assento/estoque no caso de pagamento recusado sem brechas.
- **O que foi implementado:** Método `processPayment` reescrito com proteção anti-IDOR, transição via `updateMany` condicional e devolução do assento/estoque na recusa, tudo dentro do `$transaction`.

---

### Decisão 04: Segurança do ingresso

- **Problema:** O código de QR gerava tickets inseguros usando `Math.random()`, com uma assinatura que vulnerabilizava a catraca contra forjamentos e ataques de tempo. Além disso, a portaria aceitava ingressos de outros eventos se fossem reais.
- **Sugestão da IA:** Trocar por `crypto.randomBytes(8)`, comparar as chaves com `crypto.timingSafeEqual`, consumir o ingresso de forma atômica e enviar o `eventId` da catraca no Payload.
- **Decisão tomada:** Aceita integralmente as recomendações, blindando adicionalmente a mensagem de erro para evitar enumeração de ingressos por hackers.
- **Por que aceitei:** Aumenta exponencialmente a segurança para níveis de produção e corrige o problema grave de contexto ("ingressos válidos na catraca errada").
- **O que foi implementado:** `ticketCode` migrou para bytes criptográficos. Portaria envia `eventId`. `timingSafeEqual` garante comparação segura de HMAC. Retorno genérico (400) para forjamentos, e consumo atômico via `updateMany` (status `VALID` -> `USED`).

---

### Decisão 05: Configuração e validação

- **Problema:** Erros 500 poluindo respostas, variáveis de ambiente lidas perigosamente com `as string`, e inputs processados sem validação de formato rigorosa (strings vazias ou tipos incorretos).
- **Sugestão da IA:** Padrão "Fail Fast" centralizado para o `.env`, implantação de validação isolada com Zod, e uso de uma classe `AppError`.
- **Decisão tomada:** Zod aplicado nas rotas, `AppError` mapeado nos blocos `catch` de todos os Controllers, e falha rígida de inicialização para Secrets faltantes.
- **Por que aceitei:** A distinção entre validação de formato (Zod) e regra de negócio (Service) manteve a arquitetura limpa. Respostas claras em HTTP 400 ajudam no Front-End, e o Fail Fast evita servidores zumbis em produção.
- **O que foi implementado:** `src/config/env.ts` valida as chaves. ZodSchemas criados para as 4 rotas de mutação usando `safeParse`. Todos os serviços trocados para lançar `AppError` respeitando os códigos HTTP correspondentes (400, 401, 403, 404, 409).
