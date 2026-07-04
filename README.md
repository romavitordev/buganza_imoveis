# Buganza Imóveis

Catálogo imobiliário completo da **Imóveis Buganza** (Sorocaba/SP · CRECI 118400), construído com Next.js 14 (App Router), TypeScript, Tailwind CSS e Prisma.

**Regra de negócio central:** nenhum preço aparece em páginas públicas. O campo `precoInterno` existe apenas para organização dos corretores e é visível somente no admin — a rota pública usa um DTO com allowlist explícita ([lib/dto.ts](lib/dto.ts)) que jamais serializa esse campo. Toda conversão acontece via WhatsApp com mensagem pré-preenchida.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Estilo | Tailwind CSS + Inter (300–600) |
| Banco | PostgreSQL (Neon) via Prisma |
| Fotos | Supabase Storage (bucket público `imoveis`) |
| Auth admin | JWT (jose) em cookie httpOnly `bz_admin`, 8h |
| Ícones | lucide-react |

## Rodando localmente

### 1. Criar o banco no Neon

1. Crie uma conta gratuita em [neon.tech](https://neon.tech)
2. Crie um projeto (ex.: `buganza`) e copie a **connection string** (algo como `postgresql://user:senha@ep-xxx.neon.tech/neondb?sslmode=require`)

> **Sem Postgres?** O [prisma/schema.prisma](prisma/schema.prisma) tem instruções comentadas para trocar para SQLite em dev.

### 2. Criar projeto e bucket no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Em **Storage**, crie um bucket chamado `imoveis` e marque-o como **público**
3. Em **Project Settings → API**, copie a `URL` e a `service_role key`

> Em desenvolvimento, se as variáveis do Supabase ficarem vazias, o upload cai automaticamente em `public/uploads` (com aviso no console). Esse fallback **não funciona na Vercel**.

### 3. Preencher as variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | O que é |
| --- | --- |
| `DATABASE_URL` | Connection string do Neon |
| `AUTH_SECRET` | Segredo do JWT (`openssl rand -base64 32`) — obrigatório |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Credenciais do Supabase |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Login criado pelo seed |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp que recebe os contatos (confirme o número!) |

### 4. Criar tabelas e dados de exemplo

```bash
npm install
npm run db:push   # cria as tabelas
npm run db:seed   # cria o admin + 3 imóveis de exemplo
```

(`npm run db:reset` zera o banco e roda o seed de novo.)

### 5. Rodar

```bash
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (login com `ADMIN_EMAIL`/`ADMIN_PASSWORD`)

## Deploy na Vercel

1. Suba o repositório para o GitHub e importe na [Vercel](https://vercel.com)
2. Em **Settings → Environment Variables**, cadastre todas as variáveis do `.env` (com os valores de produção)
3. Faça o deploy — o build roda `prisma generate` automaticamente via `postinstall`
4. Rode as migrações/seed apontando para o banco de produção:
   ```bash
   DATABASE_URL="<url do Neon>" npm run db:push
   DATABASE_URL="<url do Neon>" ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
   ```

## Estrutura

```
app/
  page.tsx                 # Home — hero + destaques
  imoveis/                 # Catálogo com filtros (tipo/transação/cidade)
  imoveis/[slug]/          # Detalhe com galeria + CTA WhatsApp
  admin/                   # Painel protegido (login, dashboard, CRUD)
  api/
    properties/            # PÚBLICA — só ATIVOS, via DTO (sem preço)
    admin/                 # CRUD completo + auth (protegidas por middleware)
components/                # Hero, cena SVG, cards, galeria, admin
lib/                       # prisma, session (jose), dto, storage, whatsapp…
prisma/                    # schema + seed
middleware.ts              # protege /admin e /api/admin
```
