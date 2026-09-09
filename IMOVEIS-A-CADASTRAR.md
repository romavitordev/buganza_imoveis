# Os 7 imóveis reais — o que o banco precisa e o que falta

> **Status em 08/09/2026:** os sete já estão cadastrados. Os três de
> demonstração foram apagados e o prefixo do código virou `MIS-`.
>
> **Cinco estão ativos** (MIS-0001, 0002, 0003, 0006, 0007).
> **Dois nasceram PAUSADOS** — Santa Rosália (MIS-0004) e Fit Campolim
> (MIS-0005) —, porque vieram sem transação e sem preço. Pausado não
> aparece no site: eles ficam visíveis só no painel, esperando o dado.
>
> O cadastro está escrito em `scripts/cadastrar-imoveis-reais.mjs` e pode
> ser refeito do zero a qualquer momento. **Falta a foto de todos** — o
> que segue abaixo continua valendo como lista do que preencher.

Levantado em 08/09/2026, a partir das mensagens do Marcelo, cruzando com
os campos que o formulário do painel realmente exige.

---

## Como o banco pensa um imóvel

**Obrigatório** (o painel não salva sem): título, cidade, bairro,
descrição, tipo, transação.
O **código** (`BZ-0001`) e o endereço da página são gerados sozinhos.

**Opcional, mas é o que enche a ficha:** quartos, suítes, banheiros,
vagas, área construída, área do terreno, condomínio, IPTU, comodidades,
vídeo.

Três detalhes que mudam o cadastro:

- **Suítes contam dentro de quartos.** "3 quartos, sendo 1 suíte" é
  `quartos: 3, suites: 1` — não 4.
- **Preço vazio vira "Sob consulta"** no site, sozinho. É o caso do
  barracão.
- **Existe um preço interno**, separado do público, para a margem de
  negociação de vocês. Ele nunca sai do painel — há um teste automático
  que falha se algum dia vazar para o site.

---

## Três coisas para decidir antes de cadastrar

### 1. IPTU: o campo é ANUAL, e vocês mandaram valores mensais 🔴

O site escreve literalmente `IPTU R$ X/ano`. O Bosque São Bento veio
como "IPTU R$ 1.000 **por mês**" e o Trix como "Iptu 55" (que só faz
sentido sendo mensal).

Cadastrado do jeito que veio, o site anunciaria **IPTU de R$ 1.000 por
ano** num imóvel que custa R$ 12.000 de IPTU. É erro de anúncio, não de
digitação — o interessado desconta isso da conta dele.

Preciso saber qual dos dois vocês preferem:

- **a)** eu multiplico por 12 na hora de cadastrar (1.000 → 12.000)
- **b)** eu troco o campo para IPTU **mensal**, que é como vocês falam

Recomendo **(b)**: o dado chega mensal de vocês, e todo cadastro futuro
teria que lembrar de converter. Sistema que exige conta de cabeça acaba
errando.

### 2. O "pacote" do Ibiti do Paço 🟠

"Pacote de Aluguel com condomínio e IPTU R$ 6.000" é **um número que já
soma tudo**. O site tem três campos separados e os mostra em sequência —
se eu puser 6.000 no aluguel e também preencher condomínio e IPTU, a
página passa a impressão de que se paga tudo isso **além** dos 6.000.

Vou cadastrar R$ 6.000 como aluguel, deixar condomínio e IPTU **vazios**
e dizer na descrição que o valor já inclui os dois. Se preferir mostrar
os três separados, me mande os valores destacados.

### 3. O prefixo do código: ainda é `BZ` 🟡

Os imóveis nascem como `BZ-0001`, `BZ-0002` — "BZ" de Buganza, o nome
antigo. **Agora é a hora de trocar**: o código entra no endereço de cada
anúncio e é por ele que vocês vão se referir aos imóveis no WhatsApp.
Depois de cadastrar e divulgar, mudar significa renumerar tudo e quebrar
os links já enviados.

Sugestão: `MIS-0001` (Marcelo Imóveis Sorocaba). Me diga o que prefere.

---

## Imóvel a imóvel

Legenda: ✅ tenho · ❌ falta · ⚠️ precisa confirmar

### 1. Casa no Condomínio Ibiti do Paço — venda e locação

| campo | valor |
|---|---|
| tipo / subtipo | Residencial · Casa ✅ |
| transação | Venda e locação ✅ |
| bairro | Ibiti do Paço ✅ |
| área construída | 220 m² ✅ |
| quartos / suítes / banheiros | 3 / 1 / 3 ✅ |
| venda | R$ 990.000 ✅ |
| locação | R$ 6.000 (pacote — ver item 2 acima) ⚠️ |
| **vagas** | ❌ |
| **área do terreno** | ❌ |

Comodidades: piscina, churrasqueira, playground, condomínio fechado,
quadra, mini market. *(lago, pista de skate e feira ficam na descrição)*

### 2. Apartamento Trix Home Horto — locação

| campo | valor |
|---|---|
| tipo / subtipo | Residencial · Apartamento ✅ |
| área | 60 m² ✅ |
| quartos / suítes / vagas | 2 / 1 / 1 ✅ |
| locação | R$ 2.500 ✅ |
| condomínio | R$ 428 ✅ |
| IPTU | R$ 55 — mensal? ⚠️ |
| **banheiros** | ❌ |
| **bairro** | ⚠️ "Horto" é o nome do prédio; qual o bairro? |
| **fotos** | ❌ o link que veio depois era do barracão |

