# 🎟️ Plataforma de Eventos e Ingressos — Desafio Elite Dev (Verzel)

Projeto Full Stack em desenvolvimento para o Desafio Elite Dev da Verzel.

---

## 🚀 Status do Projeto

✅ Autenticação JWT
✅ Autorização por roles
✅ Criação e listagem de eventos
✅ Reserva de assentos
✅ Reserva de pista
✅ Proteção contra overbooking
✅ Pagamento simulado
✅ Autorização em nível de recurso
✅ Emissão lógica de ingresso
✅ HMAC anti-forja
✅ Validação de ingresso pela portaria
✅ Proteção contra validação duplicada
✅ Validação de evento correto
✅ Validação de entrada com Zod
✅ Tratamento semântico de erros

✅ Front-End React (Vite + TypeScript)
✅ React Router
✅ Sass (Identity Dark Editorial)
✅ Autenticação, sessão (localStorage) e rotas protegidas (roles)
✅ Catálogo de eventos e detalhes de evento
✅ Reserva SEATED e GENERAL_ADMISSION
✅ Tratamento de concorrência e checkout (pagamento simulado)
❌ Meus Ingressos
❌ QR visual
❌ Portaria Front-End completa
❌ API externa e Câmera
❌ Compartilhamento
❌ Deploy
❌ Testes automatizados

---

## 🛠️ Stack

### Backend
* Node.js
* Express
* TypeScript
* Prisma
* SQLite
* Zod
* JWT
* bcrypt
* Node Crypto

### Front-End
* React 18
* Vite
* TypeScript
* React Router DOM
* Sass (Arquitetura Dark Editorial)
* Fetch API Nativa

---

## ⚙️ Execução do Backend

Requisitos: Node.js (v18+) instalado.

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz da pasta `backend` utilizando o `.env.example` como base:
```env
# Exemplo de .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-jwt-aqui"
QR_SECRET_KEY="sua-chave-secreta-qr-code-aqui"
```

4. Prepare o banco de dados e popule os dados iniciais (Seed):
```bash
npm run prisma:migrate
npm run seed
```

5. Inicie o servidor em modo de desenvolvimento:
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3333`. Para testar as rotas, utilize a extensão REST Client no arquivo `api.http`.