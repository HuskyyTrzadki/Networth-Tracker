import { cache, Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

import { getPolishCpiSeriesCached, type CurrencyCode } from "@/features/market-data";
import { PortfolioAllocationsByPortfolioDeferredWidget } from "@/features/portfolio/dashboard/PortfolioAllocationsByPortfolioDeferredWidget";
import { PortfolioDashboard } from "@/features/portfolio/dashboard/PortfolioDashboard";
import { PortfolioDividendInboxDeferredWidget } from "@/features/portfolio/dashboard/PortfolioDividendInboxDeferredWidget";
import { PortfolioRecentTransactionsDeferredWidget } from "@/features/portfolio/dashboard/PortfolioRecentTransactionsDeferredWidget";
import { emptyDashboardBenchmarkSeries } from "@/features/portfolio/dashboard/lib/benchmark-config";
import { getPortfolioLiveTotals } from "@/features/portfolio/server/get-portfolio-live-totals";
import { getPortfolioAllocationDonutCards } from "@/features/portfolio/server/get-portfolio-allocation-donut-cards";
import { getPortfolioSummary } from "@/features/portfolio/server/get-portfolio-summary";
import { getDividendInbox } from "@/features/portfolio/server/dividends/get-dividend-inbox";
import { getPortfolioSnapshotRows } from "@/features/portfolio/server/snapshots/get-portfolio-snapshot-rows";
import { listTransactions } from "@/features/transactions/server/list-transactions";
import { createClient } from "@/lib/supabase/server";

type PortfolioOption = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
  isDemo: boolean;
}>;

type Props = Readonly<{
  portfolios: readonly PortfolioOption[];
  selectedPortfolioId: string | null;
  baseCurrency: string;
  addTransactionHref: string;
}>;

type DashboardCoreData = Readonly<{
  summary: Awaited<ReturnType<typeof getPortfolioSummary>>;
  snapshotRows: Awaited<ReturnType<typeof getPortfolioSnapshotRows>>;
  liveTotals: Awaited<ReturnType<typeof getPortfolioLiveTotals>>;
  polishCpiSeries: Awaited<ReturnType<typeof getPolishCpiSeriesCached>>;
  benchmarkSeries: ReturnType<typeof emptyDashboardBenchmarkSeries>;
}>;

const INITIAL_DASHBOARD_SNAPSHOT_DAYS = 400;

export default async function PortfolioDashboardSection({
  portfolios,
  selectedPortfolioId,
  baseCurrency,
  addTransactionHref,
}: Props) {
  const coreData = await getPortfolioDashboardCoreDataCached(
    selectedPortfolioId,
    baseCurrency
  );

  return (
    <PortfolioDashboard
      addTransactionHref={addTransactionHref}
      portfolios={portfolios}
      selectedPortfolioId={selectedPortfolioId}
      {...coreData}
      allocationsByPortfolioWidget={
        selectedPortfolioId === null ? (
          <Suspense
            fallback={<DeferredDashboardWidgetSkeleton title="Alokacja per portfel" />}
          >
            <PortfolioAllocationsByPortfolioSection
              baseCurrency={baseCurrency}
              portfolios={portfolios}
            />
          </Suspense>
        ) : null
      }
      secondaryWidgets={
        <div className="space-y-5">
          <Suspense
            fallback={<DeferredDashboardWidgetSkeleton title="Ostatnie transakcje" />}
          >
            <PortfolioRecentTransactionsSection
              selectedPortfolioId={selectedPortfolioId}
            />
          </Suspense>
          <Suspense
            fallback={<DeferredDashboardWidgetSkeleton title="Skrzynka dywidend" />}
          >
            <PortfolioDividendInboxSection selectedPortfolioId={selectedPortfolioId} />
          </Suspense>
        </div>
      }
    />
  );
}

async function PortfolioRecentTransactionsSection({
  selectedPortfolioId,
}: Readonly<{
  selectedPortfolioId: string | null;
}>) {
  const items = await getPortfolioRecentTransactionsCached(selectedPortfolioId);

  return (
    <PortfolioRecentTransactionsDeferredWidget
      selectedPortfolioId={selectedPortfolioId}
      items={items}
    />
  );
}

