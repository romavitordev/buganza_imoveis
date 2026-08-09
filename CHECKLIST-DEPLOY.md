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
| 🟠 ir ao ar | depoimentos reais — os 7 do site são inventados (2.3) | donos |
| 🟠 ir ao ar | história do Quem Somos e o número "+400 imóveis" | donos |
| 🔴 legal | razão social, CNPJ e endereço na política (LGPD) | donos |
| 🟠 legal | revisão da política de privacidade por advogado | você |
| 🟡 estética | logotipo oficial em `public/logo.svg` | donos |
| 🟢 depois | Search Console, Sentry, ensinar o chatbot | você |

Os dois 🟠 são de **conteúdo falso no ar**, não de bug: depoimento
inventado no site de uma imobiliária de verdade é propaganda enganosa.
O catálogo já foi resolvido — nasce vazio e não tem como publicar imóvel
de demonstração por descuido.

---

## Fase 0 — Decisões que só você pode tomar

Estas travam o resto. Resolva antes de mexer em plataforma.

- [ ] **0.1 — Confirmar o nome da imobiliária**
      Hoje o site usa **"Marcelo Imóveis"** (em `lib/marca.ts`). Se for
      mudar, decida agora: o nome entra no domínio, no e-mail e no
      cadastro do Registro.br.
      → Trocar no código é uma linha: veja a Fase 5.

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
- [ ] **2.2 — Revisar os textos institucionais**
      `components/QuemSomos.tsx` tem a história do casal — hoje é
      fictícia. Reescreva com a história real.
- [ ] **2.3 — Revisar os depoimentos**
      `lib/depoimentos.ts` tem depoimentos inventados. **Publicar
      depoimento falso é propaganda enganosa** — troque por reais (com
      autorização de quem falou) ou apague a seção.
- [ ] **2.4 — Conferir os endereços cadastrados**
      O endereço completo é **uso interno**: o site mostra só o bairro, e
      o mapa aponta a região (decisão dos donos). Confira que o **bairro**
      de cada imóvel está certo — é o que o visitante vê.

- [ ] **2.5 — Conferir o CRECI**
      Hoje é `118400`, em `lib/marca.ts`. Confirme que é o número certo.

- [ ] **2.6 — Preencher os dados da empresa na política (LGPD)** 🔴
      Em `lib/marca.ts`, na constante `CONTROLADOR`: **razão social, CNPJ
      e endereço**. A LGPD exige que quem trata os dados esteja
      identificado (art. 9º).

      Enquanto estiver vazio, a página **não fica quebrada nem mostra
      colchete de "preencher"** — bilhete interno no meio do texto é pior
      para o visitante do que a lacuna que ele denuncia. Ela identifica a
      imobiliária pelo nome fantasia e pelo CRECI, que é verdade e é
      publicável; falta só o CNPJ para ficar completa.

      Quem cobra a pendência é o `npm run build`, que imprime um aviso no
      terminal — o visitante nunca vê.

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
      | `DATABASE_URL` | Neon (1.2) |
      | `AUTH_SECRET` | gere: `openssl rand -base64 32` |
      | `SUPABASE_URL` | Supabase (1.3) |
      | `SUPABASE_SERVICE_ROLE_KEY` | Supabase (1.3) — **secreta** |
      | `WHATSAPP_NUMBER` | `5515998296767` (só dígitos) |
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
- [ ] `lib/depoimentos.ts` — os 7 depoimentos são inventados. **Aviso:
      apagar o conteúdo do arquivo NÃO esconde a seção** — ela fica na
      home vazia, porque não existe guarda de lista vazia. Se for tirar
      antes de ter os reais, peça o ajuste junto.
- [ ] **Os três números do Quem Somos.** Hoje estão **+400 imóveis
      negociados · +15 anos de mercado · 100% acompanhamento pessoal**.
      Os 15 anos vieram dos donos; o **+400 é projeção** feita a partir
      disso e precisa ser confirmado antes de ir ao ar — número de prova
      social errado no site é o tipo de coisa que o cliente cobra depois.
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
