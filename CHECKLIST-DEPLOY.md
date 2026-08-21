# Checklist para colocar o site no ar

Marque conforme for fazendo. A ordem importa: cada passo depende do
anterior. Os detalhes técnicos de cada item estão no **DEPLOY.md**.

> **Tempo estimado:** ~1h de trabalho + a espera do domínio (algumas horas)
> e da propagação de DNS (até 24h, normalmente muito menos).

---

## O que falta, em uma olhada

**O código está pronto.** Nada na lista abaixo é programação — é
decisão, conta em plataforma e texto que só os donos podem escrever.

| bloqueia | o quê | quem |
| --- | --- | --- |
| 🔴 tudo | domínio + e-mail real (Fase 0) | você |
| 🔴 deploy | contas: Neon, Supabase, Resend, Upstash, Vercel (Fase 1) | você |
| 🟠 ir ao ar | as falas dos 5 depoimentos já identificados (2.3) | donos |
| 🟠 legal | confirmar a razão social — está em processo de mudança (2.6) | donos |
| 🟠 legal | revisão da política de privacidade por advogado | você |
| 🟡 estética | logotipo oficial em `public/logo.svg` | donos |
| 🟢 depois | Search Console, Sentry, ensinar o chatbot | você |

Nada de falso está mais no ar: os depoimentos inventados saíram, a
seção some sozinha com a lista vazia, o "+400 imóveis" foi removido e o
catálogo nasce vazio. O que resta é conteúdo que **falta**, não conteúdo
que **mente** — e faltar não impede o lançamento.

---

## Fase 0 — Decisões que só você pode tomar

Estas travam o resto. Resolva antes de mexer em plataforma.

- [x] **0.1 — Nome da imobiliária** ✅ confirmado
      **"Marcelo Imóveis Sorocaba"**, em `lib/marca.ts`. O domínio
      escolhido acompanha: `marcelocorretorsorocaba.com.br`.

- [x] **0.2 — E-mail de verdade** ✅ feito
      Os donos criaram `marceloimoveissorocaba@gmail.com`, que já está no
      site (rodapé e política) e no `.env` como login do admin e destino
      dos avisos de lead.

      > Quando o domínio existir, dá para migrar para
      > `contato@seudominio.com.br` (Zoho Mail é grátis para 1 domínio).
      > Não é urgente: o Gmail funciona para tudo.

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
      Crie o projeto e copie **as DUAS connection strings** que ele
      mostra:

      | Variável | Qual copiar |
      |---|---|
      | `DATABASE_URL` | a **pooled** — tem `-pooler` no host |
      | `DIRECT_URL` | a **direta** — sem `-pooler` |

      > ⚠️ **Não use a direta nas duas.** Cada função da Vercel abre o
      > próprio pool de conexões; sem o PgBouncer na frente, alguns
      > acessos ao mesmo tempo estouram o limite do Neon e o site passa a
      > responder erro. Com você sozinho testando, a URL direta funciona
      > — é por isso que essa falha só aparece no dia em que o site tem
      > movimento. A direta é usada só pelo `db:push` e pelas migrações.
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

- [x] **2.1 — Apagar os imóveis fictícios** ✅ feito
      O banco de desenvolvimento foi zerado (6 imóveis, 16 fotos e 51
      eventos) e o seed não cria mais exemplos por padrão. O banco de
      produção nasce vazio.

      Para zerar um catálogo de novo (ele **pede confirmação**, e mostra
      se está num banco local ou remoto antes de qualquer coisa):
      ```bash
      node scripts/limpar-catalogo.mjs            # só lista
      node scripts/limpar-catalogo.mjs --apagar   # apaga
      ```
      Apaga imóveis, fotos e métricas. Admin, leads e a base do chatbot
      ficam de fora.
- [x] **2.2 — Textos institucionais** ✅ feito
      A história real dos donos (5 parágrafos) substituiu o texto de
      exemplo em `components/QuemSomos.tsx`. O "+400 imóveis negociados",
      que era projeção minha, foi removido a pedido deles.
