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
| 🔴 tudo | domínio (Fase 0) | você |
| 🔴 deploy | contas: Neon, Supabase, Resend, Upstash, Vercel (Fase 1) | você |
| 🟠 anúncio | **fotos dos 7 imóveis** — nenhum tem foto ainda | donos |
| 🟠 anúncio | transação e preço de Santa Rosália e Fit Campolim | donos |
| 🟠 legal | confirmar a razão social — está em processo de mudança (2.6) | donos |
| 🟠 legal | revisão da política de privacidade por advogado | você |
| 🟡 estética | logotipo oficial em `public/logo.svg` | donos |
| 🟢 depois | Search Console, Sentry, ensinar o chatbot | você |

**Conteúdo: o site já tem o que precisa para existir.** Nome, CRECI,
CNPJ, WhatsApp e e-mail são reais; os depoimentos são de três clientes
de verdade; os 7 imóveis estão cadastrados com dados vindos dos donos.
Nada de inventado está no ar.

O que falta é **foto**. Um catálogo sem foto abre e funciona, mas não
vende: ninguém decide visitar um imóvel que não viu. É a única coisa
entre o site pronto e o site útil.

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
      Crie uma API key (`re_...`). O plano gratuito dá 3.000 e-mails por
      mês — muito além do volume de uma imobiliária local.

      **O que ele resolve:** quando alguém deixa contato pelo chat do
      site, chega um e-mail com **nome, WhatsApp clicável, qual imóvel a
      pessoa estava vendo e a mensagem**, mais um botão para abrir a
      caixa de leads. O WhatsApp vem como link: dá para responder do
      celular em um toque, sem digitar o número.

      > **Por que vale a pena:** sem ele, o contato é gravado do mesmo
      > jeito e fica em `/painel-mis/leads` — mas ninguém é avisado, e só é
      > visto quando alguém lembra de abrir o painel. Contato parado
      > alguns dias é cliente que já ligou para outra imobiliária.
