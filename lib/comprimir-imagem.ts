/**
 * Compressão de imagem NO NAVEGADOR, antes do upload.
 *
 * Por que no cliente? O upload é direto navegador → Supabase (URL
 * assinada); o arquivo nunca passa pelo servidor, então é aqui que dá
 * para encolher. Benefícios: storage até ~10× menor (custo), upload
 * rápido no 4G e site mais leve para o visitante.
 *
 * Estratégia: redimensiona para no máximo LADO_MAX px (sobra para
 * qualquer tela; o next/image gera os tamanhos menores) e re-encoda em
 * JPEG. Foto de imóvel não precisa de transparência — PNG gigante de
 * celular também vira JPEG. Se por qualquer motivo o resultado ficar
 * MAIOR que o original (ex.: JPEG já muito otimizado), mantém o original.
 *
 * REGRA DE OURO: nunca travar o upload — qualquer falha aqui devolve o
 * arquivo original e segue a vida.
 */

const LADO_MAX = 1920;
const QUALIDADE = 0.82;
/** Abaixo disso e já dentro do lado máximo, não vale o re-encode. */
const LIMIAR_INTOCADA_BYTES = 400 * 1024;

/** Tipos que sabemos re-encodar com segurança (gif/svg ficam como estão). */
const TIPOS_COMPRIMIVEIS = new Set(["image/jpeg", "image/png", "image/webp"]);

function trocarExtensao(nome: string): string {
  const base = nome.replace(/\.[^.]+$/, "");
  return `${base}.jpg`;
}

export async function comprimirImagem(arquivo: File): Promise<File> {
  if (!TIPOS_COMPRIMIVEIS.has(arquivo.type)) return arquivo;

  try {
    // `imageOrientation: "from-image"` aplica a rotação do EXIF — sem
    // isso, foto de celular em pé viraria deitada no canvas.
    const bitmap = await createImageBitmap(arquivo, {
      imageOrientation: "from-image",
    });

    const maiorLado = Math.max(bitmap.width, bitmap.height);
    const jaPequena =
      maiorLado <= LADO_MAX && arquivo.size <= LIMIAR_INTOCADA_BYTES;
    if (jaPequena) {
      bitmap.close();
      return arquivo;
    }

    const escala = Math.min(1, LADO_MAX / maiorLado);
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return arquivo;
    }
    // Fundo branco: PNG com transparência não vira "quadrado preto".
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALIDADE)
    );
    if (!blob || blob.size >= arquivo.size) return arquivo;

    return new File([blob], trocarExtensao(arquivo.name), {
      type: "image/jpeg",
      lastModified: arquivo.lastModified,
    });
  } catch {
    // Navegador sem suporte ou imagem corrompida: envia como veio.
    return arquivo;
  }
}
