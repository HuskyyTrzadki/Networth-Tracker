export default function TransactionsLoading() {
  return (
    <main className="px-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-md bg-muted/50" />
          <div className="h-4 w-64 rounded-md bg-muted/40" />
        </div>
        <div className="h-10 w-40 rounded-md bg-muted/50" />
      </header>

      <section className="mt-6">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="h-10 w-[260px] rounded-md bg-muted/50" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="h-10 flex-1 rounded-md bg-muted/40" />
            <div className="h-10 w-40 rounded-md bg-muted/40" />
            <div className="h-10 w-44 rounded-md bg-muted/40" />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-border bg-card shadow-sm">
        <div className="grid grid-cols-6 gap-3 border-b border-border px-4 py-3 text-xs text-muted-foreground">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-3 rounded-md bg-muted/40" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid h-16 grid-cols-6 items-center gap-3 border-b border-border px-4"
          >
            {Array.from({ length: 6 }).map((__, cellIndex) => (
              <div
                key={cellIndex}
                className="h-3 rounded-md bg-muted/40"
              />
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