- [ ] **1.5 — Upstash** (<https://upstash.com>) → rate limit · grátis
      Crie um banco **Redis** e copie a **URL e o token REST**.
- [ ] **1.6 — Vercel** (<https://vercel.com>) → hospedagem
      Entre com a conta do GitHub.
      > ⚠️ O plano Hobby é oficialmente **não-comercial**. Para uma
      > imobiliária, o correto é o **Pro (US$ 20/mês ≈ R$ 110)**. Dá para
      > começar no Hobby validando, mas saiba do risco.

---

## Fase 2 — Preparar o conteúdo (antes de qualquer um ver)

- [x] **2.1 — Catálogo real no lugar dos exemplos** ✅ feito
      Os imóveis de demonstração saíram e entraram os **7 reais**
      enviados pelos donos, com código `MIS-`. Estão escritos em
      `scripts/cadastrar-imoveis-reais.mjs`, que é o que vai popular
      produção no passo 3.5 — ninguém vai redigitar nada no painel.

      | | | |
      |---|---|---|
      | MIS-0001 | Casa Ibiti do Paço | ● ativo |
      | MIS-0002 | Apto Trix Home Horto | ● ativo |
      | MIS-0003 | Barracão Vila Gabriel | ● ativo |
      | MIS-0004 | Casa Santa Rosália | ⏸ pausado |
      | MIS-0005 | Apto Fit Campolim | ⏸ pausado |
      | MIS-0006 | Casa Aldeia da Mata | ● ativo |
      | MIS-0007 | Casa Bosque São Bento | ● ativo |

      Os dois pausados vieram sem transação e sem preço; ficam invisíveis
      no site até os dados chegarem.

      Para zerar um catálogo (ele **pede confirmação** e mostra se o
      banco é local ou remoto antes de qualquer coisa):
      ```bash
      node scripts/limpar-catalogo.mjs            # só lista
      node scripts/limpar-catalogo.mjs --apagar   # apaga
      ```

- [x] **2.8 — Fotos dos imóveis** ✅ feito
      **100 fotos no ar**, distribuídas nos 7 imóveis, cada uma com a
      capa escolhida. Verificado no bucket: nenhuma quebrada.

      A ordem foi montada foto a foto — a primeira de cada imóvel é a
      capa, que aparece no card do catálogo e na prévia do link no
      WhatsApp. As pastas em `fotos/` continuam sendo a fonte da
      verdade; `fotos/LEIA-ME.md` tem o passo a passo para acrescentar
      ou trocar.
- [x] **2.2 — Textos institucionais** ✅ feito
      A história real dos donos (5 parágrafos) substituiu o texto de
      exemplo em `components/QuemSomos.tsx`. O "+400 imóveis negociados",
      que era projeção minha, foi removido a pedido deles.
- [x] **2.3 — Depoimentos reais** ✅ três no ar
      Os 7 inventados foram removidos e a seção agora **some sozinha**
      com a lista vazia — nada falso pode ir ao ar por descuido.

      Chegaram em 07/09/2026: Érica Acosta, Sandra Acosta e Amanda
      Carrijo. A seção voltou à home. Para acrescentar mais, basta
      editar `lib/depoimentos.ts` — nome, contexto e a fala, com
      autorização de quem falou.
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
      | `RESEND_API_KEY` | Resend (1.4) — a chave `re_...` |
      | `LEAD_NOTIFY_EMAIL` | quem recebe o aviso: o e-mail da 0.2 |
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
      > O `db:seed` cria **só o administrador**. Os imóveis vêm no passo
      > seguinte. O `npm run db:demo`, que cria exemplos inventados, é
      > comando de desenvolvimento e **não deve ser rodado aqui**.

- [ ] **3.5 — Levar os 7 imóveis para o banco de produção**
      Eles já estão escritos em código, então não precisam ser digitados
      de novo no painel:
      ```bash
      DATABASE_URL="<url do Neon>" node scripts/cadastrar-imoveis-reais.mjs --aplicar --forcar-remoto
      ```
      > **`--forcar-remoto` é obrigatório de propósito.** O script APAGA
      > o catálogo antes de recriar — o que é o certo num banco vazio e
      > destrutivo em qualquer outro. Rode este comando **uma vez**, no
      > banco recém-criado. Depois disso, imóvel se cadastra e edita pelo
      > painel; se rodar de novo, perde o que foi feito por lá, fotos
      > incluídas.
      >
      > Sem o `--forcar-remoto`, ele se recusa a rodar e explica.
      >
      > Vão 5 imóveis ATIVOS e 2 PAUSADOS (Santa Rosália e Fit Campolim,
      > que estão sem transação e sem preço). Os pausados não aparecem no
      > site — quando os dados chegarem, é editar e ativar no painel.

- [ ] **3.6 — Deploy** → botão *Deploy* na Vercel.

- [x] **3.7 — Fotos no Supabase** ✅ feito
      As 100 subiram por `scripts/importar-fotos.ts`, que usa o MESMO
      `lib/storage.ts` do painel — não há uma segunda implementação de
      upload. Para acrescentar ou trocar depois, tanto faz: o script
      (que preserva a ordem das pastas) ou o painel, que comprime cada
      foto no navegador antes de enviar.
      > Foto acima de 5 MB o script recusa e diz qual é — essa vai pelo
      > painel, que reduz para 1920px sozinho.
      >
      > A **primeira foto** de cada imóvel é a capa: é ela que aparece no
      > card e na prévia do link no WhatsApp.
      >
      > Antes de enviar, confira o que a foto mostra: telefone em placa,
      > número da casa na fachada, placa de carro. O site publica
      > exatamente o que sobe.

- [ ] **3.8 — Apontar o domínio**
      Na Vercel: *Settings → Domains* → adicione seu domínio. Ela mostra
      os registros DNS; cadastre-os no painel do Registro.br.

---

## Fase 4 — Verificação (não pule)

- [ ] **4.1 — Abrir o site** e navegar: home, catálogo, um imóvel.
- [ ] **4.2 — Testar o "deixar contato" do chat** → abra o chat no site,
      escolha deixar contato e envie. Duas coisas têm que acontecer: o
      registro aparecer em `/painel-mis/leads` **e** chegar o e-mail de aviso.
      > Se o registro aparecer e o e-mail não, o problema está só nas
      > variáveis do Resend — o contato não se perdeu. Confira
      > `RESEND_API_KEY` e `LEAD_NOTIFY_EMAIL` na Vercel.
      >
      > Teste **clicando no link do WhatsApp dentro do e-mail**: é assim
      > que vocês vão responder no dia a dia.
- [ ] **4.3 — Testar o WhatsApp** → o botão abre a conversa com o número
      certo?
- [ ] **4.4 — Numa aba anônima:** abrir `/painel-mis` → tem que redirecionar
      para o login. Abrir `/api/admin/properties` → tem que dar **401**.
- [ ] **4.5 — Ativar a 2FA** em *Minha conta* (escaneie o QR).
      > Leia antes a seção do `AUTH_SECRET` no DEPLOY.md — trocá-lo
      > depois **derruba a 2FA**.
- [ ] **4.6 — Conferir os 7 imóveis** que subiram no 3.5: preço, bairro
      e área de cada um, e se as fotos ficaram na ordem certa.
      Confirme também que **Santa Rosália e Fit Campolim NÃO aparecem**
      no catálogo público — eles devem estar só no painel, pausados.
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
- [ ] Ensinar o chatbot em `/painel-mis/suporte` conforme as perguntas chegam
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
