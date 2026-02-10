"use client";

import { ChartCard } from "@/features/design-system";
import { Badge } from "@/features/design-system/components/ui/badge";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { cn } from "@/lib/cn";
import { parseDecimalString } from "@/lib/decimal";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import type { PortfolioSummary } from "../../server/valuation";
import { buildTopMovers } from "./top-movers-utils";

type Props = Readonly<{
  summary: PortfolioSummary;
}>;

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  signDisplay: "always",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatSignedCurrency = (
  value: string,
  baseCurrency: string,
  formatter: Intl.NumberFormat | null
) => {
  const parsed = parseDecimalString(value);
  if (!parsed) return null;

  const formattedFromFormatter = formatter
    ? formatCurrencyString(parsed.toString(), formatter)
    : null;
  const formatted = formattedFromFormatter ?? `${parsed.toString()} ${baseCurrency}`;

  if (!formatted) return null;
  return parsed.gt(0) ? `+${formatted}` : formatted;
};

const formatPercent = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? percentFormatter.format(value)
    : "—";

const formatQuotePrice = (price: string | null, currency: string) => {
  if (!price) return "—";
  const formatter = getCurrencyFormatter(currency);
  if (!formatter) return `${price} ${currency}`;
  return formatCurrencyString(price, formatter) ?? `${price} ${currency}`;
};

export function PortfolioTopMoversWidget({ summary }: Props) {
  const formatter = getCurrencyFormatter(summary.baseCurrency);
  const movers = buildTopMovers(summary);

  return (
    <ChartCard
      title="Największe ruchy"
      subtitle="Dziś (opóźnione notowania)."
    >
      {movers.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {movers.map((mover) => {
            const changeLabel = formatSignedCurrency(
              mover.todayChangeBase,
              summary.baseCurrency,
              formatter
            );
            const percentLabel = formatPercent(mover.todayChangePercent);
            const trendTone =
              mover.trend === "UP"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300";
            const badgeTone =
              mover.trend === "UP"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";

            return (
              <li
                key={mover.instrumentId}
                className="rounded-full border border-border/70 bg-muted/10 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <InstrumentLogoImage
                      alt=""
                      className="size-6 shrink-0"
                      fallbackText={mover.symbol}
                      size={24}
                      src={mover.logoUrl}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">
                          {mover.symbol}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {formatQuotePrice(mover.price, mover.currency)}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {mover.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("rounded-full border px-2 py-0.5", badgeTone)}>
                      {percentLabel}
                    </Badge>
                    <span
                      className={cn(
                        "font-mono text-[12px] font-semibold tabular-nums",
                        trendTone
                      )}
                    >
                      {changeLabel ?? "—"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Brak danych o dziennych zmianach dla pozycji.
        </div>
      )}
      {summary.isPartial ? (
        <div className="mt-3 text-[12px] text-muted-foreground">
          Część pozycji bez danych dziennych.
        </div>
      ) : null}
    </ChartCard>
  );
}
