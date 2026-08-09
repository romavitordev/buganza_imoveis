# Informações que faltam para o site ir ao ar

Levantamento feito varrendo o código, não de memória. Cada item diz
**onde está hoje**, **o que está no lugar** e **o risco de publicar
assim**.

Responda direto neste arquivo (ou me mande as respostas) que eu aplico.

**Legenda de risco**
🔴 não pode ir ao ar assim · 🟠 problema sério · 🟡 fica capenga · 🟢 cosmético

---

## 1. Contato e identidade

| # | O que preciso | Está hoje | Risco |
|---|---|---|---|
| 1.1 | **E-mail real da imobiliária** | `contato@marceloimoveis.com.br` — **domínio não existe**, e-mail inventado | 🔴 |
| 1.2 | **Nome definitivo** | "Marcelo Imóveis" | 🟡 |
| 1.3 | **Número do CRECI** | `118400` | 🟠 |
| 1.4 | **@ do Instagram** | `marceloimoveis.sorocaba` — **não confirmado se existe** | 🟠 |
| 1.5 | Outras redes (Facebook, TikTok, YouTube) | nenhuma no site | 🟢 |
| 1.6 | **Número do WhatsApp** | `+55 15 99829-6767` | 🟠 confirmar |
| 1.7 | Cidade e região de atuação | Sorocaba/SP · "Sorocaba e região" | 🟡 |

> **1.1 é o mais urgente.** O e-mail aparece no rodapé, na política de
> privacidade e é para onde vão os avisos de lead. Um e-mail que não
> existe = cliente escreve e ninguém recebe.
>
> **1.4:** um `@` errado leva o visitante para um perfil de outra pessoa.
> Se não houver Instagram ainda, me diga que eu **removo o link** — é
> melhor não ter do que ter quebrado.

**Suas respostas:**
- 1.1 E-mail: `_______________`
- 1.2 Nome: `_______________`
- 1.3 CRECI: `_______________`
- 1.4 Instagram: `_______________` (ou "não temos")
- 1.5 Outras redes: `_______________`
- 1.6 WhatsApp: `_______________`
- 1.7 Região: `_______________`

---

## 2. Dados da empresa (LGPD)

| # | O que preciso | Está hoje | Risco |
|---|---|---|---|
| 2.1 | **Razão social** (como no cartão CNPJ) | vazio | 🔴 |
| 2.2 | **CNPJ** | vazio | 🔴 |
| 2.3 | **Endereço da sede** com CEP | vazio | 🔴 |

Ficam em `lib/marca.ts` → `CONTROLADOR`. A lei exige que quem trata os
dados esteja identificado. Hoje a página se identifica só pelo nome
fantasia e CRECI — verdadeiro, mas incompleto.

> **Encarregado (DPO) não precisa.** A Resolução ANPD nº 2/2022 dispensa
> empresa de pequeno porte de nomear um; basta o canal de contato, que já
> é o e-mail.

**Suas respostas:**
- 2.1 Razão social: `_______________`
- 2.2 CNPJ: `_______________`
- 2.3 Endereço: `_______________`

---

## 3. Textos institucionais

| # | O que preciso | Está hoje | Risco |
|---|---|---|---|
| 3.1 | **História real do casal** | Texto inventado: "nasceu da parceria de um casal que resolveu fazer diferente: menos vitrine, mais conversa" | 🟠 |
| 3.2 | **Frase da marca (tagline)** | "Conectando pessoas aos melhores lugares." — escrita por mim | 🟡 |
| 3.3 | Nome do assistente do chat | "Assistente Marcelo" | 🟢 |

`3.1` fica em `components/QuemSomos.tsx`. É o texto que responde "quem
são vocês" — o único lugar do site onde a imobiliária fala de si.

**Suas respostas:**
- 3.1 História (3–5 linhas): `_______________`
- 3.2 Tagline: `_______________` (ou "pode manter")

---

## 4. Números na home 🔴

Aparecem grandes na seção Quem Somos, como prova social:

| # | Número | Origem | Risco |
|---|---|---|---|
| 4.1 | **+400 imóveis negociados** | **projeção minha**, ninguém confirmou | 🔴 |
| 4.2 | +15 anos de mercado | veio dos donos | 🟡 confirmar |
| 4.3 | 100% acompanhamento pessoal | afirmação de postura | 🟡 |

