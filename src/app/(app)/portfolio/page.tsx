import { cookies } from "next/headers";

import {
  DashboardEmptyState,
  PortfolioDashboard,
  PortfolioMobileHeaderActions,
} from "@/features/portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { getPortfolioSummary } from "@/features/portfolio/server/get-portfolio-summary";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parsePortfolioId = (
  searchParams: Readonly<Record<string, string | string[] | undefined>>
) => {
  const raw = getFirstParam(searchParams.portfolio)?.trim();
  if (!raw || raw === "all") return null;
  return raw;
};

export const metadata = {
  title: "Portfel",
};

export default async function PortfolioPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedPortfolioId = parsePortfolioId(params);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Server-side: resolve the user from cookies so RLS filters portfolios correctly.
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Portfel</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć portfel.
        </div>
      </main>
    );
  }

  const portfolios = await listPortfolios(supabase, data.user.id);
  const selectedPortfolio = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null
    : null;

  const baseCurrency = selectedPortfolio?.baseCurrency ?? "PLN";
  const summary = await getPortfolioSummary(supabase, data.user.id, {
    portfolioId: selectedPortfolioId,
    baseCurrency,
  });

  const hasHoldings = summary.holdings.length > 0;
  const subtitle = selectedPortfolio
    ? `Portfel: ${selectedPortfolio.name}`
    : "Wszystkie portfele";

  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col px-6 py-8">
      <header className="flex flex-col gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Portfel</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="md:hidden">
          <PortfolioMobileHeaderActions
            portfolios={portfolios}
            selectedId={selectedPortfolioId}
          />
        </div>
      </header>
      {hasHoldings ? (
        <section className="mt-6">
          <PortfolioDashboard
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
            summary={summary}
          />
        </section>
      ) : (
        <div className="flex flex-1 items-center justify-center py-10">
          <DashboardEmptyState
            title="Twój portfel jest pusty."
            subtitle="Dodaj swoje pierwsze aktywo, aby zobaczyć analizę."
            primaryAction={{
              label: "Dodaj transakcję",
              href: selectedPortfolioId
                ? `/transactions/new?portfolio=${selectedPortfolioId}`
                : "/transactions/new",
            }}
            secondaryAction={{
              label: "Importuj CSV",
              href: "/transactions/import",
            }}
          />
        </div>
      )}
    </main>
  );
}
