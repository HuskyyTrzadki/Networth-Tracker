import { formatPercent } from "../lib/chart-helpers";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  absoluteChange: number | null;
  dailyReturnValue: number | null;
  formatCurrencyValue: (value: number) => string;
}>;

export function PortfolioPerformanceDailySummaryCard({
  absoluteChange,
  dailyReturnValue,
  formatCurrencyValue,
}: Props) {
  const formattedAbsoluteChange =
    absoluteChange !== null
      ? `${absoluteChange > 0 ? "+" : ""}${formatCurrencyValue(absoluteChange)}`
      : null;
  const formattedPercent =
    dailyReturnValue !== null ? formatPercent(dailyReturnValue) : null;
  const hasFullDailySummary =
    formattedAbsoluteChange !== null && formattedPercent !== null;
  const trendClassName =
    dailyReturnValue !== null && dailyReturnValue > 0
      ? "text-emerald-700"
      : dailyReturnValue !== null && dailyReturnValue < 0
        ? "text-rose-600"
        : "text-foreground";

  return (
    <div className="rounded-md border border-border/70 bg-muted/35 px-4 py-5">
      <div className="text-center font-mono text-sm tabular-nums text-muted-foreground">
        {hasFullDailySummary ? (
          <>
            <span>Dzisiejsza zmiana: </span>
            <span className={cn("font-semibold", trendClassName)}>
              {formattedAbsoluteChange} ({formattedPercent})
            </span>
          </>
        ) : (
          <span>Dzisiejsza zmiana: —</span>
        )}
      </div>
    </div>
  );
}
