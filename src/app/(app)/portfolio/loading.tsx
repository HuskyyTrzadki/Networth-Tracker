import { PortfolioDashboardSkeleton } from "@/features/portfolio";

export default function PortfolioLoading() {
  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col px-6 py-8">
      <header className="flex flex-col gap-3">
        <div className="space-y-1">
          <div className="h-6 w-32 rounded-md bg-muted/50" />
          <div className="h-4 w-48 rounded-md bg-muted/40" />
        </div>
      </header>
      <section className="mt-6">
        <PortfolioDashboardSkeleton />
      </section>
    </main>
  );
}
