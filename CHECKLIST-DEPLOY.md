# Checklist para colocar o site no ar

Marque conforme for fazendo. A ordem importa: cada passo depende do
anterior. Os detalhes técnicos de cada item estão no **DEPLOY.md**.

> **Tempo estimado:** ~1h de trabalho + a espera do domínio (algumas horas)
> e da propagação de DNS (até 24h, normalmente muito menos).

---

## Fase 0 — Decisões que só você pode tomar

Estas travam o resto. Resolva antes de mexer em plataforma.

- [ ] **0.1 — Definir o nome definitivo da imobiliária**
      Hoje o site usa "Imóveis Buganza". Se for mudar, decida agora: o
      nome entra no domínio, no e-mail e no cadastro do Registro.br.
      → Trocar no código é rápido: veja a Fase 5.

- [ ] **0.2 — Criar um e-mail de verdade**
      O `imoveisbuganza@gmail.com` de hoje é fictício. Você vai precisar
      dele para receber os avisos de lead e para as contas das
      plataformas.
      - Provisório e grátis: Gmail (`nomedaempresa@gmail.com`)
      - Profissional: `contato@seudominio.com.br` (Zoho Mail tem plano
        grátis para 1 domínio; Google Workspace custa ~R$ 30/mês)
      - **Sugestão:** crie o Gmail agora para não travar o deploy, e
        migre para o e-mail do domínio depois.

- [ ] **0.3 — Escolher o domínio**
      Confira disponibilidade em <https://registro.br> antes de fechar o
      nome. Prefira `.com.br` (é o que o brasileiro digita).

- [ ] **0.4 — Definir a senha do admin**
      **Não use `admin123`** (é a do exemplo, está no repositório
      público). Gere uma forte agora e guarde no gerenciador de senhas do
      navegador ou num papel guardado:
      ```bash
      node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"
      ```
      > Não coloquei uma senha pronta aqui de propósito: senha em arquivo
      > de texto (ainda mais versionado no Git) nasce vazada. Gere a sua
      > e guarde num lugar seguro.

---

## Fase 1 — Contas nas plataformas

Todas têm plano gratuito. Use o e-mail da 0.2 em todas.

- [ ] **1.1 — Registro.br** → registrar o domínio · **R$ 40/ano**
      Exige CPF/CNPJ. Pague o boleto/PIX; a liberação leva algumas horas.
