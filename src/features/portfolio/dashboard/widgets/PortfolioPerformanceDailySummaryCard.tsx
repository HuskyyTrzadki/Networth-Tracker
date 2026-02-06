import { ChangePill } from "@/features/design-system";

import { formatPercent } from "../lib/chart-helpers";

type Props = Readonly<{
  dailyReturnValue: number | null;
}>;

export function PortfolioPerformanceDailySummaryCard({
  dailyReturnValue,
}: Props) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">Zwrot dzienny</div>
      <div className="flex flex-wrap items-baseline gap-2">
        <div className="text-3xl font-semibold">
          {dailyReturnValue !== null
            ? formatPercent(dailyReturnValue)
            : "—"}
        </div>
        {dailyReturnValue !== null ? (
          <ChangePill
            value={formatPercent(dailyReturnValue)}
            trend={
              dailyReturnValue > 0
                ? "up"
                : dailyReturnValue < 0
                  ? "down"
                  : "flat"
            }
          />
        ) : null}
      </div>
    </div>
  );
}
