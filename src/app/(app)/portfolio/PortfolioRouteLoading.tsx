import { PortfolioDashboardSkeleton } from "@/features/portfolio/components/PortfolioDashboardSkeleton";
import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { cn } from "@/lib/cn";

type SkeletonLineProps = Readonly<{
  className: string;
}>;

function SkeletonLine({ className }: SkeletonLineProps) {
  return <div className={cn("animate-pulse rounded-sm bg-foreground/10", className)} />;
}

export function PortfolioRouteLoading() {
  return (
    <main
      className={`mx-auto flex min-h-[calc(100vh-120px)] w-full flex-col px-6 py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}
    >
      <header className="rounded-lg border border-dashed border-border/70 bg-card/92 px-4 py-3 shadow-[var(--surface-shadow)] sm:px-5">
        <div className="space-y-2">
          <SkeletonLine className="h-2.5 w-16" />
          <SkeletonLine className="h-6 w-40" />
          <SkeletonLine className="h-3.5 w-56" />
        </div>
      </header>
      <section className="mt-5 rounded-lg border border-border/65 bg-background/55 p-3 sm:p-4">
        <PortfolioDashboardSkeleton />
      </section>
    </main>
  );
}
