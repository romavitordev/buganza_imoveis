import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/session";
import PasswordForm from "@/components/admin/PasswordForm";
import TwoFactorCard from "@/components/admin/TwoFactorCard";
import { MARCA } from "@/lib/marca";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Minha conta · ${MARCA.painel}`,
  robots: { index: false, follow: false },
};

export default async function ContaPage() {
  // Exige sessão (defense in depth) e usa o e-mail no cabeçalho
  const sessao = await exigirSessao();
  const user = await prisma.adminUser.findUnique({
    where: { id: sessao.sub },
    select: { totpAtivadoEm: true },
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-secundario transition-colors hover:text-black"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar ao painel
      </Link>

      <div>
        <h1 className="text-3xl tracking-tight">Minha conta</h1>
        {sessao && (
          <p className="mt-1 text-[13px] text-secundario">{sessao.email}</p>
        )}
      </div>

      <section
        aria-labelledby="senha-titulo"
        className="rounded-2xl border border-black/10 p-5 md:p-6"
      >
        <h2 id="senha-titulo" className="mb-1 text-lg tracking-tight">
          Trocar senha
        </h2>
        <p className="mb-5 text-[12px] text-secundario">
          A sessão atual continua válida após a troca.
        </p>
        <PasswordForm />
      </section>

      <section
        aria-labelledby="totp-titulo"
        className="rounded-2xl border border-black/10 p-5 md:p-6"
      >
        <h2 id="totp-titulo" className="mb-1 text-lg tracking-tight">
          Verificação em duas etapas (2FA)
        </h2>
        <p className="mb-5 text-[12px] text-secundario">
          Camada extra de segurança: além da senha, o login pede um código
          de 6 dígitos do seu celular. Recomendado antes de ir pro ar.
        </p>
        <TwoFactorCard ativado={Boolean(user?.totpAtivadoEm)} />
      </section>
    </main>
  );
}