- [ ] **2.3 — Depoimentos reais** 🟠 aguardando os donos
      Os 7 inventados foram removidos e a seção agora **some sozinha**
      com a lista vazia — nada falso pode ir ao ar por descuido.

      Cinco clientes já foram identificados (Sr. Alceu, Carolina, Fábio
      Trix, Érica Fit e Luiz); falta o que cada um FALOU, com
      autorização. Assim que chegarem em `lib/depoimentos.ts`, a seção
      reaparece sem mexer em mais nada.
- [ ] **2.4 — Conferir os endereços cadastrados**
      O endereço completo é **uso interno**: o site mostra só o bairro, e
      o mapa aponta a região (decisão dos donos). Confira que o **bairro**
      de cada imóvel está certo — é o que o visitante vê.

- [x] **2.5 — CRECI** ✅ confirmado
      É `118.400-F`, informado pelos donos, e vive em `lib/marca.ts`.

- [x] **2.6 — Dados da empresa na política (LGPD)** ✅ feito
      Razão social, CNPJ `05.644.262/0001-02` e a sede na Rua Alécio
      Bragatto estão em `lib/marca.ts` (`CONTROLADOR`). O aviso que o
      `npm run build` imprimia sumiu — sinal de que a página está
      completa aos olhos da LGPD.

      > ⚠️ **Confirmar antes de publicar:** os donos informaram que a
      > razão social ELODY MULTI SERVICE LTDA ME está **em processo de
      > mudança**. Ela precisa bater com a do CNPJ ao lado.

      > **Encarregado (DPO) não é obrigatório no seu caso.** A Resolução
      > ANPD nº 2/2022 dispensa o "agente de tratamento de pequeno porte"
      > de nomear um; basta ter um canal de atendimento ao titular, que é
      > o e-mail já publicado na página. O campo existe em `CONTROLADOR`
      > para o dia em que houver alguém designado, e pode ficar vazio.

- [ ] **2.7 — Mandar a política de privacidade para um advogado**
      O texto em `/privacidade` foi escrito a partir do que o sistema de
      fato faz, cobrindo bases legais, prazos, transferência
      internacional e os nove direitos do titular. **Isso não substitui
      revisão jurídica** — peça a leitura de um advogado, principalmente
      das bases legais e do trecho de transferência internacional.

---

## Fase 3 — Deploy

- [ ] **3.1 — Importar o repositório na Vercel**
      *Add New → Project* → `romavitordev/buganza_imoveis`. Ainda **não**
      clique em Deploy: cadastre as variáveis primeiro.

- [ ] **3.2 — Cadastrar as variáveis de ambiente**
      Em *Settings → Environment Variables*:

      | Variável | De onde vem |
      |---|---|
      | `DATABASE_URL` | Neon (1.2) — a **pooled**, com `-pooler` |
      | `DIRECT_URL` | Neon (1.2) — a **direta**, sem `-pooler` |
      | `AUTH_SECRET` | gere: `openssl rand -base64 32` |
      | `SUPABASE_URL` | Supabase (1.3) |
      | `SUPABASE_SERVICE_ROLE_KEY` | Supabase (1.3) — **secreta** |
      | `WHATSAPP_NUMBER` | `5515998036636` (só dígitos) |
      | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | só na hora do seed (3.4), não precisa ficar salvo |
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
      > **O catálogo nasce vazio.** O `db:seed` cria só o administrador
      > — os três imóveis de demonstração vivem no `npm run db:demo`, que
      > é comando de desenvolvimento e **não deve ser rodado aqui**. Se eles fossem para produção, o site de uma
      > imobiliária de verdade estrearia com anúncio inventado.
      >
      > Enquanto o primeiro imóvel real não entra, o catálogo mostra
      > "Estamos preparando os primeiros anúncios" com o convite ao
      > WhatsApp — e a seção de destaques da home simplesmente não
      > aparece.

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

