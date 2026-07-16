import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { exigirSessao } from "@/lib/session";
import PasswordForm from "@/components/admin/PasswordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Minha conta · Painel Buganza",
  robots: { index: false, follow: false },
};

export default async function ContaPage() {
  // Exige sessão (defense in depth) e usa o e-mail no cabeçalho
  const sessao = await exigirSessao();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar ao painel
      </Link>

      <div>
        <h1 className="text-3xl tracking-tight">Minha conta</h1>
        {sessao && (
          <p className="mt-1 text-[13px] text-black/50">{sessao.email}</p>
        )}
      </div>

      <section
        aria-labelledby="senha-titulo"
        className="rounded-2xl border border-black/10 p-5 md:p-6"
      >
        <h2 id="senha-titulo" className="mb-1 text-lg tracking-tight">
          Trocar senha
        </h2>
        <p className="mb-5 text-[12px] text-black/45">
          A sessão atual continua válida após a troca.
        </p>
        <PasswordForm />
      </section>
    </main>
  );
}
