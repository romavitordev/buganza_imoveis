# Buganza Imóveis

Catálogo imobiliário completo da **Imóveis Buganza** (Sorocaba/SP · CRECI 118400), construído com Next.js 14 (App Router), TypeScript, Tailwind CSS e Prisma.

**Preços:** os campos públicos `precoVenda` e `precoLocacao` aparecem nos cards e no detalhe (ausentes = "Sob consulta"). Já o `precoInterno` existe apenas para organização dos corretores e é visível somente no admin — a rota pública usa um DTO com allowlist explícita ([lib/dto.ts](lib/dto.ts)) que jamais serializa esse campo. Toda conversão acontece via WhatsApp com mensagem pré-preenchida.

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

> **Sem Postgres nenhum?** `npm run db:local` sobe um Postgres portátil
> (binários em node_modules, dados em `.pgdata/`) na porta 5502 — o `.env`
> de exemplo já aponta para ele. Deixe rodando em um terminal separado.

(`npm run db:reset` zera o banco e roda o seed de novo.)

### 5. Rodar

```bash
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (login com `ADMIN_EMAIL`/`ADMIN_PASSWORD`)

## Qualidade

```bash
npm test       # testes unitários (Vitest) — inclui o teste que garante
               # que precoInterno NUNCA vaza no DTO público
npm run lint   # ESLint (next/core-web-vitals)
```

## Como o conteúdo chega ao visitante (cache)

As páginas públicas usam **ISR**: home e detalhe são servidas do cache e
regeneradas no máximo a cada 5 minutos — mas **toda mutação no admin**
(criar/editar/excluir imóvel, fotos, vídeo) invalida o cache na hora via
`revalidatePath` ([lib/revalidate.ts](lib/revalidate.ts)). O catálogo
`/imoveis` é dinâmico (filtros, busca `?q=` e ordenação via URL).

## Upload de fotos e vídeo

Em produção o upload vai **direto do navegador para o Supabase** com URL
assinada (rota `/api/admin/properties/[id]/uploads`) — o arquivo não passa
pela Vercel, então o limite de 4,5 MB de body não se aplica (essencial para
vídeos de até 50 MB). Sem Supabase configurado (dev), cai automaticamente
no upload via servidor para `public/uploads`.

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
