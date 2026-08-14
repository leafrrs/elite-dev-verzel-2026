# 🎟️ Plataforma de Eventos e Ingressos — Desafio Elite Dev (Verzel)

Aplicação completa para publicação, venda e validação de ingressos de eventos, desenvolvida como solução para o Desafio Elite Dev da Verzel.

---

## 🚀 Tecnologias Utilizadas

* **Front-End:** React 18, Vite, TypeScript, Vanilla CSS (Design System autoral e responsivo).
* **Back-End:** Node.js, Express, TypeScript, Prisma ORM.
* **Banco de Dados:** PostgreSQL / SQLite (ambiente de desenvolvimento).
* **APIs Externas:** The Movie Database (TMDb) & Ticketmaster Discovery API.
* **Segurança:** Autenticação JWT, Hash de senhas com bcrypt, Assinatura digital anti-fraude em QR Codes.

---

## 🏛️ Arquitetura do Sistema

```
[ FRONT-END (React + Vite) ]
          │
          │ HTTP / REST (Bearer JWT)
          ▼
[ BACK-END (Node.js + Express) ]
   ├── Controllers   (Entrada HTTP)
   ├── Middlewares   (Autenticação e RBAC)
   ├── Services      (Regras de Negócio & Concorrência)
   └── Repositories  (Prisma ORM)
          │                      │
          ▼                      ▼
  [ Banco de Dados ]    [ APIs Externas: TMDb / Ticketmaster ]
```

---

*(Instruções de instalação, execução, seed e variáveis de ambiente serão detalhadas ao longo do desenvolvimento)*