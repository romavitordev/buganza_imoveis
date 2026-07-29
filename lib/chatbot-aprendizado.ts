/**
 * Apoio ao "ensino" do chatbot pelo painel (/admin/suporte).
 *
 * Roda no servidor e no navegador (a tela mostra um preview das
 * palavras-chave enquanto o corretor digita), então não importa Prisma.
 */

/**
 * Palavras muito comuns não identificam assunto nenhum — se virassem
 * chave, a resposta seria disparada em quase toda frase.
 */
const VAZIAS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "ou", "em",
  "no", "na", "nos", "nas", "um", "uma", "uns", "umas", "para", "pra",
  "por", "com", "sem", "que", "qual", "quais", "quanto", "quantos",
  "como", "onde", "quando", "voces", "voce", "eu", "meu", "minha", "seu",
  "sua", "ao", "aos", "se", "sobre", "tem", "ter", "e", "sao", "ser",
  "isso", "esse", "essa", "este", "esta", "mais", "menos", "muito",
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Monta as palavras-chave que ativam uma resposta.
 *
 * `informadas` é o que o corretor digitou (separado por vírgula) e tem
 * prioridade — inclusive expressões de duas palavras, que casam melhor.
 * Se ele não informar nada, extraímos do título, descartando as palavras
 * comuns e as curtas demais para identificar um assunto.
 */
export function palavrasChaveDe(
  informadas: string,
  titulo: string
): string[] {
  const daLista = informadas
    .split(",")
    .map((p) => normalizar(p).trim())
    .filter((p) => p.length >= 3);

  if (daLista.length > 0) {
    return Array.from(new Set(daLista)).slice(0, 15);
  }

  const doTitulo = normalizar(titulo)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4 && !VAZIAS.has(p));

  return Array.from(new Set(doTitulo)).slice(0, 15);
}
