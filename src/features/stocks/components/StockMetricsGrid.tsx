import type {
  StockValuationRangeContext,
  StockValuationSummary,
} from "@/features/stocks/types";
import { InfoHint } from "@/features/design-system";
import { Card, CardContent } from "@/features/design-system/components/ui/card";

import { StockValuationContextCard } from "./StockValuationContextCard";

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 2,
});

const metricCurrencyFormatter = (currency: string) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  });

const formatPercent = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? percentFormatter.format(value)
    : null;

const formatMoney = (value: number | null, currency: string) =>
  typeof value === "number" && Number.isFinite(value)
    ? metricCurrencyFormatter(currency).format(value)
    : null;

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

function MetricRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-black/15 px-2 py-2 text-[13px] last:border-b-0 hover:bg-emerald-900/5 before:absolute before:bottom-1 before:left-0 before:top-1 before:w-px before:bg-transparent hover:before:bg-emerald-700/35">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-right font-mono text-[13px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function StockMetricsGrid({
  summary,
  currency,
  valuationContexts,
}: Readonly<{
  summary: StockValuationSummary;
  currency: string;
  valuationContexts: Readonly<
    Record<"peTtm" | "priceToSales" | "priceToBook", StockValuationRangeContext>
  >;
}>) {
  const fundamentalRows = [
    { label: "Kapitalizacja rynkowa", value: formatMoney(summary.marketCap, currency) },
    { label: "Marza zysku", value: formatPercent(summary.profitMargin) },
    { label: "Marza operacyjna", value: formatPercent(summary.operatingMargin) },
    { label: "Zysk kwartalny (r/r)", value: formatPercent(summary.quarterlyEarningsYoy) },
    { label: "Przychody kwartalne (r/r)", value: formatPercent(summary.quarterlyRevenueYoy) },
    { label: "Gotowka", value: formatMoney(summary.cash, currency) },
    { label: "Dlug", value: formatMoney(summary.debt, currency) },
    { label: "Stopa dywidendy", value: formatPercent(summary.dividendYield) },
    { label: "Wskaznik wyplaty", value: formatPercent(summary.payoutRatio) },
    { label: "Data wyplaty", value: formatDate(summary.payoutDate) },
  ].filter((row): row is { label: string; value: string } => row.value !== null);
  const fundamentalsHint = summary.asOf
    ? `Stan na ${formatDate(summary.asOf.slice(0, 10)) ?? summary.asOf.slice(0, 10)}`
    : "Brak daty aktualizacji danych fundamentalnych.";

  return (
    <section className="space-y-3 pt-3">
      <h2 className="font-serif text-2xl font-bold tracking-tight">Wycena i fundamenty</h2>
      <Card className="border-black/5 bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <StockValuationContextCard
              summary={summary}
              valuationContexts={valuationContexts}
            />

            <div className="border-t border-dashed border-black/15 pt-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <span>Fundamenty</span>
                <InfoHint
                  text={fundamentalsHint}
                  ariaLabel="Informacja o czasie danych fundamentalnych"
                  className="size-4 border-black/10 bg-white"
                />
              </div>
              <div className="mt-2">
                {fundamentalRows.map((metric) => (
                  <MetricRow key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
