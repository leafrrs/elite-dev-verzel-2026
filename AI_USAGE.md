# Registro de Uso de Inteligência Artificial — Desafio Elite Dev (Verzel)

Este documento registra de forma transparente e intencional o uso de Inteligência Artificial ao longo do desenvolvimento da Plataforma de Eventos e Ingressos, em conformidade com as orientações do desafio oficial.

---

## 1. Ferramenta Utilizada

- **Ferramenta:** Google Antigravity / Gemini
- **Papel:** Mentor Técnico, Pair Programmer e Validador Arquitetural

---

## 2. Decisões Arquiteturais e Registros

### Decisão 01: Definição da Stack Tecnológica

- **Data:** 14/08/2026
- **Finalidade:** Escolha inicial das tecnologias para Front-End, Back-End e Banco de Dados.
- **Sugestão da IA:**
  - Front-End: React + Vite + TypeScript
  - Back-End: Node.js + Express + TypeScript
  - Banco de Dados: PostgreSQL com Prisma ORM
- **O que foi aceito:** React + Vite + TypeScript para o Front-End e Node.js + Express + TypeScript para o Back-End.
- **Decisão atual sobre banco:** O desenvolvimento inicial utiliza SQLite com Prisma para facilitar a configuração local. PostgreSQL está sendo avaliado para a versão final.
- **Justificativa do Desenvolvedor:** Optei por uma arquitetura separando Front-End e Back-End para entender melhor a comunicação entre as camadas. No banco, preferi iniciar de maneira simples e reavaliar PostgreSQL conforme as regras de concorrência e reserva de ingressos forem implementadas.

---

### Decisão 02: Estratégia para Catálogo Externo

- **Data:** 14/08/2026
- **Finalidade:** Avaliar como integrar as APIs externas permitidas pelo desafio.
- **Sugestão da IA:** Considerar uma estratégia híbrida utilizando TMDb para filmes e Ticketmaster para shows.
- **Decisão do Desenvolvedor:** A ideia foi considerada interessante, porém ainda não foi implementada. A prioridade atual é concluir o fluxo mínimo da aplicação antes de adicionar as duas integrações.
- **Motivo:** O desafio recomenda primeiro entregar o fluxo principal funcionando de ponta a ponta. Após o MVP, a integração híbrida será reavaliada.

---

_(Novos registros serão adicionados incrementalmente a cada etapa de implementação)_
