export default function LoadingImovel() {
  return (
    <main
      className="mx-auto max-w-6xl animate-pulse px-4 pb-44 pt-24 md:px-8 md:pb-20 md:pt-36"
      aria-busy="true"
      aria-label="Carregando imóvel"
    >
      <div className="mb-8 h-5 w-44 rounded-pill bg-mist" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] rounded-2xl bg-mist" />
          <div className="grid grid-cols-5 gap-2 md:grid-cols-6">
            {[0, 1, 2, 3].map((thumb) => (
              <div key={thumb} className="aspect-square rounded-lg bg-mist" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-4 w-24 rounded-pill bg-mist" />
          <div className="h-10 w-full rounded-2xl bg-mist" />
          <div className="h-20 rounded-2xl bg-mist" />
          <div className="h-64 rounded-2xl bg-mist" />
        </div>
      </div>
    </main>
  );
}