Comodidades: mobiliado, piscina, quadra, playground, mini market, salão
de festas, área gourmet.

### 3. Barracão Vila Gabriel — locação

| campo | valor |
|---|---|
| tipo / subtipo | Comercial · Galpão ✅ |
| bairro | Vila Gabriel ✅ |
| área | 200 m² ✅ |
| locação | Sob consulta ✅ *(confirmar na segunda)* |
| **descrição** | ❌ é campo obrigatório e não veio nada |
| **pé-direito, banheiro, energia** | ❌ o que interessa em galpão |

> É o mais vazio dos sete. Com área e mais nada, o anúncio fica pobre
> justamente no que um interessado em galpão procura.

### 4. Casa em Santa Rosália

| campo | valor |
|---|---|
| tipo / subtipo | Residencial · Casa ✅ |
| bairro | Santa Rosália ✅ |
| quartos / suítes | 3 / 1 ✅ |
| vagas | 4 cobertas (até 8 carros) ✅ |
| **transação** | 🔴 venda? locação? não foi dito |
| **preço** | 🔴 nenhum valor veio |
| **área** | ❌ |

Comodidades: vaga coberta, acessibilidade, lavanderia.

### 5. Apartamento Fit Campolim

| campo | valor |
|---|---|
| tipo / subtipo | Residencial · Apartamento ✅ |
| bairro | Campolim ✅ |
| área | 55 m² ✅ |
| quartos / suítes / vagas | 2 / 1 / 1 ✅ |
| **transação** | 🔴 não foi dito |
| **preço** | 🔴 nenhum valor veio |
| **banheiros** | ❌ |

Comodidades: varanda, piscina, academia, brinquedoteca, área gourmet,
salão de festas, mini market.

> ⚠️ **"Cond. 850 / IPTU 6.100" é deste apartamento ou da Aldeia da
> Mata?** A mensagem veio entre os dois. Um IPTU de R$ 6.100 **por ano**
> é alto para 55 m² e coerente para uma casa de 600 m² — mas é palpite
> meu, e nesse campo palpite vira anúncio errado.

### 6. Casa no Condomínio Aldeia da Mata — venda

| campo | valor |
|---|---|
| tipo / subtipo | Residencial · Casa ✅ |
| **cidade** | **Votorantim** ✅ *(única fora de Sorocaba)* |
| terreno | 600 m² (2 lotes) ✅ |
| quartos / suítes | 3 / 3 ✅ |
| venda | R$ 1.600.000 ✅ |
| **área construída** | ❌ |
| **banheiros / vagas** | ❌ |

Comodidades: piscina, churrasqueira, área gourmet, lareira, aquecimento
solar, ar-condicionado, portaria 24h, condomínio fechado, quadra,
playground, quintal.

> Aceita permuta parcial por casa menor em condomínio — vai na descrição.
> **Sem fotos:** nenhum link veio para esta casa.

### 7. Casa no Condomínio Bosque São Bento — venda e locação

| campo | valor |
|---|---|
| tipo / subtipo | Residencial · Casa ✅ |
| bairro | Campolim ✅ |
| terreno / construída | 1.680 m² / 720 m² ✅ |
| quartos / suítes | 4 / 4 ✅ |
| venda | R$ 4.250.000 ✅ |
| locação | R$ 20.000 ✅ |
| condomínio | R$ 2.800 ✅ |
| IPTU | R$ 1.000/mês → **R$ 12.000/ano** ⚠️ |
| **banheiros / vagas** | ❌ |

Casa de apoio com 2 dormitórios — vai na descrição.
**Sem fotos:** nenhum link veio para esta casa.

---

## Resumo do que falta

**Trava o cadastro (o painel não deixa salvar):**
1. Descrição do **barracão** (nº 3)
2. Transação e preço da **Casa Santa Rosália** (nº 4)
3. Transação e preço do **Fit Campolim** (nº 5)

**Torna o anúncio errado se eu adivinhar:**
4. IPTU mensal × anual — decisão (a) ou (b)
5. De quem é o "Cond. 850 / IPTU 6.100"
6. Como exibir o pacote de R$ 6.000 do Ibiti

**Deixa a ficha incompleta, mas dá para publicar sem:**
7. Vagas: Ibiti, Aldeia, Bosque
8. Banheiros: Trix, Fit, Aldeia, Bosque
9. Área construída: Santa Rosália, Aldeia
10. Bairro real do Trix Home Horto

**Fotos:** vieram 4 links (Ibiti, barracão, Santa Rosália, Fit). Faltam
Trix Home, Aldeia da Mata e Bosque São Bento.

---

## Antes de publicar as fotos 🔴

O Marcelo avisou sobre as fotos do Ibiti: **apagar o telefone do
proprietário na placa de "aluga-se" e o número da casa na fachada.**

Isso não é preciosismo nem vale só para essa casa. Número de casa mais
fachada, num anúncio que diz que o imóvel está vazio, é o suficiente
para localizar o lugar. **Vale conferir foto por foto dos sete**, não só
as do Ibiti: placa de imobiliária concorrente, telefone, número, nome de
rua e carro com placa visível.

O site publica as fotos exatamente como sobem — não há edição
automática. O que subir, vai ao ar.
