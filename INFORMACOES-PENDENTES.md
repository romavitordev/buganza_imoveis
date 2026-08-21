# O que ainda falta para o site ir ao ar

Atualizado em 21/08/2026, depois que os donos devolveram o documento de
textos preenchido (as respostas estão em `RESPOSTAS-CLIENTE.txt`).

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
| A.1 | **As falas dos 5 depoimentos** | `lib/depoimentos.ts` | 🟠 |
| A.2 | **Confirmar a razão social** | `CONTROLADOR`, em `lib/marca.ts` | 🟠 |
| A.3 | **Link da página no Facebook** | `MARCA.facebook` | 🟡 |
| A.4 | **@ definitivo do Instagram** | `MARCA.instagram` | 🟡 |
| A.5 | Foto do casal para o Quem Somos | `components/QuemSomos.tsx` | 🟢 |

> **A.1** — Os cinco clientes já têm nome (Sr. Alceu, Carolina, Fábio
> Trix, Érica Fit e Luiz); falta **o que cada um falou** e a autorização
> para publicar. De cada um: nome (pode ser só o primeiro), contexto
> ("Comprou apartamento no Campolim") e o texto.
>
> Enquanto a lista estiver vazia, a seção **some sozinha da home** —
> `components/Depoimentos.tsx` devolve `null` com zero itens. Não há mais
> risco de depoimento inventado ir ao ar por descuido, que era o
> problema da versão antiga deste documento.
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

## Falta — providências suas, fora do conteúdo

| # | O que | Risco |
|---|---|---|
| B.1 | Registrar `marcelocorretorsorocaba.com.br` (~R$ 40/ano) | 🔴 |
| B.2 | Criar as contas: Neon, Supabase, Resend, Upstash, Vercel | 🔴 |
| B.3 | Definir a senha forte do admin (**não** a do exemplo) | 🔴 |
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
| 7 depoimentos inventados, sem guarda de lista vazia | Removidos, e agora a seção some sozinha quando a lista está vazia |
| Horário "9h às 18h" | Corrigido para **9h às 19h** |
| Catálogo com 6 imóveis de demonstração | Zerado, e o seed não cria exemplos por padrão |
| Regras de negócio afirmadas sem confirmação | Todas confirmadas pelos donos e corrigidas no chatbot e no FAQ |
| Assinatura do rodapé vazia | **Roma & Buganza Estúdio**, com link para o portfólio |

---

## O que trava o lançamento, em ordem

1. **B.1 e B.2** — sem domínio e sem contas não há onde publicar.
2. **A.2** — razão social errada na política é falha legal, não estética.
3. **A.1** — sem as falas o site vai ao ar sem a seção de depoimentos.
   Não impede o lançamento, mas é a seção que mais convence numa
   imobiliária.

O resto entra depois do site no ar sem complicação: tudo mora em
`lib/marca.ts` ou `lib/depoimentos.ts`.
