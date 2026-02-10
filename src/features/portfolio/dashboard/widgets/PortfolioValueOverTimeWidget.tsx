"use client";

import { ChartCard } from "@/features/design-system";
import type { PolishCpiPoint } from "@/features/market-data";
import type { SnapshotScope } from "../../server/snapshots/types";
import type { LiveTotalsResult } from "../../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import type { DashboardBenchmarkSeries } from "../lib/benchmark-config";
import { SHARED_PORTFOLIO_WIDGET_MIN_HEIGHT_CLASS } from "./portfolio-value-over-time-chart-layout";
import { PortfolioValueOverTimeChart } from "./PortfolioValueOverTimeChart";

type Props = Readonly<{
  scope: SnapshotScope;
  selectedPortfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
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
  rows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  rebuild,
}: Props) {
  return (
    <ChartCard
      title="Wartość i performance"
      subtitle="Na podstawie dziennych snapshotów"
      surface="subtle"
      className={SHARED_PORTFOLIO_WIDGET_MIN_HEIGHT_CLASS}
    >
      <PortfolioValueOverTimeChart
        scope={scope}
        portfolioId={selectedPortfolioId}
        hasHoldings={hasHoldings}
        hasSnapshots={hasSnapshots}
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
