"use client";

import dynamic from "next/dynamic";

import type { PolishCpiPoint } from "@/features/market-data/types";
import type { DashboardBenchmarkSeries } from "./lib/benchmark-config";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import { useSnapshotRebuild } from "./hooks/useSnapshotRebuild";
import { AllocationHoldingsWidget } from "./widgets/AllocationHoldingsWidget";
import { CurrencyExposureWidget } from "./widgets/CurrencyExposureWidget";
import { PortfolioValueOverTimeWidget } from "./widgets/PortfolioValueOverTimeWidget";
import { RenderWhenVisible } from "./components/RenderWhenVisible";

const PortfolioTopMoversWidget = dynamic(
  () =>
    import("./widgets/PortfolioTopMoversWidget").then(
      (module) => module.PortfolioTopMoversWidget
    ),
  {
    ssr: false,
    loading: () => <DeferredWidgetSkeleton title="Największe ruchy" />,
  }
);

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
}>;

function DeferredWidgetSkeleton({
  title,
}: Readonly<{
  title: string;
}>) {
  return (
    <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-48 animate-pulse rounded bg-muted/50" />
        <div className="h-20 animate-pulse rounded-md border border-dashed border-border/70 bg-background/65" />
      </div>
    </section>
  );
}

export function PortfolioDashboardClientWidgets({
  selectedPortfolioId,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
}: Props) {
  const scope = selectedPortfolioId ? "PORTFOLIO" : "ALL";
  const rebuild = useSnapshotRebuild(scope, selectedPortfolioId, true);

  return (
    <div className="space-y-5">
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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AllocationHoldingsWidget summary={summary} rebuild={rebuild} />
        <CurrencyExposureWidget
          selectedPortfolioId={selectedPortfolioId}
          summary={summary}
        />
      </div>
      <RenderWhenVisible
        fallback={<DeferredWidgetSkeleton title="Największe ruchy" />}
        rootMargin="300px 0px"
      >
        <PortfolioTopMoversWidget summary={summary} />
      </RenderWhenVisible>
    </div>
  );
}
