# Painel Nossas Crianças — Prefeitura do Rio de Janeiro

Painel web para acompanhamento de crianças em situação de vulnerabilidade social, cruzando informações de **saúde**, **educação** e **assistência social**. Permite que técnicos de campo identifiquem alertas ativos e registrem revisões de caso.

---

## Sumário

- [Como rodar localmente](#como-rodar-localmente)
- [Credenciais de teste](#credenciais-de-teste)
- [Endpoints da API](#endpoints-da-api)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Decisões arquiteturais e trade-offs](#decisões-arquiteturais-e-trade-offs)
- [Diferenciais implementados](#diferenciais-implementados)
- [O que faria diferente com mais tempo](#o-que-faria-diferente-com-mais-tempo)

---

## Como rodar localmente

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução
- Portas `3000`, `3001` e `5432` disponíveis

### Subindo o projeto

```bash
git clone https://github.com/cayocan/Prefeitura-Nossas-Criancas
cd Prefeitura-RJ_Nossas_Criancas
docker compose up --build
```

Aguarde todos os serviços inicializarem — o backend executa os testes automatizados antes de iniciar o servidor. Quando os três containers estiverem `healthy`, acesse:

| Serviço              | URL                        |
| -------------------- | -------------------------- |
| Frontend             | http://localhost:3000      |
| API (backend)        | http://localhost:3001      |
| Documentação OpenAPI | http://localhost:3001/docs |

> **Primeira execução:** o banco de dados é inicializado automaticamente e os 25 casos do `seed.json` são carregados. Nenhuma configuração adicional é necessária.

### Parando e limpando

```bash
# Para os containers mantendo os dados
docker compose down

# Para os containers e remove o volume do banco (reset completo)
docker compose down -v
```

---

## Credenciais de teste

| Campo  | Valor                    |
| ------ | ------------------------ |
| E-mail | `tecnico@prefeitura.rio` |
| Senha  | `painel@2024`            |

---

## Endpoints da API

Todos os endpoints protegidos exigem header `Authorization: Bearer <token>`.

| Método  | Path                   | Auth | Descrição                              |
| ------- | ---------------------- | ---- | -------------------------------------- |
| `POST`  | `/auth/login`          | —    | Autentica e retorna JWT                |
| `GET`   | `/children`            | ✓    | Lista crianças com filtros e paginação |
| `GET`   | `/children/:id`        | ✓    | Detalhe completo de uma criança        |
| `GET`   | `/children/summary`    | ✓    | Totais agregados para o dashboard      |
| `GET`   | `/children/charts`     | ✓    | Dados de visualização para os gráficos |
| `PATCH` | `/children/:id/review` | ✓    | Registra revisão do caso               |
| `GET`   | `/health`              | —    | Health check                           |
| `GET`   | `/docs`                | —    | Documentação interativa (Swagger UI)   |

### Filtros disponíveis em `GET /children`

| Parâmetro     | Tipo                               | Exemplo             |
| ------------- | ---------------------------------- | ------------------- |
| `bairro`      | string (parcial, case-insensitive) | `?bairro=manguei`   |
| `revisado`    | `true` \| `false`                  | `?revisado=false`   |
| `com_alertas` | `true` \| `false`                  | `?com_alertas=true` |
| `page`        | número (padrão: 1)                 | `?page=2`           |
| `limit`       | número 1–100 (padrão: 10)          | `?limit=25`         |

---

## Estrutura do projeto

```
.
├── docker-compose.yml
├── .env                        # Variáveis de ambiente (não commitado em produção)
├── postgres/
│   └── init.sql
├── server/                     # API REST — Node.js + Fastify
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── package.json
│   ├── data/
│   │   └── seed.json           # 25 crianças fictícias
│   └── src/
│       ├── server.ts           # Bootstrap, plugins, inicialização do DB
│       ├── lib/
│       │   ├── database.ts     # Pool pg + DDL (CREATE TABLE IF NOT EXISTS)
│       │   └── messages.ts     # Mensagens de erro centralizadas
│       ├── plugins/
│       │   └── authenticate.plugin.ts  # Decorator fastify.authenticate
│       ├── routes/
│       │   ├── auth.plugin.ts          # POST /auth/login
│       │   └── children.plugin.ts      # CRUD + /summary + /charts
│       ├── schemas/
│       │   └── child.schema.ts         # Schema Zod do domínio
│       ├── services/
│       │   └── seed.service.ts         # Carga idempotente do seed.json
│       └── __tests__/
│           ├── auth.spec.ts
│           └── children.spec.ts
└── client/                     # Frontend — Next.js 15 + TypeScript
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── globals.css             # Tema OKLCH + dark mode
        │   ├── layout.tsx              # Root layout + providers
        │   ├── login/page.tsx          # Página de login
        │   └── (protected)/            # Route group com guard de autenticação
        │       ├── layout.tsx          # Verifica cookie auth-token
        │       ├── dashboard/page.tsx  # Cards de resumo + gráficos
        │       └── criancas/page.tsx   # Listagem com filtros e paginação
        ├── components/
        │   ├── children/               # ChildrenTable, ChildModal, FiltersBar, Pagination
        │   ├── dashboard/              # ChartsSection (donut, barras, heatmap)
        │   ├── layout/                 # AppShell, Sidebar, Header
        │   ├── providers/              # ThemeProvider (next-themes)
        │   └── ui/                     # Componentes shadcn/ui
        └── lib/
            ├── api.ts                  # apiGet() — fetch server-side com Bearer token
            ├── auth.ts                 # Server Actions: login, logout, review
            └── types.ts                # Tipos TypeScript compartilhados
```

---

## Decisões arquiteturais e trade-offs

### Backend: Node.js + Fastify (em vez de Go + Gin)

Escolhi **Node.js com Fastify** pela maior velocidade de desenvolvimento em TypeScript end-to-end (mesma linguagem no front e no back), ausência de overhead de compilação durante desenvolvimento, e ecossistema maduro para o que o desafio pede. Fastify foi escolhido sobre Express por ser 2–3× mais rápido em benchmarks, ter suporte nativo a TypeScript, sistema de plugins com encapsulamento e geração automática de OpenAPI sem configurações extras.

Para um projeto de médio prazo, a produtividade e a experiência de desenvolvimento superam a leve vantagem de performance bruta que Go + Gin poderia oferecer. O Node.js é mais do que capaz de lidar com o volume esperado (centenas a poucos milhares de registros) sem problemas.

### Banco de dados: PostgreSQL com SQL direto (sem ORM)

Os dados têm estrutura claramente relacional (crianças → saúde / educação / assistência), com queries que exigem JOINs múltiplos, funções de agregação (`COUNT(*) OVER()`), JSONB para alertas e filtros dinâmicos. SQL direto via `pg` oferece controle total e performance melhor que qualquer ORM nesse cenário.

O schema usa 4 tabelas: `children` (dados principais) e três tabelas opcionais `saude`, `educacao`, `assistencia_social` com FK `ON DELETE CASCADE`. A ausência de uma linha nessas tabelas é o sinal semântico de "sem dados nessa área" — mais expressivo que colunas nulas em tabela única.

Alertas são armazenados como `JSONB` porque são arrays simples sempre lidos junto com os dados da seção — nunca consultados individualmente. Se surgir necessidade de queries por alerta específico, um índice GIN com `pg_trgm` resolveria.

### Inicialização do banco: DDL na aplicação (em vez de migrations)

O `initDb()` usa `CREATE TABLE IF NOT EXISTS`, tornando a inicialização idempotente. O `runSeed()` verifica se já existem dados antes de inserir, usando `INSERT ... ON CONFLICT DO NOTHING` para usuários. O seed roda dentro de uma transação (atomicidade). Para produção real, adotaria ferramentas de migration (Flyway, golang-migrate ou similar).

### Frontend: Next.js App Router com Server Components

A divisão é clara: **Server Components** para data-fetching (páginas de dashboard e listagem buscam dados no servidor, sem JavaScript no bundle do cliente), **Client Components** apenas onde há interatividade (tabela com modal, filtros, toggle de tema). Isso minimiza o bundle JS e melhora a performance em dispositivos mais simples — alinhado com o perfil de uso descrito no desafio.

**Server Actions** (`'use server'`) são usadas para operações que precisam de acesso server-side ao cookie: login, logout e revisão de caso. O token JWT fica em cookie `httpOnly` (inacessível via JavaScript, proteção contra XSS).

### Duas URLs para o backend

`BACKEND_URL=http://backend:3001` é usada por Server Components e Server Actions dentro da rede Docker. `NEXT_PUBLIC_API_URL=http://localhost:3001` seria usada por código client-side — mas neste projeto todas as requisições autenticadas passam pelo servidor Next.js, mantendo o token sempre protegido.

### Paginação offset-based

Simples de implementar e suficiente para o volume atual (25 crianças no seed, crescimento esperado de centenas). O `COUNT(*) OVER()` como window function elimina a segunda query de contagem. Para volumes maiores (> 10k registros), migraria para keyset pagination (cursor-based).

---

## Diferenciais implementados

- **Deploy público** — Vercel (frontend) + Railway ou Render (backend + PostgreSQL) em (LINK DO PROJETO DEPLOYADO).
- **shadcn/ui** — componentes Button, Input, Label, Card com variantes customizadas
- **Testes unitários no backend** — Vitest com mocks do pool do banco (`auth.spec.ts`, `children.spec.ts`)
- **Visualizações de dados** — gráficos SVG puros (sem dependência client-side): donut de revisão, barras de alertas por categoria, cobertura de dados por seção e mapa de calor por bairro
- **Dark mode** — paleta customizada com OKLCH, alternância via `next-themes`; cores semanticamente mapeadas a partir de uma paleta de design system coerente (fundos tonais, primárias douradas, semáforos de status)
- **Responsividade 375px–1440px** — sidebar colapsável em mobile (drawer), layout em cards no mobile e tabela no desktop, safe area CSS para dispositivos com notch
- **Dados incompletos tratados explicitamente** — crianças sem dados em uma área exibem badge "Sem dados" em vez de campo vazio; alertas são renderizados como badges coloridos; a ausência de dados é informação, não falha
- **Documentação OpenAPI interativa** em `/docs` com autenticação Bearer configurada
- **Rate limiting** — 100 req/min por IP via `@fastify/rate-limit`
- **Auditoria de revisão** — `revisado_por` (e-mail do técnico via JWT) e `revisado_em` (timestamp do servidor) são gravados e exibidos no detalhe da criança
- **InactivityWatcher** — logout automático por inatividade para terminais compartilhados

---

## O que faria diferente com mais tempo

### Prioridade alta

1. **RBAC multi-role** — separar permissões de visualização, revisão e administração (criação de usuários, ajuste de dados). Atualmente qualquer usuário autenticado pode revisar qualquer criança. O JWT já tem estrutura para adicionar `role`, e o Fastify tem suporte a constraints de rota.

2. **Exportação de relatórios** — PDF ou CSV dos dados filtrados, essencial para prestação de contas e reuniões de equipe. Consideraria `@react-pdf/renderer` no servidor para PDF ou geração de CSV direto na API.

3. **Testes E2E com Playwright** — cobertura dos fluxos críticos: login → filtro → abertura de modal → revisão → logout. Os testes unitários atuais cobrem a lógica de backend isolada; falta cobertura de integração.

### Prioridade média

4. **Migrations versionadas** — substituir o `CREATE TABLE IF NOT EXISTS` por ferramenta de migration (node-pg-migrate ou Flyway) para rastreabilidade e rollback de schema.

5. **Cache no dashboard** — os dados de `/children/summary` e `/children/charts` mudam raramente; um cache em Redis com TTL de 5 minutos e invalidação no `PATCH /review` reduziria carga no banco.

6. **Testes de componente** com React Testing Library para a lógica do modal, filtros e comportamento com dados incompletos.

### Prioridade baixa

7. **Keyset pagination** — substituir o `OFFSET` por cursor-based para escalabilidade com volumes maiores.

8. **Acessibilidade aprofundada** — ARIA labels nos filtros e modal, navegação por teclado testada com leitores de tela, contraste WCAG AA verificado sistematicamente.
