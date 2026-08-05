/**
 * Ponte entre a navbar e o widget de atendimento.
 *
 * POR QUE UM EVENTO: no mobile o gatilho do chat vive na navbar
 * (SiteNav) e o painel vive no ChatWidget, que é montado lá no
 * app/layout.tsx — são irmãos distantes na árvore. Passar estado por
 * props exigiria subir tudo para o layout, e um contexto só para isto
 * transformaria o layout inteiro em client component. Um evento de
 * janela resolve sem acoplar os dois.
 *
 * O ChatWidget escuta; quem quiser abrir o chat chama abrirSuporte().
 */
export const EVENTO_ABRIR_SUPORTE = "bz:abrir-suporte";

export function abrirSuporte() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_SUPORTE));
}
