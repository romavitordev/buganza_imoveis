# O que ainda falta para o site ir ao ar

Atualizado em 07/09/2026. A base veio do documento de textos que os
donos devolveram preenchido (respostas em `RESPOSTAS-CLIENTE.txt`);
depois chegaram os depoimentos reais e o WhatsApp definitivo.

A versão anterior deste arquivo virou a maior fonte de dado velho do
repositório: ainda descrevia o e-mail como inventado e o CRECI como
desconhecido, coisas resolvidas desde então. Documento de pendência que
não é atualizado deixa de ser mapa e vira armadilha — quem lê acredita e
sai consertando o que já estava certo. Por isso ele agora tem duas
listas curtas: **o que falta de verdade** e **o que já foi**.

**Legenda de risco**
🔴 não pode ir ao ar assim · 🟠 problema sério · 🟡 fica capenga · 🟢 cosmético

---

## Falta — conteúdo que só os donos têm

| # | O que | Onde entra | Risco |
|---|---|---|---|
| A.1 | Mais depoimentos (3 já no ar) | `lib/depoimentos.ts` | 🟢 |
| A.2 | **Confirmar a razão social** | `CONTROLADOR`, em `lib/marca.ts` | 🟠 |
| A.3 | **Link da página no Facebook** | `MARCA.facebook` | 🟡 |
| A.4 | **@ definitivo do Instagram** | `MARCA.instagram` | 🟡 |
| A.5 | Foto do casal para o Quem Somos | `components/QuemSomos.tsx` | 🟢 |

> **A.1 — resolvido.** Em 07/09/2026 chegaram três depoimentos reais —
> Érica Acosta, Sandra Acosta e Amanda Carrijo — e a seção voltou ao ar
> com eles. São os primeiros depoimentos verdadeiros do site.
>
> Fica em verde, e não fechado, só porque três é pouco para um
> carrossel: acrescentar mais melhora a seção. Não é pendência de
> lançamento. Para incluir alguém: nome, contexto e a fala, com
> autorização de quem falou.
>
> Se um dia a lista voltar a ficar vazia, a seção **some sozinha da
> home** — `Depoimentos.tsx` devolve `null` com zero itens.
>
> **A.2** — Eles informaram **ELODY MULTI SERVICE LTDA ME** e disseram
> que a razão social está **em processo de mudança**. A que aparece na
> política de privacidade precisa ser a mesma do cartão CNPJ; senão a
> identificação do controlador que a LGPD exige (art. 9º) aponta para
> uma empresa que não existe mais.
>
> **A.4** — Hoje está `nina_buganza`, o perfil **pessoal**, por decisão
> dos donos enquanto o perfil da imobiliária não existe. Está certo para
> hoje; vira problema no dia em que migrarem e ninguém trocar aqui.
>
> **A.3** — O rodapé aponta para uma busca por "Imóvel Vago Sorocaba"
> em vez do endereço da página, porque o permalink não foi informado.
> Funciona, mas é um clique a mais e depende do que o Facebook resolver
> mostrar.

---

## Falta — dados dos imóveis, campo a campo

Levantado **direto do banco de produção em 13/09/2026**, não de
anotação — o que está abaixo é o que o Neon realmente não tem hoje.
Substitui o antigo `IMOVEIS-A-CADASTRAR.md`, que era o documento de
digitação dos 7 e cumpriu seu papel quando eles entraram no ar.

Todo campo aqui se preenche pelo painel, em *Imóveis → editar*.

### 🔴 Está no ar sem preço

| Imóvel | Problema |
|---|---|
| **MIS-0003 — Barracão Vila Gabriel** | ATIVO, para locação, **sem valor de aluguel** |

Um anúncio publicado sem preço faz o visitante sair da página: ou ele
acha que é caro demais para estar escrito, ou desiste de perguntar. Se
for proposital ("sob consulta"), tudo bem — mas é bom que seja decisão,
não esquecimento.

