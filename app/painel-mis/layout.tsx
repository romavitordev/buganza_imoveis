import type { Metadata } from "next";

/**
 * `noindex` para TODO o painel, de uma vez.
 *
 * Cada página já declarava o seu, menos a de LOGIN — que é `"use
 * client"` e por isso não pode exportar `metadata`. Justamente ela: a
 * única página do painel que abre sem sessão, e portanto a única que o
 * Google conseguiria alcançar e indexar.
 *
 * Isto ficou mais importante depois que o endereço do painel saiu do
 * robots.txt. Aquele arquivo é público e listar o painel nele entregava
 * o endereço de bandeja — bots leem robots.txt exatamente para descobrir
 * o que não está à vista. O `noindex` faz o trabalho de verdade, e sem
 * anunciar nada.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
