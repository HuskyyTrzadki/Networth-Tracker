import { ChangePill } from "@/features/design-system";
import { getCurrencyFormatter } from "@/lib/format-currency";

import type { SnapshotCurrency } from "../../server/snapshots/supported-currencies";
import { formatPercent } from "../lib/chart-helpers";

type Props = Readonly<{
  currency: SnapshotCurrency;
  latestValue: number | null;
  dailyDelta: number | null;
  dailyDeltaPercent: number | null;
}>;

export function PortfolioValueDailySummaryCard({
  currency,
  latestValue,
  dailyDelta,
  dailyDeltaPercent,
}: Props) {
  const currencyFormatter = getCurrencyFormatter(currency);
  const formatCurrencyValue = (value: number) =>
    currencyFormatter?.format(value) ?? value.toString();

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">
        Zmiana dzienna ({currency})
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <div className="text-3xl font-semibold">
          {latestValue !== null ? formatCurrencyValue(latestValue) : "—"}
        </div>
        {dailyDelta !== null ? (
          <ChangePill
            value={formatCurrencyValue(dailyDelta)}
            trend={dailyDelta > 0 ? "up" : dailyDelta < 0 ? "down" : "flat"}
          />
        ) : null}
        {dailyDeltaPercent !== null ? (
          <ChangePill
            value={formatPercent(dailyDeltaPercent)}
            trend={
              dailyDeltaPercent > 0
                ? "up"
                : dailyDeltaPercent < 0
                  ? "down"
                  : "flat"
            }
          />
        ) : null}
      </div>
    </div>
  );
}