### 🟠 Segura o MIS-0004 (Santa Rosália) pausado

Falta **preço de venda**, **área construída** e **banheiros**. Enquanto
o preço não vier, ele fica invisível no site — que é o certo. Os outros
seis estão ativos.

### 🟡 Ficha incompleta, mas publicável

| Campo | Quem está sem |
|---|---|
| banheiros | todos menos o Ibiti (0001) |
| vagas | Barracão (0003), Aldeia (0006), Bosque (0007), Ibiti (0001) |
| área construída | Santa Rosália (0004), Aldeia (0006) |

Ficha vazia não quebra nada, mas cada campo em branco é uma pergunta a
mais que chega no WhatsApp — e uma comparação a menos que o visitante
consegue fazer sozinho.

### Fotos — todas no ar

**100 fotos**, distribuídas nos sete (12 · 9 · 15 · 8 · 18 · 25 · 13),
com a capa escolhida em cada um. Nada pendente aqui.

> **Ao trocar ou acrescentar foto, olhe o que ela mostra.** Telefone em
> placa de "aluga-se", número da casa na fachada, placa de carro, nome
> de rua. Número da casa mais fachada, num anúncio que diz que o imóvel
> está vazio, basta para localizar o lugar. O site publica exatamente o
> que sobe — não há edição automática.

---

## Falta — providências suas, fora do conteúdo

| # | O que | Risco |
|---|---|---|
| ~~B.1~~ | ~~Registrar domínio~~ — `marceloimoveissorocaba.com.br` registrado pelos donos | ✅ |
| B.2 | Criar a conta na **Vercel** e importar o repositório — Neon, Supabase, Resend e Upstash já estão de pé | 🔴 |
| ~~B.3~~ | ~~Senha forte do admin~~ — definida e o usuário já criado no Neon | ✅ |
| B.4 | Revisão da política de privacidade por advogado | 🟠 |
| B.5 | Agendar o `npm run db:retencao` mensal (LGPD) | 🟡 |

O passo a passo de cada uma está no **CHECKLIST-DEPLOY.md**.

---

## Já resolvido — não mexa achando que falta

| O que era | Como ficou |
|---|---|
| E-mail inventado `contato@marceloimoveis.com.br` | `marceloimoveissorocaba@gmail.com` — no site, no `.env` e como login do painel |
| CRECI `118400`, sem formatação e chumbado no hero | `118.400-F`, saindo de `lib/marca.ts` em todas as telas |
| Nome "Marcelo Imóveis" indefinido | **Marcelo Imóveis Sorocaba** (a forma curta ficou para dentro de frases) |
| WhatsApp `15 99829-6767`, não confirmado | `15 99803-6636`, informado pelos donos |
| Razão social, CNPJ e endereço vazios (🔴 LGPD) | Preenchidos — falta só confirmar a razão social (A.2) |
| História do Quem Somos inventada | Substituída pela história real dos donos |
| "+400 imóveis negociados" | **Removido** — era projeção minha, ninguém confirmou |
| 7 depoimentos inventados, sem guarda de lista vazia | Removidos; a seção some sozinha com lista vazia e hoje exibe **3 reais** |
| Horário "9h às 18h" | Corrigido para **9h às 19h** |
| Catálogo com 6 imóveis de demonstração | Zerado, e o seed não cria exemplos por padrão |
| Regras de negócio afirmadas sem confirmação | Todas confirmadas pelos donos e corrigidas no chatbot e no FAQ |
| Assinatura do rodapé vazia | **Roma & Buganza Estúdio**, com link para o portfólio |

---

## O que trava o lançamento, em ordem

1. **B.1 e B.2** — sem domínio e sem contas não há onde publicar.
2. **A.2** — razão social errada na política é falha legal, não estética.

O resto entra depois do site no ar sem complicação: tudo mora em
`lib/marca.ts` ou `lib/depoimentos.ts`.
