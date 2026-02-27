import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal, StatusStrip } from "@/features/design-system";
import {
  PortfolioDashboardSkeleton,
  PortfolioMobileHeaderActions,
} from "@/features/portfolio";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

import PortfolioDashboardSection from "./PortfolioDashboardSection";

type Props = Readonly<{
  selectedPortfolioId: string | null;
}>;

export async function PortfolioPageView({ selectedPortfolioId }: Props) {
  const pageData = await getUserPortfoliosPrivateCached();
  if (!pageData.isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <section className="max-w-[720px] rounded-xl border border-border/75 bg-card/94 p-6 shadow-[var(--surface-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            Dostęp wymagany
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Portfele</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Zaloguj się, aby otworzyć dashboard portfela.
          </p>
          <Button asChild className="mt-5 h-11">
            <Link
              href={{
                pathname: "/login",
                query: { next: "/portfolio" },
              }}
            >
              Zaloguj się
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  const portfolios = pageData.portfolios;
  const selectedPortfolio = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null
    : null;

  if (selectedPortfolioId && !selectedPortfolio) {
    notFound();
  }

  const baseCurrency = selectedPortfolio?.baseCurrency ?? "PLN";
  const scopeLabel = selectedPortfolio
    ? `Portfel: ${selectedPortfolio.name}`
    : "Widok: wszystkie";
  const scopeHint = selectedPortfolio
    ? "Dashboard pokazuje dane dla wybranego portfela."
    : "Widok zbiorczy sumuje wszystkie portfele.";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl flex-col px-5 py-5 sm:px-6 sm:py-7">
      <AnimatedReveal>
        <header className="rounded-lg border border-border/80 bg-card/95 p-4 shadow-[var(--surface-shadow)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border/70 pb-3">
            <p className="inline-flex items-center rounded-sm border border-dashed border-border/70 bg-background/70 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
              Panel inwestora
            </p>
            <p className="font-mono text-[11px] tabular-nums uppercase tracking-[0.12em] text-muted-foreground">
              Waluta bazowa: {baseCurrency}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center rounded-md border border-border/60 bg-background/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                Dashboard
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Portfele</h1>
              <StatusStrip className="w-fit" hint={scopeHint} label={scopeLabel} />
            </div>
            <Button asChild size="lg" className="h-11 w-full lg:w-auto">
              <Link
                href={
                  selectedPortfolioId
                    ? `/transactions/new?portfolio=${selectedPortfolioId}`
                    : "/transactions/new"
                }
                scroll={false}
              >
                Dodaj transakcję
              </Link>
            </Button>
          </div>

          {selectedPortfolioId === null ? (
            <div className="mt-3 rounded-md border border-dashed border-border/65 bg-background/70 p-2 md:hidden">
              <PortfolioMobileHeaderActions
                portfolios={portfolios}
                selectedId={selectedPortfolioId}
              />
            </div>
          ) : null}
        </header>
      </AnimatedReveal>
      <AnimatedReveal className="mt-5" delay={0.05}>
        <Suspense fallback={<PortfolioDashboardSkeleton />}>
          <PortfolioDashboardSection
            baseCurrency={baseCurrency}
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
          />
        </Suspense>
      </AnimatedReveal>
    </main>
  );
}
