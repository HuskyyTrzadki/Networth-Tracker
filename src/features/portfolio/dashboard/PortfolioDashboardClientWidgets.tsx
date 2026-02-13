"use client";

import type { PolishCpiPoint } from "@/features/market-data";
import type { DashboardBenchmarkSeries } from "./lib/benchmark-config";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import type { TransactionListItem } from "@/features/transactions/server/list-transactions";
import { useSnapshotRebuild } from "./hooks/useSnapshotRebuild";
import { AllocationHoldingsWidget } from "./widgets/AllocationHoldingsWidget";
import { PortfolioTopMoversWidget } from "./widgets/PortfolioTopMoversWidget";
import { PortfolioValueOverTimeWidget } from "./widgets/PortfolioValueOverTimeWidget";
import { PortfolioRecentTransactionsWidget } from "./widgets/PortfolioRecentTransactionsWidget";

type Props = Readonly<{
  selectedPortfolioId: string | null;
  summary: PortfolioSummary;
  snapshotRows: Readonly<{
    hasSnapshots: boolean;
    includesFullHistory: boolean;
    rows: readonly SnapshotChartRow[];
  }>;
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
  recentTransactions: readonly TransactionListItem[];
}>;

export function PortfolioDashboardClientWidgets({
  selectedPortfolioId,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  recentTransactions,
}: Props) {
  const scope = selectedPortfolioId ? "PORTFOLIO" : "ALL";
  const rebuild = useSnapshotRebuild(scope, selectedPortfolioId, true);

  return (
    <>
      <PortfolioValueOverTimeWidget
        key={`${scope}:${selectedPortfolioId ?? "all"}`}
        scope={scope}
        selectedPortfolioId={selectedPortfolioId}
        hasHoldings={summary.holdings.length > 0}
        hasSnapshots={snapshotRows.hasSnapshots}
        includesFullHistory={snapshotRows.includesFullHistory}
        rows={snapshotRows.rows}
        liveTotals={liveTotals}
        polishCpiSeries={polishCpiSeries}
        benchmarkSeries={benchmarkSeries}
        rebuild={rebuild}
      />
      <AllocationHoldingsWidget summary={summary} rebuild={rebuild} />
      <PortfolioTopMoversWidget summary={summary} />
      <PortfolioRecentTransactionsWidget
        selectedPortfolioId={selectedPortfolioId}
        items={recentTransactions}
      />
    </>
  );
}
