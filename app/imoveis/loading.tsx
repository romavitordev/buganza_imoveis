export default function LoadingImoveis() {
  return (
    <main
      className="mx-auto max-w-6xl animate-pulse px-4 pb-20 pt-28 md:px-8 md:pt-36"
      aria-busy="true"
      aria-label="Carregando imóveis"
    >
      <div className="mb-3 h-4 w-36 rounded-pill bg-mist" />
      <div className="mb-10 h-12 w-56 rounded-2xl bg-mist" />

      <div className="mb-12 flex flex-col gap-4">
        {[0, 1].map((linha) => (
          <div key={linha} className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((pill) => (
              <div key={pill} className="h-9 w-24 rounded-pill bg-mist" />
            ))}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div key={card} className="flex flex-col gap-4">
            <div className="aspect-[4/3] rounded-2xl bg-mist" />
            <div className="flex flex-col gap-2 px-1">
              <div className="h-6 w-32 rounded-pill bg-mist" />
              <div className="h-5 w-3/4 rounded-pill bg-mist" />
              <div className="h-4 w-1/2 rounded-pill bg-mist" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
