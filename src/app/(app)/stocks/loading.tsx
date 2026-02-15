export default function StocksLoading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] flex-col px-5 py-6 sm:px-6 sm:py-8">
      <header className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted/45" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted/40" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted/40" />
      </header>
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`stocks-loading-${index}`}
            className="h-56 animate-pulse rounded-xl bg-muted/35"
          />
        ))}
      </section>
    </main>
  );
}
