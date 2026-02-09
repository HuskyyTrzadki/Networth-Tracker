import { cookies } from "next/headers";

import {
  PortfolioDashboard,
} from "@/features/portfolio";
import { getPolishCpiSeriesCached } from "@/features/market-data";
import { emptyDashboardBenchmarkSeries } from "@/features/portfolio/dashboard/lib/benchmark-config";
import { getPortfolioLiveTotals } from "@/features/portfolio/server/get-portfolio-live-totals";
import { getPortfolioSummary } from "@/features/portfolio/server/get-portfolio-summary";
import { getPortfolioSnapshotRows } from "@/features/portfolio/server/snapshots/get-portfolio-snapshot-rows";
import { listTransactions } from "@/features/transactions/server/list-transactions";
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

  const snapshotRows = await getPortfolioSnapshotRows(
    supabase,
    selectedPortfolioId ? "PORTFOLIO" : "ALL",
    selectedPortfolioId
  );
  const firstSnapshotDate = snapshotRows.rows[0]?.bucketDate ?? null;
  const lastSnapshotDate =
    snapshotRows.rows[snapshotRows.rows.length - 1]?.bucketDate ?? null;
  const polishCpiSeries =
    firstSnapshotDate && lastSnapshotDate
      ? await getPolishCpiSeriesCached(supabase, firstSnapshotDate, lastSnapshotDate)
      : [];
  const benchmarkSeries = emptyDashboardBenchmarkSeries(
    snapshotRows.rows.map((row) => row.bucketDate)
  );
  const [liveTotals, recentTransactions] = await Promise.all([
    getPortfolioLiveTotals(supabase, {
      portfolioId: selectedPortfolioId,
    }),
    listTransactions(supabase, {
      query: null,
      type: null,
      sort: "date_desc",
      page: 1,
      pageSize: 10,
      portfolioId: selectedPortfolioId,
    }),
  ]);

  return (
    <PortfolioDashboard
      portfolios={portfolios}
      selectedPortfolioId={selectedPortfolioId}
      summary={summary}
      snapshotRows={snapshotRows}
      liveTotals={liveTotals}
      polishCpiSeries={polishCpiSeries}
      benchmarkSeries={benchmarkSeries}
      recentTransactions={recentTransactions.items}
    />
  );
}