## Fase 5 — Marca: nome e logotipo

**Feito:** a marca já é **Marcelo Imóveis**, com a paleta marinho
(`#14264A`) + dourado (`#C6A052`) do logotipo.

O nome está **centralizado**: edite **`lib/marca.ts`** e o site inteiro
acompanha — títulos das abas, rodapé, chat, remetente do e-mail, emissor
do QR da 2FA, dados estruturados do Google.

```ts
const nome = "Marcelo Imóveis";      // ← nome completo
const nomeCurto = "Marcelo Imóveis"; // ← forma curta, usada em frases
```

No mesmo arquivo estão também `creci`, `cidade`, `regiao`, `email` e
`instagram`. As cores ficam em `CORES`, no mesmo arquivo, e no
`tailwind.config.ts` (onde `black` foi trocado pelo marinho — é o que
recolore o site inteiro de uma vez).

### O arquivo do logotipo

- [ ] Colocar o logotipo oficial em **`public/logo.svg`**

É ele que a navbar e o rodapé usam. Enquanto o arquivo não existe, entra
um monograma desenhado em SVG como rede de segurança (aproximado, não é a
marca). Se o arquivo for PNG em vez de SVG, mude `ARQUIVO_LOGO` no topo de
`components/SiteNav.tsx`. Prefira SVG: fica nítido em qualquer tela.

**Ainda precisa mexer à mão em:**
- [ ] `app/icon.svg` — o favicon (desenho próprio, marinho + dourado)
- [ ] `components/QuemSomos.tsx` — o texto da história
- [ ] `lib/depoimentos.ts` — hoje a lista está **vazia**, e com ela
      vazia a seção some sozinha da home. Basta acrescentar os
      depoimentos reais (nome, contexto e texto) para ela reaparecer.
- [x] **Os números do Quem Somos** ✅ resolvido
      Sobraram **+15 anos de mercado** e **100% acompanhamento pessoal**,
      os dois vindos dos donos. O "+400 imóveis negociados" era projeção
      minha e saiu a pedido deles — prova social inventada é o tipo de
      número que o cliente cobra depois.
- [ ] Nome dos repositórios no GitHub (opcional, é cosmético)

---

## Depois que estiver no ar

- [ ] Cadastrar o site no **Google Search Console** (indexação)
- [ ] Ensinar o chatbot em `/admin/suporte` conforme as perguntas chegam
- [ ] Monitoramento de erro (**Sentry**, plano grátis) — hoje, se quebrar
      de madrugada, você só descobre pelo cliente reclamando
- [ ] Backup do banco. O Neon no plano grátis guarda histórico curto; um
      `pg_dump` mensal guardado fora dali custa nada e é a diferença
      entre um susto e perder o catálogo inteiro.
- [ ] **Agendar a limpeza de retenção (LGPD)** — uma vez por mês:
      ```bash
      npm run db:retencao            # só mostra o que apagaria
      node scripts/retencao.mjs --aplicar
      ```
      Apaga o que passou dos prazos declarados na política: audiência e
      perguntas com mais de 12 meses, contatos com mais de 24. **Prazo
      escrito na política sem nada que o cumpra é promessa falsa** — e um
      banco que só cresce descumpre a política do próprio site.
      Na Vercel dá para automatizar com um *Cron Job*.

---

## O que já está resolvido (para não refazer)

- Catálogo nasce vazio; imóveis de demonstração só com `npm run db:demo`
- `precoInterno` e endereço exato nunca saem em resposta pública
      (allowlist em `lib/dto.ts`, com teste)
- Painel com duas camadas de proteção: middleware **e** checagem em cada
      rota (testado com o middleware desligado)
- CSP e cabeçalhos de segurança, rate limit nos endpoints que escrevem
- 2FA opcional (TOTP) no login do admin
- Acessibilidade: sem imagem sem `alt`, sem campo sem rótulo, sem salto
      de título, contraste conferido nos dois temas
- 116 testes, lint e build de produção passando