> **4.1 é o item mais arriscado do site.** Número de prova social
> inventado é o tipo de coisa que um concorrente ou um cliente cobra
> depois. Se não souberem o número exato, o melhor caminho é **trocar
> por algo verificável** ("atendimento 100% pelos sócios") ou **remover o
> bloco de números**. Me diga qual.

**Suas respostas:**
- 4.1 Imóveis negociados: `_______________` (ou "remover")
- 4.2 Anos de mercado: `_______________`
- 4.3 Terceiro número: `_______________`

---

## 5. Depoimentos 🔴

São **7 depoimentos inventados** em `lib/depoimentos.ts`: Mariana e
Felipe, José Carlos, Ana Paula, Ricardo, Família Oliveira, Camila e mais
um.

**Publicar depoimento falso é propaganda enganosa** (CDC, art. 37).

Três caminhos:
- **a)** Você manda depoimentos reais (com autorização de quem falou)
- **b)** Eu **escondo a seção** até existirem reais
- **c)** Mantém como está — **não recomendo**

> ⚠️ Se você simplesmente apagar o conteúdo do arquivo, **a seção não
> some** — ela fica na home vazia. Não existe guarda de lista vazia. Se
> for tirar, me peça junto.

**Para cada depoimento real preciso de:** nome (pode ser só o primeiro),
contexto ("Comprou apartamento no Campolim") e o texto.

**Sua escolha:** `a` / `b` / `c` → `_______________`

---

## 6. Regras de negócio que o site afirma 🟠

O chatbot e o FAQ afirmam isto como política da empresa. **Se não for
verdade, é promessa que vocês terão que cumprir:**

| # | Afirmação no site | Confere? |
|---|---|---|
| 6.1 | "Anunciar é **sem taxa, sem mensalidade e sem exclusividade forçada** — só paga comissão quando fecha" | `___` |
| 6.2 | "**Cuidamos das fotos**, do anúncio e da divulgação" | `___` |
| 6.3 | "Atendemos **de segunda a sábado**" | `___` |
| 6.4 | "Fazemos **visitas inclusive aos sábados**" | `___` |
| 6.5 | "Pelo WhatsApp **respondemos no mesmo dia**" | `___` |
| 6.6 | "Ajudamos com **financiamento**" | `___` |
| 6.7 | Percentual da comissão de corretagem | não dito no site — dizer ou não? `___` |

Ficam em `lib/chatbot.ts` e `components/Faq.tsx`.

---

## 7. Imagens da marca

| # | O que preciso | Está hoje | Risco |
|---|---|---|---|
| 7.1 | **Logotipo oficial** | `public/logo.png` (73 KB) e `logo-escuro.png` — **confirmar se é o definitivo** | 🟡 |
| 7.2 | Versão vetorial (SVG) | não existe | 🟢 |
| 7.3 | **Favicon** | `app/icon.svg` — desenho meu, marinho + dourado | 🟡 |
| 7.4 | Foto do casal para o Quem Somos | não existe | 🟢 |

> 7.4 é sugestão minha: a seção fala de "um casal de corretores" e não
> mostra ninguém. Foto de gente real converte mais que texto.

---

## 8. Domínio e contas (você resolve, não é conteúdo)

| # | O que falta | Risco |
|---|---|---|
| 8.1 | **Domínio** registrado no Registro.br (~R$ 40/ano) | 🔴 |
| 8.2 | Contas: Neon, Supabase, Resend, Upstash, Vercel | 🔴 |
| 8.3 | Senha forte do admin | 🔴 |
| 8.4 | Revisão da política de privacidade por advogado | 🟠 |

Passo a passo completo em `CHECKLIST-DEPLOY.md`.

---

## Resumo: o que trava o lançamento

1. **E-mail real** (1.1) — trava o deploy inteiro
2. **Domínio** (8.1) — trava tudo depois dele
3. **+400 imóveis** (4.1) — número inventado no ar
4. **7 depoimentos falsos** (5) — propaganda enganosa
5. **CNPJ e razão social** (2.1–2.3) — exigência legal

O resto pode entrar depois do site no ar, sem prejuízo.
