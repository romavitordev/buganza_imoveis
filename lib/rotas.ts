/**
 * Endereço do painel, em um lugar só.
 *
 * POR QUE ISTO EXISTE: o painel mudou de endereço. O antigo aparecia em
 * 84 pontos do código — links de navegação, redirects, revalidatePath,
 * robots.txt, o matcher do middleware — e trocar tudo na mão é onde
 * nasce o link que ninguém testa e só quebra meses depois.
 *
 * POR QUE TROCAR AJUDA (e o que NÃO resolve): o endereço anterior é o
 * primeiro que qualquer varredura automática testa, junto de `/wp-admin`
 * e `/administrator`. Sair dessa lista não é segurança — é ruído a
 * menos: menos tentativa de login no log, menos rate limit consumido por
 * robô. **Quem protege o painel é a senha, o rate limit e a 2FA.**
 *
 * O nome vive aqui, mas a PASTA em app/ precisa acompanhar: o roteador
 * do Next é o sistema de arquivos. Trocar o valor abaixo sem renomear
 * `app/painel-mis` quebra tudo — por isso o teste em tests/rotas.test.ts
 * confere que a pasta existe.
 */
export const ROTA_PAINEL = "/painel-mis";

/** Login do painel — a única página dele aberta a quem não tem sessão. */
export const ROTA_LOGIN = `${ROTA_PAINEL}/login`;

/** Caminho dentro do painel: caminhoPainel("leads") → "/painel-mis/leads". */
export function caminhoPainel(...partes: string[]): string {
  if (partes.length === 0) return ROTA_PAINEL;
  return `${ROTA_PAINEL}/${partes.join("/")}`;
}
