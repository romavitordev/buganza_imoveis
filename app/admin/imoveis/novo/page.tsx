import PropertyForm from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Novo imóvel · Painel Buganza",
  robots: { index: false, follow: false },
};

export default function NovoImovelPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <PropertyForm />
    </main>
  );
}
