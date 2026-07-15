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
- **Erros genéricos**: em produção o Next não expõe stack trace ao
  cliente; as rotas de API respondem `{ erro: "mensagem curta" }`.

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

- **2FA no login do admin** (TOTP) — o maior salto de segurança para um
  painel. Ver tarefa SEC3.
- **Rate limit durável** (Upstash/Redis): o atual é em memória e, na
  Vercel serverless (que reinicia direto), ajuda pouco contra força
  bruta distribuída. Ver tarefa SEC4.
- **Renomear `/admin`** para um caminho discreto: camada extra contra
  robôs. Se fizer, **não** cite o novo nome no `robots.txt`.
