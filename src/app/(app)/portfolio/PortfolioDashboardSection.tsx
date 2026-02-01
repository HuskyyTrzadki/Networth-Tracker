import { cookies } from "next/headers";

import {
  DashboardEmptyState,
  PortfolioDashboard,
} from "@/features/portfolio";
import { getPortfolioLiveTotals } from "@/features/portfolio/server/get-portfolio-live-totals";
import { getPortfolioSummary } from "@/features/portfolio/server/get-portfolio-summary";
import { getPortfolioSnapshotSeries } from "@/features/portfolio/server/snapshots/get-portfolio-snapshot-series";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  selectedPortfolioId: string | null;
  baseCurrency: string;
}>;

export default async function PortfolioDashboardSection({
  portfolios,
  selectedPortfolioId,
  baseCurrency,
}: Props) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const summary = await getPortfolioSummary(supabase, {
    portfolioId: selectedPortfolioId,
    baseCurrency,
  });

  if (summary.holdings.length === 0) {
    return (
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
    );
  }

  const snapshotSeries = await getPortfolioSnapshotSeries(
    supabase,
    selectedPortfolioId ? "PORTFOLIO" : "ALL",
    selectedPortfolioId,
    30
  );
  const liveTotals = await getPortfolioLiveTotals(supabase, {
    portfolioId: selectedPortfolioId,
  });

  return (
    <PortfolioDashboard
      portfolios={portfolios}
      selectedPortfolioId={selectedPortfolioId}
      summary={summary}
      snapshotSeries={snapshotSeries}
      liveTotals={liveTotals}
    />
  );
}
