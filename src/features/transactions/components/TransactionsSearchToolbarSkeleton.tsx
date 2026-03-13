import { PortfolioSwitcherSkeleton } from "@/features/portfolio/components/PortfolioSwitcherSkeleton";

export function TransactionsSearchToolbarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3.5 rounded-lg border border-border/75 bg-card/94 px-4 py-3.5 shadow-[var(--surface-shadow)]"
    >
      <div className="flex items-center justify-between border-b border-dashed border-border/60 pb-2">
        <div className="h-3 w-14 animate-pulse rounded-md bg-muted/35" />
        <div className="h-3 w-24 animate-pulse rounded-md bg-muted/30" />
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.45fr)] xl:items-end">
        <div className="rounded-md border border-border/65 bg-background/70 p-2.5">
          <PortfolioSwitcherSkeleton />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-28 animate-pulse rounded-md bg-muted/35" />
          <div className="h-10 animate-pulse rounded-md bg-muted/40" />
        </div>
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] xl:items-end">
        <div className="space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded-md bg-muted/35" />
          <div className="h-10 animate-pulse rounded-md bg-muted/35" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded-md bg-muted/35" />
          <div className="h-10 animate-pulse rounded-md bg-muted/35" />
        </div>
      </div>
    </div>
  );
}
