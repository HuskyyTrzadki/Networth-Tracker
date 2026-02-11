export default function StockDetailsLoading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] flex-col px-5 py-6 sm:px-6 sm:py-8">
      <header className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded bg-muted/40" />
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-muted/40" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
            <div className="h-8 w-64 animate-pulse rounded bg-muted/45" />
          </div>
        </div>
      </header>
      <section className="mt-6 h-[420px] animate-pulse rounded-2xl bg-muted/35" />
      <section className="mt-6 h-[320px] animate-pulse rounded-2xl bg-muted/35" />
    </main>
  );
}