async function PortfolioDividendInboxSection({
  selectedPortfolioId,
}: Readonly<{
  selectedPortfolioId: string | null;
}>) {
  const data = await getPortfolioDividendInboxCached(selectedPortfolioId);

  return (
    <PortfolioDividendInboxDeferredWidget
      selectedPortfolioId={selectedPortfolioId}
      data={data}
    />
  );
}

async function PortfolioAllocationsByPortfolioSection({
  portfolios,
  baseCurrency,
}: Readonly<{
  portfolios: readonly PortfolioOption[];
  baseCurrency: string;
}>) {
  const items = await getPortfolioAllocationDonutCardsCached(baseCurrency, portfolios);
  return <PortfolioAllocationsByPortfolioDeferredWidget items={items} />;
}

const getAuthenticatedContext = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    throw new Error("User not authenticated.");
  }

  return {
    supabase,
    userId: authData.user.id,
  };
});

const getPortfolioDashboardCoreDataCached = async (
  selectedPortfolioId: string | null,
  baseCurrency: string
): Promise<DashboardCoreData> => {
  "use cache: private";

  // Keep first paint lean: only the core chart/valuation data needed above the fold.
  cacheLife("minutes");
  cacheTag("portfolio:all");
  if (selectedPortfolioId) {
    cacheTag(`portfolio:${selectedPortfolioId}`);
  }

  const { supabase } = await getAuthenticatedContext();
  const [summary, snapshotRows, liveTotals] = await Promise.all([
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
  ]);

  const firstSnapshotDate = snapshotRows.rows[0]?.bucketDate ?? null;
  const lastSnapshotDate =
    snapshotRows.rows[snapshotRows.rows.length - 1]?.bucketDate ?? null;
  const polishCpiSeries =
    firstSnapshotDate && lastSnapshotDate
      ? await getPolishCpiSeriesCached(supabase, firstSnapshotDate, lastSnapshotDate)
      : [];

  return {
    summary,
    snapshotRows,
    liveTotals,
    polishCpiSeries,
    benchmarkSeries: emptyDashboardBenchmarkSeries(
      snapshotRows.rows.map((row) => row.bucketDate)
    ),
  };
};

const getPortfolioRecentTransactionsCached = async (
  selectedPortfolioId: string | null
) => {
  "use cache: private";

  cacheLife("minutes");
  cacheTag("transactions:all");
  cacheTag("portfolio:all");
  if (selectedPortfolioId) {
    cacheTag(`portfolio:${selectedPortfolioId}`);
    cacheTag(`transactions:portfolio:${selectedPortfolioId}`);
  }

  const { supabase } = await getAuthenticatedContext();
  const result = await listTransactions(supabase, {
    query: null,
    type: null,
    sort: "date_desc",
    page: 1,
    pageSize: 6,
    portfolioId: selectedPortfolioId,
  });

  return result.items;
};

const getPortfolioDividendInboxCached = async (selectedPortfolioId: string | null) => {
  "use cache: private";

  cacheLife("minutes");
  cacheTag("portfolio:all");
  if (selectedPortfolioId) {
    cacheTag(`portfolio:${selectedPortfolioId}`);
  }

  const { supabase, userId } = await getAuthenticatedContext();
  return getDividendInbox({
    supabase,
    userId,
    portfolioId: selectedPortfolioId,
    pastDays: 60,
    futureDays: 60,
  });
};

const getPortfolioAllocationDonutCardsCached = async (
  baseCurrency: string,
  portfolios: readonly PortfolioOption[]
) => {
  "use cache: private";

  cacheLife("minutes");
  cacheTag("portfolio:all");

  const { supabase } = await getAuthenticatedContext();
  return getPortfolioAllocationDonutCards(supabase, {
    portfolios: portfolios.map((portfolio) => ({
      id: portfolio.id,
      name: portfolio.name,
    })),
    baseCurrency: baseCurrency as CurrencyCode,
  });
};

function DeferredDashboardWidgetSkeleton({ title }: Readonly<{ title: string }>) {
  return (
    <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-muted/50" />
        <div className="h-24 animate-pulse rounded-md border border-dashed border-border/70 bg-background/65" />
      </div>
    </section>
  );
}
