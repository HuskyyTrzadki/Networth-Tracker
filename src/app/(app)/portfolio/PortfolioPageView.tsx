import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system";
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
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Portfele</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć portfel.
        </div>
        <Button asChild className="mt-4 h-11">
          <Link
            href={{
              pathname: "/login",
              query: { next: "/portfolio" },
            }}
          >
            Zaloguj się
          </Link>
        </Button>
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
  const subtitle = selectedPortfolio
    ? `Portfel: ${selectedPortfolio.name}`
    : "Wszystkie portfele";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] flex-col px-5 py-6 sm:px-6 sm:py-8">
      <AnimatedReveal>
        <header className="flex flex-col gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Portfele</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Button asChild size="lg" className="w-full md:w-auto md:self-start">
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
          {selectedPortfolioId === null ? (
            <div className="md:hidden">
              <PortfolioMobileHeaderActions
                portfolios={portfolios}
                selectedId={selectedPortfolioId}
              />
            </div>
          ) : null}
        </header>
      </AnimatedReveal>
      <AnimatedReveal className="mt-6" delay={0.05}>
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
