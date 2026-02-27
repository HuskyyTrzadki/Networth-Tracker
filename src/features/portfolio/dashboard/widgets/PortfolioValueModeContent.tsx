"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";
import { splitCurrencyLabel } from "@/lib/format-currency";

import type { ComparisonChartPoint, NullableSeriesPoint } from "../lib/chart-helpers";
import type { ChartRange } from "../lib/chart-helpers";
import { formatPercent } from "../lib/chart-helpers";
import { PortfolioSnapshotRebuildChartLoader } from "./PortfolioSnapshotRebuildChartLoader";
import {
  getPortfolioChartEmptyStateClassName,
  SHARED_PORTFOLIO_CHART_HEIGHT,
} from "./portfolio-value-over-time-chart-layout";

const PortfolioComparisonChart = dynamic(
  () =>
    import("@/features/design-system/components/PortfolioComparisonChart").then(
      (module) => module.PortfolioComparisonChart
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

type Props = Readonly<{
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildFromDate: string | null;
  rebuildToDate: string | null;
  rebuildProgressPercent: number | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasValuePoints: boolean;
  range: ChartRange;
  selectedPeriodAbsoluteChange: number | null;
  selectedPeriodChangePercent: number | null;
  comparisonChartData: readonly ComparisonChartPoint[];
  investedCapitalSeries: readonly NullableSeriesPoint[];
  formatCurrencyValue: (value: number) => string;
  formatDayLabelWithYear: (label: string) => string;
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
        <span className="text-[0.58em] font-medium text-muted-foreground/75">
          {currency}
        </span>
      ) : null}
    </span>
  );
}

export function PortfolioValueModeContent({
  rebuildStatus,
  rebuildFromDate,
  rebuildToDate,
  rebuildProgressPercent,
  hasHoldings,
  shouldBootstrap,
  hasValuePoints,
  range,
  selectedPeriodAbsoluteChange,
  selectedPeriodChangePercent,
  comparisonChartData,
  investedCapitalSeries,
  formatCurrencyValue,
  formatDayLabelWithYear,
  transactionCreateHref,
  cashDepositHref,
  bootstrapPending,
  onBootstrapRequest,
}: Props) {
  const isRebuildBusy = rebuildStatus === "queued" || rebuildStatus === "running";

  if (isRebuildBusy) {
    return (
      <PortfolioSnapshotRebuildChartLoader
        fromDate={rebuildFromDate}
        toDate={rebuildToDate}
        progressPercent={rebuildProgressPercent}
      />
    );
  }

  if (!hasValuePoints) {
    return (
      <div className={cn(getPortfolioChartEmptyStateClassName(shouldBootstrap), "space-y-3")}>
        <p>
          {hasHoldings
            ? "Tworzymy pierwszy punkt."
            : "Dodaj transakcję, aby zobaczyć wykres."}
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

  const hasInvestedCapitalData = comparisonChartData.some(
    (entry) => entry.investedCapital !== null
  );
  const hasInvestedCapitalGaps =
    hasInvestedCapitalData &&
    investedCapitalSeries.some((entry) => entry.value === null);
  const periodTrendLabel =
    selectedPeriodAbsoluteChange === null
      ? "Brak danych"
      : selectedPeriodAbsoluteChange > 0
        ? "Trend: wzrost"
        : selectedPeriodAbsoluteChange < 0
          ? "Trend: spadek"
          : "Trend: bez zmian";

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-border/65 bg-background/68 px-3 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
          {`Zmiana za okres (${range})`}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div
            className={cn(
              "text-4xl font-semibold",
              selectedPeriodAbsoluteChange !== null && selectedPeriodAbsoluteChange > 0
                ? "text-[color:var(--profit)]"
                : selectedPeriodAbsoluteChange !== null &&
                    selectedPeriodAbsoluteChange < 0
                  ? "text-[color:var(--loss)]"
                  : "text-foreground"
            )}
          >
            {selectedPeriodAbsoluteChange !== null
              ? (
                  <EmphasizedCurrencyAmount
                    value={`${selectedPeriodAbsoluteChange > 0 ? "+" : ""}${formatCurrencyValue(
                      selectedPeriodAbsoluteChange
                    )}`}
                  />
                )
              : "—"}
          </div>
          <div
            className={cn(
              "font-mono text-sm tabular-nums",
              selectedPeriodChangePercent !== null && selectedPeriodChangePercent > 0
                ? "text-[color:var(--profit)]"
                : selectedPeriodChangePercent !== null && selectedPeriodChangePercent < 0
                  ? "text-[color:var(--loss)]"
                  : "text-muted-foreground"
            )}
          >
            {selectedPeriodChangePercent !== null
              ? formatPercent(selectedPeriodChangePercent)
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
        <PortfolioComparisonChart
          data={comparisonChartData}
          valueFormatter={formatCurrencyValue}
          labelFormatter={formatDayLabelWithYear}
        />
      </div>
      {hasInvestedCapitalGaps ? (
        <div className="rounded-sm border border-dashed border-border/65 bg-background/68 px-2.5 py-1.5 text-xs text-muted-foreground">
          Luki w kapitale zainwestowanym (brak części przepływów/transferów).
        </div>
      ) : null}
    </div>
  );
}
