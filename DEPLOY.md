# Deploy e segurança — Buganza Imóveis

Guia prático para colocar o site no ar (Vercel) de forma segura. Faça na
ordem; os itens marcados com 🔒 são **obrigatórios** para não deixar
brecha.

---

## 1. Banco de dados (Neon)

1. Crie um projeto gratuito em [neon.tech](https://neon.tech).
2. Copie a *connection string* (formato
   `postgresql://user:senha@host.neon.tech/buganza?sslmode=require`).
3. Rode as tabelas + o admin apontando para o banco de produção:
   ```bash
   DATABASE_URL="<url do Neon>" npm run db:push
   DATABASE_URL="<url do Neon>" ADMIN_EMAIL="..." ADMIN_PASSWORD="<senha forte>" npm run db:seed
   ```

## 2. Fotos (Supabase Storage)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Storage**, crie um bucket público chamado `imoveis`.
3. Em **Project Settings → API**, copie a `URL` e a `service_role key`.

> Sem Supabase, o upload cai em `public/uploads`, que **não funciona na
> Vercel** (disco efêmero). Configure antes de subir fotos em produção.

## 2.5 Aviso de lead por e-mail (Resend)

Quando um visitante envia o "Tenho interesse", o corretor recebe um
e-mail com nome, WhatsApp clicável, imóvel e mensagem. Para ligar:

1. Crie uma conta gratuita em [resend.com](https://resend.com)
   (3.000 e-mails/mês — sobra para o volume de leads).
2. Em **API Keys**, crie uma chave e copie o valor (`re_...`).
3. Cadastre na Vercel (§3): `RESEND_API_KEY` com a chave e
   `LEAD_NOTIFY_EMAIL` com o e-mail do corretor que recebe os avisos.

Pronto — não precisa de mais nada para funcionar: sem domínio próprio
verificado, os avisos saem do remetente `onboarding@resend.dev`.

**Opcional (recomendado depois que o domínio estiver no ar):** em
**Resend → Domains**, verifique `buganzaimoveis.com.br` (2 registros
DNS) e defina `LEAD_NOTIFY_FROM="Buganza Imóveis
<avisos@buganzaimoveis.com.br>"` — os avisos passam a sair do próprio
domínio, com menos chance de cair em spam.

> As variáveis são opcionais: sem elas o site funciona normalmente e o
> lead continua caindo na caixa do painel (/admin/leads) — só não chega
> aviso por e-mail. Falha no envio nunca perde o lead.

---

## 3. 🔒 Variáveis de ambiente na Vercel

Em **Settings → Environment Variables**, cadastre (nunca commite estes
valores):

| Variável | Cuidado |
|---|---|
| `DATABASE_URL` | Connection string do Neon. |
| `AUTH_SECRET` | 🔒 **Gere um valor forte e único** (ver abaixo). Se vazar, dá para forjar sessão de admin. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | A service key é secreta — só server-side. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 🔒 Senha forte (ver §4). Só usados no seed. |
| `WHATSAPP_NUMBER` | Só dígitos (55 + DDD + número). Server-only. |
| `NEXT_PUBLIC_SITE_URL` | URL pública final (sitemap, OG, robots). |
| `RESEND_API_KEY` | Opcional — liga o aviso de lead por e-mail (§2.5). Secreta, só server-side. |
| `LEAD_NOTIFY_EMAIL` | Opcional — e-mail do corretor que recebe os avisos de lead. |
| `LEAD_NOTIFY_FROM` | Opcional — remetente com domínio verificado no Resend (§2.5). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Recomendado em produção — torna o rate limit durável (login, leads, chat). Grátis em [upstash.com](https://upstash.com): crie um banco Redis e copie URL + token REST. |

### Gerar o `AUTH_SECRET`

```bash
openssl rand -base64 32
# ou, sem openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Cole o resultado no `AUTH_SECRET` da Vercel. **Um segredo diferente por
ambiente**; nunca reaproveite o de exemplo do `.env`.

---

## 4. 🔒 Senha do admin

O seed cria o admin com `ADMIN_PASSWORD`. **Nunca deixe `admin123` em
produção.** Duas formas:

- **Antes do seed:** defina `ADMIN_PASSWORD` com uma senha forte (12+
  caracteres, sem palavra de dicionário) no comando do §1.
- **Depois de logar:** troque em **/admin → Minha conta** (exige a senha
  atual, aplica bcrypt).

A senha forte é a defesa nº 1 do painel — vale mais que qualquer outra
medida desta lista.

---

## 5. O que já está pronto no código (não precisa fazer nada)

- **Proteção do admin no servidor** (`middleware.ts`): `/admin` e
  `/api/admin` exigem sessão válida. Truque de front/inspecionar não
  burla — a decisão é server-side.
- **Sessão em cookie `HttpOnly`** assinado (JWT/jose): o JavaScript da
  página não lê o cookie; sem o `AUTH_SECRET` não dá para forjá-lo. O
  flag `Secure` liga sozinho quando `NODE_ENV=production`.
- **Senhas com bcrypt** (custo 12) — nunca em texto puro.
- **Rate limit no login** (5 tentativas / 15 min por IP) e no formulário
  de leads (5 / hora) — ver limitação em §7.
- **Sem SQL injection**: todas as queries usam Prisma (parametrizadas).
- **Cabeçalhos de segurança + CSP** em todas as rotas
  (`next.config.mjs`): CSP, HSTS, X-Frame-Options, nosniff, etc.
- **`precoInterno` nunca vaza**: DTO com allowlist (`lib/dto.ts`).
- **Número de WhatsApp server-only**: redirecionado por `/api/contato`,
  fora do "inspecionar".
- **`robots.txt`** bloqueia `/admin` e `/api` da indexação.
- **2FA opcional (TOTP)**: ative em **/admin → Minha conta** escaneando
  o QR com Google Authenticator/Authy. Com ela ativa, o login exige
  senha + código de 6 dígitos. **Recomendado ativar após o deploy.**
- **Erros genéricos**: em produção o Next não expõe stack trace ao
  cliente; as rotas de API respondem `{ erro: "mensagem curta" }`.

---

## 5.1 Build local (Windows + Node 24)

`next build` roda em workers paralelos e, **no Windows com Node 24+**,
eles derrubam o processo com `STATUS_STACK_BUFFER_OVERRUN`
(código `3221226505`). O `next.config.mjs` detecta esse caso e roda o
build em processo único — não é preciso fazer nada.

Na Vercel (Linux + Node LTS) a condição não se aplica e o build segue
paralelo, que é mais rápido. Se um dia o build local falhar com aquele
código, confira se a detecção ainda cobre a sua versão de Node.

> O Postgres local (`npm run db:local`) precisa estar no ar para o
> build: ele gera as páginas dos imóveis. Se o build cair com
> `ConnectionReset`, o banco caiu — rode `npm run db:local` de novo.

---

## 6. ✅ Verificação pós-deploy (5 minutos no navegador)

Depois que o site estiver no ar, confirme (numa aba anônima, deslogado):

1. Abrir `seusite.com/api/admin/properties` → deve dar **401**.
2. Abrir `seusite.com/admin` → deve **redirecionar para o login**.
3. No console (F12): `document.cookie` → o `bz_admin` **não** deve
   aparecer (prova do HttpOnly).
4. Aba **Network**, na resposta do login → o cookie deve vir com
   **HttpOnly** e **Secure**.
5. Aba **Network** de qualquer página → confirme os cabeçalhos
   `Content-Security-Policy`, `Strict-Transport-Security`,
   `X-Frame-Options`.

---

## 7. Melhorias futuras (opcionais)

- **Renomear `/admin`** para um caminho discreto: camada extra contra
  robôs. Se fizer, **não** cite o novo nome no `robots.txt`.
