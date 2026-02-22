import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

import {
  PortfolioDashboard,
} from "@/features/portfolio";
import { getPolishCpiSeriesCached, type CurrencyCode } from "@/features/market-data";
import { emptyDashboardBenchmarkSeries } from "@/features/portfolio/dashboard/lib/benchmark-config";
import { getPortfolioLiveTotals } from "@/features/portfolio/server/get-portfolio-live-totals";
import { getPortfolioAllocationDonutCards } from "@/features/portfolio/server/get-portfolio-allocation-donut-cards";
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
    baseCurrency,
    portfolios
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
      portfolioAllocationDonutCards={dashboardData.portfolioAllocationDonutCards}
    />
  );
}

type DashboardData = Readonly<{
  summary: Awaited<ReturnType<typeof getPortfolioSummary>>;
  snapshotRows: Awaited<ReturnType<typeof getPortfolioSnapshotRows>>;
  liveTotals: Awaited<ReturnType<typeof getPortfolioLiveTotals>>;
  portfolioAllocationDonutCards: Awaited<
    ReturnType<typeof getPortfolioAllocationDonutCards>
  >;
  polishCpiSeries: Awaited<ReturnType<typeof getPolishCpiSeriesCached>>;
  benchmarkSeries: ReturnType<typeof emptyDashboardBenchmarkSeries>;
  recentTransactions: Awaited<ReturnType<typeof listTransactions>>["items"];
}>;

const INITIAL_DASHBOARD_SNAPSHOT_DAYS = 400;

const getPortfolioDashboardDataCached = async (
  selectedPortfolioId: string | null,
  baseCurrency: string,
  portfolios: readonly { id: string; name: string; baseCurrency: string }[]
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
  const [
    summary,
    snapshotRows,
    liveTotals,
    recentTransactions,
    portfolioAllocationDonutCards,
  ] = await Promise.all([
    getPortfolioSummary(supabase, {
      portfolioId: selectedPortfolioId,
      baseCurrency,
    }),
    getPortfolioSnapshotRows(
      supabase,
      selectedPortfolioId ? "PORTFOLIO" : "ALL",
      selectedPortfolioId,
      INITIAL_DASHBOARD_SNAPSHOT_DAYS
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
    selectedPortfolioId === null
      ? getPortfolioAllocationDonutCards(supabase, {
          portfolios: portfolios.map((portfolio) => ({
            id: portfolio.id,
            name: portfolio.name,
          })),
          baseCurrency: baseCurrency as CurrencyCode,
        })
      : Promise.resolve([]),
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
    portfolioAllocationDonutCards,
    polishCpiSeries,
    benchmarkSeries,
    recentTransactions: recentTransactions.items,
  };
};
