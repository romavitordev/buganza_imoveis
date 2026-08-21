# Marcelo Imóveis

Catálogo imobiliário completo da **Marcelo Imóveis** (Sorocaba/SP · CRECI 118.400-F), construído com Next.js 14 (App Router), TypeScript, Tailwind CSS e Prisma.

> O nome da marca mora em [lib/marca.ts](lib/marca.ts) e o site inteiro
> lê de lá — inclusive títulos, e-mails e o emissor do QR da 2FA. Os
> repositórios ainda se chamam `buganza_*` por herança; é cosmético.

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
npm run db:demo   # cria o admin + 3 imóveis de exemplo
```

> **Por que `db:demo` e não `db:seed`?** O `db:seed` cria **só o
> administrador** — é ele que roda em produção, e o catálogo de uma
> imobiliária de verdade tem que nascer vazio. Os três imóveis de
> exemplo são de desenvolvimento e ficam atrás do `db:demo`.

> **Atalho:** `npm run up` sobe o banco, espera ele ficar pronto, roda
> `db:push`/`db:seed` na primeira vez e abre o site — tudo em ordem, num
> comando só. `Ctrl+C` encerra banco e site juntos.

> **Sem Postgres nenhum?** `npm run db:local` sobe um Postgres portátil
> (binários em node_modules, dados em `.pgdata/`) na porta 5502 — o `.env`
> de exemplo já aponta para ele. Deixe rodando em um terminal separado.

(`npm run db:reset` zera o banco e recria os imóveis de exemplo.)

> **"Can't reach database server"?** O Postgres local caiu. Suba de novo
> com `npm run db:local`. Se ele reclamar que a porta 5502 está ocupada,
> sobrou um processo morto de uma sessão anterior — mate com
> `Get-Process postgres* | Stop-Process -Force` e tente outra vez.

### 5. Rodar

```bash
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (login com `ADMIN_EMAIL`/`ADMIN_PASSWORD`)

## Qualidade

```bash
npm test       # testes unitários (Vitest)
npm run lint   # ESLint (next/core-web-vitals)
npx tsc --noEmit   # tipos
```

Dois testes existem para travar regra de negócio, não comportamento de
código — são os que doem se quebrarem:

| teste | o que impede |
| --- | --- |
| `tests/dto.test.ts` | `precoInterno` vazar numa resposta pública |
| `tests/admin-guard.test.ts` | uma rota nova do painel nascer sem checagem de sessão |

## Segurança

O painel tem **duas camadas independentes**, e isso é proposital:

1. **[middleware.ts](middleware.ts)** — barra `/admin` e `/api/admin` na
   borda, antes de chegar na rota.
2. **No próprio handler** — toda rota do painel começa com
   `barrarSemSessao()` ([lib/session.ts](lib/session.ts)), e toda página
   com `exigirSessao()`.

A segunda existe porque a primeira é frágil por natureza: ela vive num
`matcher` de string. Basta mover uma rota para fora de `/api/admin`,
editar o matcher sem perceber ou o framework mudar de comportamento, e a
proteção some **sem erro nenhum aparecer** — a rota simplesmente passa a
responder para qualquer um. O próprio Next já teve CVE de bypass de
middleware (CVE-2025-29927; a versão daqui está corrigida).

Verificado na prática: removendo o `middleware.ts` e reconstruindo, as 23
rotas do painel continuam devolvendo 401 e `/admin` continua
redirecionando para o login.

Outras defesas: CSP e cabeçalhos de segurança em
[next.config.mjs](next.config.mjs); rate limit nos endpoints públicos que
escrevem no banco (leads, contato, chatbot, tracking); 2FA opcional
(TOTP); sessão em cookie httpOnly assinado.

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
   > Em produção use `db:seed`, nunca `db:demo`: o catálogo tem que
   > nascer vazio. Ver [CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md).

## Estrutura

```
app/
  page.tsx                 # Home — hero + destaques
  imoveis/                 # Catálogo com filtros (tipo/transação/cidade)
  imoveis/[slug]/          # Detalhe com galeria + CTA WhatsApp
  admin/                   # Painel protegido (login, dashboard, CRUD)
  api/
    properties/            # PÚBLICA — só ATIVOS, via DTO (sem preço interno)
    admin/                 # CRUD + auth (middleware E guarda no handler)
components/                # Hero, cena SVG, cards, galeria, admin
lib/                       # prisma, session (jose), dto, storage, whatsapp…
prisma/                    # schema + seed
middleware.ts              # 1ª camada: protege /admin e /api/admin
tests/                     # Vitest — inclui as duas regras de negócio
scripts/                   # banco local, seed de demonstração, limpeza
```
