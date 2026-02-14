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
    : "-";

const formatPercent = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? percentFormatter.format(value)
    : "-";

const formatMoney = (value: number | null, currency: string) =>
  typeof value === "number" && Number.isFinite(value)
    ? metricCurrencyFormatter(currency).format(value)
    : "-";

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "-";
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
    <div className="news-divider-row-b grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 text-sm">
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
  return (
    <section className="news-divider-strong-t space-y-3 pt-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Wycena i fundamenty</h2>
        <p className="text-xs text-muted-foreground">Dane z ostatniej aktualizacji</p>
      </header>
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <MetricRow label="Market Cap" value={formatMoney(summary.marketCap, currency)} />
        <MetricRow label="PE (TTM)" value={formatRatio(summary.peTtm)} />
        <MetricRow label="Price to Sales" value={formatRatio(summary.priceToSales)} />
        <MetricRow label="EV to EBITDA" value={formatRatio(summary.evToEbitda)} />
        <MetricRow label="Price to Book" value={formatRatio(summary.priceToBook)} />
        <MetricRow label="Profit Margin" value={formatPercent(summary.profitMargin)} />
        <MetricRow label="Operating Margin" value={formatPercent(summary.operatingMargin)} />
        <MetricRow
          label="Quarterly Earnings (YoY)"
          value={formatPercent(summary.quarterlyEarningsYoy)}
        />
        <MetricRow
          label="Quarterly Revenue (YoY)"
          value={formatPercent(summary.quarterlyRevenueYoy)}
        />
        <MetricRow label="Cash" value={formatMoney(summary.cash, currency)} />
        <MetricRow label="Debt" value={formatMoney(summary.debt, currency)} />
        <MetricRow label="Dividend Yield" value={formatPercent(summary.dividendYield)} />
        <MetricRow label="Payout Ratio" value={formatPercent(summary.payoutRatio)} />
        <MetricRow label="Payout Date" value={formatDate(summary.payoutDate)} />
        <MetricRow label="As of" value={summary.asOf ? formatDate(summary.asOf.slice(0, 10)) : "-"} />
      </div>
      <p className="text-xs text-muted-foreground">
        Brakujące dane z providera są pokazane jako „-”.
      </p>
    </section>
  );
}
