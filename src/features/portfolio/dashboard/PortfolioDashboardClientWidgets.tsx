"use client";

import type { PolishCpiPoint } from "@/features/market-data";
import type { DashboardBenchmarkSeries } from "./lib/benchmark-config";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import { useSnapshotRebuild } from "./hooks/useSnapshotRebuild";
import { AllocationHoldingsWidget } from "./widgets/AllocationHoldingsWidget";
import type { PortfolioAllocationDonutCard } from "../server/get-portfolio-allocation-donut-cards";
import { PortfolioAllocationsByPortfolioWidget } from "./widgets/PortfolioAllocationsByPortfolioWidget";
import { CurrencyExposureWidget } from "./widgets/CurrencyExposureWidget";
import { PortfolioTopMoversWidget } from "./widgets/PortfolioTopMoversWidget";
import { PortfolioValueOverTimeWidget } from "./widgets/PortfolioValueOverTimeWidget";

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
  portfolioAllocationDonutCards: readonly PortfolioAllocationDonutCard[];
}>;

export function PortfolioDashboardClientWidgets({
  selectedPortfolioId,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  portfolioAllocationDonutCards,
}: Props) {
  const scope = selectedPortfolioId ? "PORTFOLIO" : "ALL";
  const rebuild = useSnapshotRebuild(scope, selectedPortfolioId, true);

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AllocationHoldingsWidget summary={summary} rebuild={rebuild} />
        <CurrencyExposureWidget
          selectedPortfolioId={selectedPortfolioId}
          summary={summary}
        />
      </div>
      {!selectedPortfolioId ? (
        <PortfolioAllocationsByPortfolioWidget items={portfolioAllocationDonutCards} />
      ) : null}
      <PortfolioTopMoversWidget summary={summary} />
    </div>
  );
}
