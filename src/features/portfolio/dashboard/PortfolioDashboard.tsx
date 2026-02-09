import { cn } from "@/lib/cn";

import type { PolishCpiPoint } from "@/features/market-data";
import type { DashboardBenchmarkSeries } from "./lib/benchmark-config";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import type { TransactionListItem } from "@/features/transactions/server/list-transactions";
import { PortfolioSwitcher } from "../components/PortfolioSwitcher";
import { PortfolioDashboardClientWidgets } from "./PortfolioDashboardClientWidgets";
import { PortfolioNetValueHero } from "./PortfolioNetValueHero";

type Props = Readonly<{
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[];
  selectedPortfolioId: string | null;
  summary: PortfolioSummary;
  snapshotRows: Readonly<{
    hasSnapshots: boolean;
    rows: readonly SnapshotChartRow[];
  }>;
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
  recentTransactions: readonly TransactionListItem[];
  className?: string;
}>;

export function PortfolioDashboard({
  portfolios,
  selectedPortfolioId,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  recentTransactions,
  className,
}: Props) {
  const selectedPortfolioName = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId)?.name ?? "—"
    : "Wszystkie portfele";

  const portfolioLabel = selectedPortfolioId
    ? `Portfel: ${selectedPortfolioName}`
    : "Portfel: Wszystkie portfele";

  return (
    <div className={cn("space-y-6", className)}>
      <PortfolioNetValueHero
        portfolioLabel={portfolioLabel}
        baseCurrency={summary.baseCurrency}
        totalValueBase={summary.totalValueBase}
        isPartial={summary.isPartial}
      />
      {selectedPortfolioId === null ? (
        <div className="hidden md:block">
          <div className="inline-flex rounded-lg border border-black/5 bg-card p-2 shadow-sm dark:border-white/10">
            <PortfolioSwitcher
              className="sm:gap-2.5"
              portfolios={portfolios}
              selectedId={selectedPortfolioId}
            />
          </div>
        </div>
      ) : null}
      <PortfolioDashboardClientWidgets
        selectedPortfolioId={selectedPortfolioId}
        summary={summary}
        snapshotRows={snapshotRows}
        liveTotals={liveTotals}
        polishCpiSeries={polishCpiSeries}
        benchmarkSeries={benchmarkSeries}
        recentTransactions={recentTransactions}
      />
    </div>
  );
}
