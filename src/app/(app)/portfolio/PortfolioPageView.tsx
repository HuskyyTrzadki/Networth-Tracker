import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";
import { StatusStrip } from "@/features/design-system/components/StatusStrip";
import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { DemoPortfolioBadge } from "@/features/portfolio/components/DemoPortfolioBadge";
import { PortfolioDashboardSkeleton } from "@/features/portfolio/components/PortfolioDashboardSkeleton";
import { PortfolioMobileHeaderActions } from "@/features/portfolio/components/PortfolioMobileHeaderActions";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

import PortfolioDashboardSection from "./PortfolioDashboardSection";

type Props = Readonly<{
  selectedPortfolioId: string | null;
}>;

export async function PortfolioPageView({ selectedPortfolioId }: Props) {
  const pageData = await getUserPortfoliosPrivateCached();
  if (!pageData.isAuthenticated) {
    return (
      <main className={`mx-auto w-full px-6 py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}>
        <section className="max-w-[720px] rounded-xl border border-border/75 bg-card/94 p-6 shadow-[var(--surface-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
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
  const scopeLabel = selectedPortfolio ? selectedPortfolio.name : "Wszystkie portfele";
  const isDemo = selectedPortfolio?.isDemo ?? false;

  return (
    <main
      className={`mx-auto flex min-h-[calc(100vh-120px)] w-full flex-col px-5 py-5 sm:px-6 sm:py-7 ${APP_CONTENT_MAX_WIDTH_CLASS}`}
    >
      <AnimatedReveal>
        <header className="rounded-lg border border-border/80 bg-card/95 p-4 shadow-[var(--surface-shadow)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border/70 pb-3">
            <h1 className="text-2xl font-semibold tracking-tight">Portfel</h1>
            <p className="font-mono text-xs tabular-nums uppercase tracking-[0.12em] text-muted-foreground">
              Waluta bazowa: {baseCurrency}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusStrip className="w-fit" label={scopeLabel} />
                {isDemo ? <DemoPortfolioBadge className="px-3 py-1.5 text-xs" /> : null}
              </div>
            </div>
            <Button asChild size="lg" className="h-11 w-full lg:w-auto">
              <Link
                href={
                  selectedPortfolioId
                    ? `/transactions/new?portfolio=${selectedPortfolioId}`
                    : "/transactions/new"
                }
                scroll={false}
                data-testid="portfolio-add-transaction-cta"
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
