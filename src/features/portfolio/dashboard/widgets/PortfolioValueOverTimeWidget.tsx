"use client";

import { ChartCard } from "@/features/design-system/components/ChartCard";
import type { PolishCpiPoint } from "@/features/market-data/types";
import type { SnapshotScope } from "../../server/snapshots/types";
import type { LiveTotalsResult } from "../../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import type { DashboardBenchmarkSeries } from "../lib/benchmark-config";
import { PortfolioValueOverTimeChart } from "./PortfolioValueOverTimeChart";

type Props = Readonly<{
  scope: SnapshotScope;
  selectedPortfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  includesFullHistory: boolean;
  rows: readonly SnapshotChartRow[];
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
  rebuild: SnapshotRebuildStatus;
}>;

export function PortfolioValueOverTimeWidget({
  scope,
  selectedPortfolioId,
  hasHoldings,
  hasSnapshots,
  includesFullHistory,
  rows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  rebuild,
}: Props) {
  return (
    <ChartCard
      className="border-border/75 bg-card/94"
      title="Wartość i performance"
      subtitle="Snapshoty dzienne"
      surface="subtle"
    >
      <PortfolioValueOverTimeChart
        scope={scope}
        portfolioId={selectedPortfolioId}
        hasHoldings={hasHoldings}
        hasSnapshots={hasSnapshots}
        initialIncludesFullHistory={includesFullHistory}
        rows={rows}
        todayBucketDate={liveTotals.todayBucketDate}
        liveTotalsByCurrency={liveTotals.totalsByCurrency}
        polishCpiSeries={polishCpiSeries}
        benchmarkSeries={benchmarkSeries}
        rebuild={rebuild}
      />
    </ChartCard>
  );
}
