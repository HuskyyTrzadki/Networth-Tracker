import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

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
  const dashboardData = await getPortfolioDashboardDataCached(
    selectedPortfolioId,
    baseCurrency
  );

  return (
    <PortfolioDashboard
      portfolios={portfolios}
      selectedPortfolioId={selectedPortfolioId}
      summary={dashboardData.summary}
      snapshotRows={dashboardData.snapshotRows}
      liveTotals={dashboardData.liveTotals}
      polishCpiSeries={dashboardData.polishCpiSeries}
      benchmarkSeries={dashboardData.benchmarkSeries}
      recentTransactions={dashboardData.recentTransactions}
    />
  );
}

type DashboardData = Readonly<{
  summary: Awaited<ReturnType<typeof getPortfolioSummary>>;
  snapshotRows: Awaited<ReturnType<typeof getPortfolioSnapshotRows>>;
  liveTotals: Awaited<ReturnType<typeof getPortfolioLiveTotals>>;
  polishCpiSeries: Awaited<ReturnType<typeof getPolishCpiSeriesCached>>;
  benchmarkSeries: ReturnType<typeof emptyDashboardBenchmarkSeries>;
  recentTransactions: Awaited<ReturnType<typeof listTransactions>>["items"];
}>;

const getPortfolioDashboardDataCached = async (
  selectedPortfolioId: string | null,
  baseCurrency: string
): Promise<DashboardData> => {
  "use cache: private";

  // Dashboard is expensive (summary + snapshots + transactions), so keep short-lived private cache.
  cacheLife("minutes");
  cacheTag("portfolio:all");
  if (selectedPortfolioId) {
    cacheTag(`portfolio:${selectedPortfolioId}`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const [summary, snapshotRows, liveTotals, recentTransactions] = await Promise.all([
    getPortfolioSummary(supabase, {
      portfolioId: selectedPortfolioId,
      baseCurrency,
    }),
    getPortfolioSnapshotRows(
      supabase,
      selectedPortfolioId ? "PORTFOLIO" : "ALL",
      selectedPortfolioId
    ),
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

  return {
    summary,
    snapshotRows,
    liveTotals,
    polishCpiSeries,
    benchmarkSeries,
    recentTransactions: recentTransactions.items,
  };
};
