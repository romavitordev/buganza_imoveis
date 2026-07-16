import PropertyForm from "@/components/admin/PropertyForm";
import { exigirSessao } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Novo imóvel · Painel Buganza",
  robots: { index: false, follow: false },
};

export default async function NovoImovelPage() {
  await exigirSessao(); // defense in depth além do middleware
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <PropertyForm />
    </main>
  );
}
