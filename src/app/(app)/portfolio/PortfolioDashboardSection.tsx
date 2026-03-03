import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

import { PortfolioDashboard } from "@/features/portfolio/dashboard/PortfolioDashboard";
import { getPolishCpiSeriesCached, type CurrencyCode } from "@/features/market-data";
import { emptyDashboardBenchmarkSeries } from "@/features/portfolio/dashboard/lib/benchmark-config";
import { getPortfolioLiveTotals } from "@/features/portfolio/server/get-portfolio-live-totals";
import { getPortfolioAllocationDonutCards } from "@/features/portfolio/server/get-portfolio-allocation-donut-cards";
import { getPortfolioSummary } from "@/features/portfolio/server/get-portfolio-summary";
import { getDividendInbox } from "@/features/portfolio/server/dividends/get-dividend-inbox";
import { getPortfolioSnapshotRows } from "@/features/portfolio/server/snapshots/get-portfolio-snapshot-rows";
import { listTransactions } from "@/features/transactions/server/list-transactions";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
    isDemo: boolean;
  }[];
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
      {...dashboardData}
    />
  );
}

type DashboardData = Readonly<{
  summary: Awaited<ReturnType<typeof getPortfolioSummary>>;
  snapshotRows: Awaited<ReturnType<typeof getPortfolioSnapshotRows>>;
  liveTotals: Awaited<ReturnType<typeof getPortfolioLiveTotals>>;
  dividendInbox: Awaited<ReturnType<typeof getDividendInbox>>;
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
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
    isDemo: boolean;
  }[]
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
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    throw new Error("User not authenticated.");
  }

  const userId = authData.user.id;
  const [
    summary,
    snapshotRows,
    liveTotals,
    recentTransactions,
    dividendInbox,
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
    getDividendInbox({
      supabase,
      userId,
      portfolioId: selectedPortfolioId,
      pastDays: 60,
      futureDays: 60,
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
    dividendInbox,
    portfolioAllocationDonutCards,
    polishCpiSeries,
    benchmarkSeries,
    recentTransactions: recentTransactions.items,
  };
};
