export function AuthLoginPageSkeleton() {
  return (
    <main className="grid min-h-[calc(100dvh-140px)] items-center gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <section className="mx-auto w-full max-w-[560px] rounded-xl border border-border/75 bg-card/95 shadow-[var(--surface-shadow)]">
        <div className="space-y-6 p-6 sm:p-7">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted/35" />
            <div className="h-10 w-40 animate-pulse rounded-md bg-muted/45" />
            <div className="h-4 w-52 animate-pulse rounded-md bg-muted/35" />
          </div>

          <div className="space-y-4">
            <div className="h-11 w-full animate-pulse rounded-sm bg-muted/40" />
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 border-t border-dashed border-border/70" />
              <div className="h-3 w-10 animate-pulse rounded-md bg-muted/30" />
              <div className="h-px flex-1 border-t border-dashed border-border/70" />
            </div>
            <div className="flex gap-5">
              <div className="h-5 w-24 animate-pulse rounded-md bg-muted/35" />
              <div className="h-5 w-28 animate-pulse rounded-md bg-muted/30" />
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded-md bg-muted/35" />
                <div className="h-10 w-full animate-pulse rounded-md bg-muted/40" />
              </div>
            ))}
            <div className="h-11 w-full animate-pulse rounded-sm bg-muted/45" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
          </div>
        </div>
      </section>

      <section className="hidden h-full items-center justify-center lg:flex">
        <div className="w-full max-w-[720px] rounded-[28px] border border-border/75 bg-card/95 p-6 shadow-[var(--surface-shadow)]">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted/30" />
              <div className="h-9 w-80 animate-pulse rounded-md bg-muted/45" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted/30" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="h-3 w-20 animate-pulse rounded-md bg-muted/30" />
                      <div className="h-8 w-40 animate-pulse rounded-md bg-muted/45" />
                    </div>
                    <div className="h-7 w-16 animate-pulse rounded-full bg-muted/30" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="space-y-2 rounded-xl border border-border/65 bg-card/90 px-3 py-3"
                      >
                        <div className="h-3 w-16 animate-pulse rounded-md bg-muted/30" />
                        <div className="h-4 w-full animate-pulse rounded-md bg-muted/40" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-dashed border-border/75 bg-muted/20 p-4">
                    <div className="space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded-md bg-muted/30" />
                      <div className="h-8 w-24 animate-pulse rounded-md bg-muted/45" />
                      <div className="h-4 w-56 animate-pulse rounded-md bg-muted/30" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-2xl border border-border/70 bg-card/90 px-4 py-4"
                  >
                    <div className="h-3 w-20 animate-pulse rounded-md bg-muted/30" />
                    <div className="h-8 w-32 animate-pulse rounded-md bg-muted/45" />
                    <div className="h-4 w-36 animate-pulse rounded-md bg-muted/30" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
