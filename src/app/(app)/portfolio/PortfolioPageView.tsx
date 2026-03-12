import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";
import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { PortfolioDashboardSkeleton } from "@/features/portfolio/components/PortfolioDashboardSkeleton";
import { BrokerImportRunBanner } from "@/features/transactions/components/BrokerImportRunBanner";
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

  return (
    <main
      className={`mx-auto flex min-h-[calc(100vh-120px)] w-full flex-col px-5 py-5 sm:px-6 sm:py-7 ${APP_CONTENT_MAX_WIDTH_CLASS}`}
    >
      <AnimatedReveal>
        <div className="space-y-4">
          <BrokerImportRunBanner portfolioId={selectedPortfolioId} />
          <Suspense fallback={<PortfolioDashboardSkeleton />}>
            <PortfolioDashboardSection
              addTransactionHref={
                selectedPortfolioId
                  ? `/transactions/new?portfolio=${selectedPortfolioId}`
                  : "/transactions/new"
              }
              baseCurrency={baseCurrency}
              portfolios={portfolios}
              selectedPortfolioId={selectedPortfolioId}
            />
          </Suspense>
        </div>
      </AnimatedReveal>
    </main>
  );
}
