import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import SuporteManager from "@/components/admin/SuporteManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buganza Suporte · Painel Buganza",
  robots: { index: false, follow: false },
};

/**
 * Tela onde os corretores ENSINAM o chatbot: veem o que os visitantes
 * perguntaram e o bot não soube responder, escrevem a resposta e ela
 * passa a valer no site — sem precisar de deploy.
 */
export default async function SuportePage() {
  await exigirSessao();

  const [pendentes, conhecimento] = await Promise.all([
    prisma.chatPergunta.findMany({
      where: { status: "NOVA" },
      orderBy: { criadoEm: "desc" },
      take: 50,
      select: { id: true, texto: true, criadoEm: true },
    }),
    prisma.chatConhecimento.findMany({
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        titulo: true,
        palavras: true,
        resposta: true,
        ativo: true,
      },
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-black/60 transition-colors hover:text-black"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar ao painel
      </Link>

      <div>
        <h1 className="text-3xl tracking-tight">Buganza Suporte</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-black/60">
          Aqui você ensina o assistente do site. Responda o que os visitantes
          perguntaram e o bot passa a responder sozinho da próxima vez.
        </p>
      </div>

      <SuporteManager
        pendentesIniciais={pendentes.map((p) => ({
          id: p.id,
          texto: p.texto,
          criadoEm: p.criadoEm.toISOString(),
        }))}
        conhecimentoInicial={conhecimento}
      />
    </main>
  );
}
