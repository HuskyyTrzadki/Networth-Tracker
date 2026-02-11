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
    <div className="rounded-lg border border-border/70 bg-card/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{value}</p>
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
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-base font-semibold tracking-tight">Wycena i fundamenty</h2>
      </header>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
