import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import type { PortfolioSummary } from "../../server/valuation";

type Props = Readonly<{
  summary: PortfolioSummary;
}>;

const formatAsOf = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function TotalValueWidget({ summary }: Props) {
  const formatter = getCurrencyFormatter(summary.baseCurrency);
  const totalLabel =
    formatter && summary.totalValueBase
      ? formatCurrencyString(summary.totalValueBase, formatter) ?? "—"
      : "—";

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">
            Wartość portfela
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {totalLabel}
          </div>
        </div>
        {summary.asOf ? (
          <span className="text-xs text-muted-foreground">
            Stan na: {formatAsOf(summary.asOf)}
          </span>
        ) : null}
      </div>
      {summary.isPartial ? (
        <div className="mt-3 text-xs text-muted-foreground">
          Częściowa wycena: brak cen dla {summary.missingQuotes} pozycji, brak FX
          dla {summary.missingFx} pozycji.
        </div>
      ) : null}
    </section>
  );
}
