import type { StockValuationSummary } from "@/features/stocks";

const ratioFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

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

const formatRatio = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? ratioFormatter.format(value)
    : null;

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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-[color:var(--report-rule)] py-2.5 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function StockMetricsGrid({
  summary,
  currency,
}: Readonly<{
  summary: StockValuationSummary;
  currency: string;
}>) {
  const metrics = [
    { label: "Kapitalizacja rynkowa", value: formatMoney(summary.marketCap, currency) },
    { label: "PE (TTM)", value: formatRatio(summary.peTtm) },
    { label: "Cena do sprzedazy (P/S)", value: formatRatio(summary.priceToSales) },
    { label: "EV do EBITDA", value: formatRatio(summary.evToEbitda) },
    { label: "Cena do wartosci ksiegowej (P/B)", value: formatRatio(summary.priceToBook) },
    { label: "Marza zysku", value: formatPercent(summary.profitMargin) },
    { label: "Marza operacyjna", value: formatPercent(summary.operatingMargin) },
    { label: "Zysk kwartalny (r/r)", value: formatPercent(summary.quarterlyEarningsYoy) },
    { label: "Przychody kwartalne (r/r)", value: formatPercent(summary.quarterlyRevenueYoy) },
    { label: "Gotowka", value: formatMoney(summary.cash, currency) },
    { label: "Dlug", value: formatMoney(summary.debt, currency) },
    { label: "Stopa dywidendy", value: formatPercent(summary.dividendYield) },
    { label: "Wskaznik wyplaty", value: formatPercent(summary.payoutRatio) },
    { label: "Data wyplaty", value: formatDate(summary.payoutDate) },
    { label: "Stan na", value: summary.asOf ? formatDate(summary.asOf.slice(0, 10)) : null },
  ].filter((metric): metric is { label: string; value: string } => metric.value !== null);

  return (
    <section className="space-y-3 pt-3">
      <h2 className="text-3xl font-semibold tracking-tight">Wycena i fundamenty</h2>
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </section>
  );
}
