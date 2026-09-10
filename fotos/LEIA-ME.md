# Fotos dos imóveis

Uma pasta por imóvel, nomeada com o código dele. Jogue as fotos dentro
da pasta certa e rode o importador — ele cadastra tudo de uma vez.

```
fotos/
  MIS-0001-casa-terrea-condominio-ibiti-do-paco/
  MIS-0002-apartamento-mobiliado-trix-home-horto/
  MIS-0003-barracao-200m2-vila-gabriel/
  MIS-0004-casa-4-vagas-santa-rosalia/          (pausado)
  MIS-0005-apartamento-fit-campolim/            (pausado)
  MIS-0006-casa-condominio-aldeia-da-mata/
  MIS-0007-casa-condominio-bosque-sao-bento-campolim/
```

## Como usar

1. Copie as fotos para a pasta do imóvel.
2. **A ordem é a ordem do nome do arquivo.** Renomeie para `01.jpg`,
   `02.jpg`, `03.jpg`… A `01` vira a **capa** — é a que aparece no card
   do catálogo e no compartilhamento do WhatsApp. Escolha a melhor.
3. Rode:

```bash
npx tsx scripts/importar-fotos.ts            # só mostra o que vai fazer
npx tsx scripts/importar-fotos.ts --aplicar  # envia
```

Rodar de novo **substitui** as fotos daquele imóvel pelas da pasta. Para
trocar uma foto, mude o arquivo e rode outra vez — não acumula.

## Regras que o site impõe

| | |
|---|---|
| Formatos | `.jpg`, `.jpeg`, `.png`, `.webp` |
| Máximo por imóvel | **30 fotos** |
| Tamanho por foto | 5 MB |
| Ideal | 1920 px no maior lado |

O importador **recusa** foto acima de 5 MB e diz qual é. Ele não
redimensiona: quem faz isso é o painel, no navegador, na hora do upload.
Se alguma foto vier grande demais, envie aquela pelo painel
(`/painel-mis`) — ele comprime sozinho.

Com o Supabase configurado, as fotos vão direto para o bucket de
produção. Sem ele, caem em `public/uploads` — o mesmo caminho que o
painel usa em desenvolvimento.

## Antes de importar: privacidade 🔴

O Marcelo pediu isso para as fotos do Ibiti, e **vale para todas**:

- apagar **telefone** em placa de "aluga-se" ou "vende-se"
- apagar o **número da casa** na fachada
- conferir **placa de carro** visível
- conferir **placa de imobiliária concorrente**

Número da casa mais fachada, num anúncio que diz que o imóvel está
vazio, é o bastante para alguém localizar o lugar. **O site publica a
foto exatamente como ela sobe** — não existe edição automática.

## Onde as fotos vão parar

- **Agora (local):** `public/uploads/`, que é ignorado pelo Git.
- **Em produção:** Supabase Storage, assim que a conta existir.

O importador usa o mesmo caminho do painel, então não muda nada quando o
Supabase entrar — só passa a subir para lá.

As fotos **não entram no Git**: só as pastas vazias ficam versionadas,
para todo mundo saber onde colocar. Guarde os originais em outro lugar
(o Drive de vocês já serve).
