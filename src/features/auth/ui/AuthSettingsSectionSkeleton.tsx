export function AuthSettingsSectionSkeleton() {
  return (
    <section className="rounded-xl border border-black/8 bg-white shadow-[var(--surface-shadow)]">
      <div className="space-y-5 p-6 sm:p-7">
        <header className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded-md bg-muted/35" />
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted/45" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted/35" />
        </header>

        <div className="rounded-md border border-border/70 bg-background/80 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted/35" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted/35" />
          </div>
        </div>

        <div className="h-3 w-40 animate-pulse rounded-md bg-muted/30" />

        <div className="space-y-3">
          <div className="h-11 w-full animate-pulse rounded-sm bg-muted/40" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-10 animate-pulse rounded-sm bg-muted/30" />
            <div className="h-10 animate-pulse rounded-sm bg-muted/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