- [ ] **1.2 — Neon** (<https://neon.tech>) → banco Postgres · grátis
      Crie o projeto e **copie a connection string**.
- [ ] **1.3 — Supabase** (<https://supabase.com>) → fotos e vídeos · grátis
      Crie o projeto → **Storage** → bucket **público** chamado `imoveis`.
      Em *Project Settings → API*, copie a `URL` e a `service_role key`.
- [ ] **1.4 — Resend** (<https://resend.com>) → aviso de lead · grátis
      Crie uma API key (`re_...`).
- [ ] **1.5 — Upstash** (<https://upstash.com>) → rate limit · grátis
      Crie um banco **Redis** e copie a **URL e o token REST**.
- [ ] **1.6 — Vercel** (<https://vercel.com>) → hospedagem
      Entre com a conta do GitHub.
      > ⚠️ O plano Hobby é oficialmente **não-comercial**. Para uma
      > imobiliária, o correto é o **Pro (US$ 20/mês ≈ R$ 110)**. Dá para
      > começar no Hobby validando, mas saiba do risco.

---

## Fase 2 — Preparar o conteúdo (antes de qualquer um ver)

- [ ] **2.1 — Apagar os imóveis fictícios**
      "Casa bla", bairro "jaenjkadnslkj" e afins. São dados de teste.
- [ ] **2.2 — Revisar os textos institucionais**
      `components/QuemSomos.tsx` tem a história do casal — hoje é
      fictícia. Reescreva com a história real.
- [ ] **2.3 — Revisar os depoimentos**
      `lib/depoimentos.ts` tem depoimentos inventados. **Publicar
      depoimento falso é propaganda enganosa** — troque por reais (com
      autorização de quem falou) ou apague a seção.
- [ ] **2.4 — Conferir o CRECI**
      Hoje é `118400`, em `lib/marca.ts`. Confirme que é o número certo.

---

## Fase 3 — Deploy

- [ ] **3.1 — Importar o repositório na Vercel**
      *Add New → Project* → `romavitordev/buganza_imoveis`. Ainda **não**
      clique em Deploy: cadastre as variáveis primeiro.

- [ ] **3.2 — Cadastrar as variáveis de ambiente**
      Em *Settings → Environment Variables*:

      | Variável | De onde vem |
      |---|---|
      | `DATABASE_URL` | Neon (1.2) |
      | `AUTH_SECRET` | gere: `openssl rand -base64 32` |
      | `SUPABASE_URL` | Supabase (1.3) |
      | `SUPABASE_SERVICE_ROLE_KEY` | Supabase (1.3) — **secreta** |
      | `WHATSAPP_NUMBER` | `5515998296767` (só dígitos) |
      | `NEXT_PUBLIC_SITE_URL` | `https://www.seudominio.com.br` |
      | `RESEND_API_KEY` | Resend (1.4) |
      | `LEAD_NOTIFY_EMAIL` | o e-mail da 0.2 |
      | `UPSTASH_REDIS_REST_URL` | Upstash (1.5) |
      | `UPSTASH_REDIS_REST_TOKEN` | Upstash (1.5) |

- [ ] **3.3 — Criar as tabelas no banco**
      Do seu computador, apontando para o Neon:
      ```bash
      DATABASE_URL="<url do Neon>" npm run db:push
      ```
      > **Obrigatório.** O banco novo não tem as tabelas do chat
      > (`ChatPergunta`, `ChatConhecimento`) nem os campos da 2FA.

- [ ] **3.4 — Criar o usuário admin** (com a senha da 0.4)
      ```bash
      DATABASE_URL="<url do Neon>" ADMIN_EMAIL="<seu e-mail>" ADMIN_PASSWORD="<sua senha forte>" npm run db:seed
      ```
      > O seed também insere imóveis de exemplo — apague depois (2.1).

- [ ] **3.5 — Deploy** → botão *Deploy* na Vercel.

- [ ] **3.6 — Apontar o domínio**
      Na Vercel: *Settings → Domains* → adicione seu domínio. Ela mostra
      os registros DNS; cadastre-os no painel do Registro.br.

---

## Fase 4 — Verificação (não pule)

- [ ] **4.1 — Abrir o site** e navegar: home, catálogo, um imóvel.
- [ ] **4.2 — Testar o formulário "Tenho interesse"** → o lead tem que
      cair em `/admin/leads` **e** chegar um e-mail para você.
- [ ] **4.3 — Testar o WhatsApp** → o botão abre a conversa com o número
      certo?
- [ ] **4.4 — Numa aba anônima:** abrir `/admin` → tem que redirecionar
      para o login. Abrir `/api/admin/properties` → tem que dar **401**.
- [ ] **4.5 — Ativar a 2FA** em *Minha conta* (escaneie o QR).
      > Leia antes a seção do `AUTH_SECRET` no DEPLOY.md — trocá-lo
      > depois **derruba a 2FA**.
- [ ] **4.6 — Cadastrar um imóvel de verdade** com fotos, para ver o
      fluxo completo funcionando.
- [ ] **4.7 — Testar no celular** (a maior parte do tráfego vem de lá).

---

## Fase 5 — Trocar o nome da marca (se decidiu na 0.1)

O nome está **centralizado**: edite **`lib/marca.ts`** e o site inteiro
acompanha — títulos das abas, rodapé, chat, remetente do e-mail, emissor
do QR da 2FA, dados estruturados do Google.

```ts
const nome = "Imóveis Buganza";   // ← novo nome completo
const nomeCurto = "Buganza";      // ← forma curta, usada em frases
```

No mesmo arquivo estão também `creci`, `cidade`, `regiao` e `email`.

**Ainda precisa mexer à mão em:**
- [ ] `components/CityScene.tsx` e o favicon (`app/icon.svg`) — se o
      logotipo mudar
- [ ] `components/QuemSomos.tsx` — o texto da história
- [ ] Nome dos repositórios no GitHub (opcional, é cosmético)

> Já testei: trocando as duas linhas, o typecheck e os 101 testes passam.
> A troca é segura.

---

## Depois que estiver no ar

- [ ] Cadastrar o site no **Google Search Console** (indexação)
- [ ] Ensinar o chatbot em `/admin/suporte` conforme as perguntas chegam
- [ ] Monitoramento de erro (**Sentry**, plano grátis) — hoje, se quebrar
      de madrugada, você só descobre pelo cliente reclamando
