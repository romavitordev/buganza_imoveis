import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import LeadsList, { type AdminLead } from "@/components/admin/LeadsList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leads · Painel Buganza",
  robots: { index: false, follow: false },
};

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { criadoEm: "desc" },
    take: 200,
    include: {
      property: { select: { id: true, codigo: true, titulo: true } },
    },
  });

  const serializados: AdminLead[] = leads.map((l) => ({
    id: l.id,
    nome: l.nome,
    whatsapp: l.whatsapp,
    mensagem: l.mensagem,
    origem: l.origem,
    status: l.status,
    criadoEm: l.criadoEm.toISOString(),
    imovel: l.property,
  }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar ao painel
      </Link>

      <div>
        <h1 className="text-3xl tracking-tight">Leads</h1>
        <p className="mt-1 text-[13px] text-black/50">
          Visitantes que deixaram contato no site — retorne pelo WhatsApp e
          marque como contatado.
        </p>
      </div>

      <LeadsList leadsIniciais={serializados} />
    </main>
  );
}
