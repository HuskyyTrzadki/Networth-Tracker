"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";
import { splitCurrencyLabel } from "@/lib/format-currency";

import type { ChartRange } from "../lib/chart-helpers";
import { formatPercent } from "../lib/chart-helpers";
import { PortfolioSnapshotRebuildChartLoader } from "./PortfolioSnapshotRebuildChartLoader";
import {
  getPortfolioChartEmptyStateClassName,
  SHARED_PORTFOLIO_CHART_HEIGHT,
} from "./portfolio-value-over-time-chart-layout";

const DailyReturnsLineChart = dynamic(
  () =>
    import("@/features/design-system/components/DailyReturnsLineChart").then(
      (module) => module.DailyReturnsLineChart
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[360px] animate-pulse rounded-md border border-dashed border-border/70 bg-card/40"
        aria-hidden="true"
      />
    ),
  }
);

type Point = Readonly<{
  label: string;
  value: number;
  comparisons?: Readonly<Record<string, number | null | undefined>>;
}>;

type ComparisonLine = Readonly<{
  id: string;
  label: string;
  color: string;
  strokeStyle?: "monotone" | "stepAfter";
}>;

type Props = Readonly<{
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildFromDate: string | null;
  rebuildToDate: string | null;
  rebuildProgressPercent: number | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasPerformanceData: boolean;
  range: ChartRange;
  selectedPeriodReturn: number | null;
  selectedPeriodPerformanceAbsoluteChange: number | null;
  cumulativeChartData: readonly Point[];
  comparisonLines: readonly ComparisonLine[];
  formatCurrencyValue: (value: number) => string;
  transactionCreateHref: string;
  cashDepositHref: string;
  bootstrapPending: boolean;
  onBootstrapRequest: () => void;
}>;

function EmphasizedCurrencyAmount({
  value,
  className,
}: Readonly<{ value: string; className?: string }>) {
  const { amount, currency } = splitCurrencyLabel(value);

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span>{amount}</span>
      {currency ? (
        <span className="text-[0.62em] font-medium text-muted-foreground/75">
          {currency}
        </span>
      ) : null}
    </span>
  );
}

export function PortfolioPerformanceModeContent({
  rebuildStatus,
  rebuildFromDate,
  rebuildToDate,
  rebuildProgressPercent,
  hasHoldings,
  shouldBootstrap,
  hasPerformanceData,
  range,
  selectedPeriodReturn,
  selectedPeriodPerformanceAbsoluteChange,
  cumulativeChartData,
  comparisonLines,
  formatCurrencyValue,
  transactionCreateHref,
  cashDepositHref,
  bootstrapPending,
  onBootstrapRequest,
}: Props) {
  const isRebuildBusy = rebuildStatus === "queued" || rebuildStatus === "running";
  const periodTrendLabel =
    selectedPeriodReturn === null
      ? "Brak danych"
      : selectedPeriodReturn > 0
        ? "Trend: wzrost"
        : selectedPeriodReturn < 0
          ? "Trend: spadek"
          : "Trend: bez zmian";

  if (isRebuildBusy) {
    return (
      <PortfolioSnapshotRebuildChartLoader
        fromDate={rebuildFromDate}
        toDate={rebuildToDate}
        progressPercent={rebuildProgressPercent}
      />
    );
  }

  if (!hasPerformanceData) {
    return (
      <div className={cn(getPortfolioChartEmptyStateClassName(shouldBootstrap), "space-y-3")}>
        <p>
          {hasHoldings
            ? shouldBootstrap
              ? "Tworzymy pierwszy punkt."
              : "Za mało danych (min. 2 dni)."
            : "Dodaj transakcję, aby zobaczyć performance."}
        </p>
        {!hasHoldings ? (
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild className="h-9 rounded-full px-3 text-xs" size="sm">
              <Link href={transactionCreateHref} scroll={false}>
                Dodaj transakcję
              </Link>
            </Button>
            <Button
              asChild
              className="h-9 rounded-full px-3 text-xs"
              size="sm"
              variant="outline"
            >
              <Link href={cashDepositHref} scroll={false}>
                Dodaj depozyt gotówki
              </Link>
            </Button>
          </div>
        ) : shouldBootstrap ? (
          <div className="flex justify-center">
            <Button
              className="h-9 rounded-full px-3 text-xs"
              size="sm"
              onClick={onBootstrapRequest}
              disabled={bootstrapPending}
            >
              {bootstrapPending ? "Tworzenie..." : "Utwórz punkt"}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-border/65 bg-background/68 px-3 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
          {`Zwrot za okres (${range})`}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div
            className={cn(
              "text-4xl font-semibold",
              selectedPeriodReturn !== null && selectedPeriodReturn > 0
                ? "text-[color:var(--profit)]"
                : selectedPeriodReturn !== null && selectedPeriodReturn < 0
                  ? "text-[color:var(--loss)]"
                  : "text-foreground"
            )}
          >
            {selectedPeriodReturn !== null
              ? formatPercent(selectedPeriodReturn)
              : "—"}
          </div>
          <div
            className={cn(
              "font-mono text-sm tabular-nums",
              selectedPeriodPerformanceAbsoluteChange !== null &&
                  selectedPeriodPerformanceAbsoluteChange > 0
                ? "text-[color:var(--profit)]"
                : selectedPeriodPerformanceAbsoluteChange !== null &&
                    selectedPeriodPerformanceAbsoluteChange < 0
                  ? "text-[color:var(--loss)]"
                  : "text-muted-foreground"
            )}
          >
            {selectedPeriodPerformanceAbsoluteChange !== null
              ? (
                  <EmphasizedCurrencyAmount
                    value={`${selectedPeriodPerformanceAbsoluteChange > 0 ? "+" : ""}${formatCurrencyValue(
                      selectedPeriodPerformanceAbsoluteChange
                    )}`}
                  />
                )
              : "—"}
          </div>
          <div className="rounded-sm border border-border/65 bg-background/74 px-2 py-1 text-[11px] text-muted-foreground">
            {periodTrendLabel}
          </div>
        </div>
      </div>

      <div
        className="rounded-md border border-dashed border-border/65 bg-background/68 p-2"
        style={{ height: SHARED_PORTFOLIO_CHART_HEIGHT }}
      >
        <DailyReturnsLineChart
          data={cumulativeChartData}
          comparisonLines={comparisonLines}
        />
      </div>
    </div>
  );
}
