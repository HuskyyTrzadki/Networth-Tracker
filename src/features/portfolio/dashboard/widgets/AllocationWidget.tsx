import { AllocationDonutChart, ChartCard } from "@/features/design-system";
import { Alert } from "@/features/design-system/components/ui/alert";
import { cn } from "@/lib/cn";
import {
  formatCurrencyString,
  getCurrencyFormatter,
} from "@/lib/format-currency";
import { AlertTriangle } from "lucide-react";

import type { PortfolioSummary } from "../../server/valuation";
import { buildAllocationData } from "./allocation-utils";
import { getConcentrationWarning } from "./concentration-utils";

type Props = Readonly<{
  summary: PortfolioSummary;
}>;

const formatPercent = (value: number, maxFractionDigits = 1) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

const formatAsOf = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function AllocationWidget({ summary }: Props) {
  const formatter = getCurrencyFormatter(summary.baseCurrency);
  const concentrationWarning = getConcentrationWarning(summary);
  const warningTone =
    concentrationWarning?.severity === "CRITICAL"
      ? "text-destructive bg-destructive/10"
      : concentrationWarning?.severity === "HARD"
        ? "text-rose-600 bg-rose-50"
        : concentrationWarning
          ? "text-amber-700 bg-amber-50"
          : "";
  const totalLabel =
    formatter && summary.totalValueBase
      ? formatCurrencyString(summary.totalValueBase, formatter) ?? "—"
      : "—";

  const rows = buildAllocationData(summary);
  const hasAllocation = rows.length > 0;
  const slices = rows.map((row) => {
    const tooltipValue =
      formatter && row.valueBase
        ? formatCurrencyString(row.valueBase, formatter) ??
          `${row.valueBase} ${summary.baseCurrency}`
        : row.valueBase
          ? `${row.valueBase} ${summary.baseCurrency}`
          : "—";

    return {
      id: row.label,
      value: row.share,
      color: row.color,
      tooltipLabel: row.label,
      tooltipValue,
    };
  });

  return (
    <ChartCard
      title="Alokacja"
      subtitle="Udział wartości portfela"
      right={
        summary.asOf ? (
          <div className="text-right text-[12px] text-muted-foreground">
            Stan na: {formatAsOf(summary.asOf)}
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
          <div className="relative w-full">
            {hasAllocation ? (
              <AllocationDonutChart data={slices} height={300} />
            ) : (
              <div className="grid h-[300px] w-full place-items-center rounded-md border border-dashed border-border text-[12px] text-muted-foreground">
                Brak danych do alokacji
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[12px] font-medium text-muted-foreground">
                  Wartość portfela
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                  {totalLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
        {hasAllocation ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => {
              const valueLabel =
                formatter && row.valueBase
                  ? formatCurrencyString(row.valueBase, formatter) ??
                    `${row.valueBase} ${summary.baseCurrency}`
                  : row.valueBase
                    ? `${row.valueBase} ${summary.baseCurrency}`
                    : "—";

              return (
                <div
                  key={row.id}
                  className="rounded-md border border-border/70 bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: row.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {row.label}
                      </span>
                    </div>
                    <div className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-foreground">
                      {formatPercent(row.share)}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: row.color,
                        width: `${Math.max(0, Math.min(100, row.share * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <div className="font-mono text-[12px] tabular-nums text-muted-foreground">
                      {valueLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {concentrationWarning ? (
          <Alert
            className={cn(
              "flex items-start gap-2 border-none px-2 py-1.5 text-[13px] shadow-none",
              warningTone
            )}
          >
            <AlertTriangle className="mt-0.5 size-4" aria-hidden />
            <span className="text-inherit">
              {concentrationWarning.symbol} stanowi{" "}
              {formatPercent(concentrationWarning.weight, 0)} portfela.
            </span>
          </Alert>
        ) : null}
      </div>
      {summary.isPartial ? (
        <div className="mt-3 text-[12px] text-muted-foreground">
          Częściowa wycena: brak cen dla {summary.missingQuotes} pozycji, brak FX
          dla {summary.missingFx} pozycji.
        </div>
      ) : null}
    </ChartCard>
  );
}
