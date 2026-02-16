import type {
  StockValuationRangeContext,
  StockValuationSummary,
} from "@/features/stocks";

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

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const interpretationCopy: Readonly<
  Record<StockValuationRangeContext["interpretation"], string>
> = {
  HISTORY_LOW: "Historycznie niska wycena",
  HISTORY_MID: "Blisko historycznej normy",
  HISTORY_HIGH: "Historycznie wysoka wycena",
  INSUFFICIENT_HISTORY: "Za malo danych historycznych",
  NO_DATA: "Brak danych historycznych",
};

function MetricRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-[color:var(--report-rule)] py-2 text-[13px] last:border-b-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono text-[13px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ValuationRangeBar({
  context,
}: Readonly<{
  context: StockValuationRangeContext;
}>) {
  const hasBoundaries =
    typeof context.min === "number" &&
    typeof context.max === "number" &&
    Number.isFinite(context.min) &&
    Number.isFinite(context.max);
  const hasMarker = hasBoundaries && typeof context.current === "number";
  const hasMedian = hasBoundaries && typeof context.median === "number";
  const denominator =
    hasBoundaries && context.max !== context.min ? context.max - context.min : 1;
  const currentRatio =
    hasMarker && context.min !== null && context.max !== null
      ? clamp((context.current - context.min) / denominator)
      : 0.5;
  const medianRatio =
    hasMedian && context.min !== null && context.max !== null
      ? clamp((context.median - context.min) / denominator)
      : 0.5;
  const coverageText =
    context.coverageStart && context.coverageEnd
      ? `${formatDate(context.coverageStart)} - ${formatDate(context.coverageEnd)}`
      : "Brak zakresu";

  return (
    <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">PE (TTM)</h3>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatRatio(context.current) ?? "—"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {interpretationCopy[context.interpretation]}
      </p>

      <div className="mt-3">
        <div
          className="relative h-7 overflow-hidden rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 14px, rgb(57 57 57 / 0.06) 14px 15px)",
          }}
        >
          {hasMedian ? (
            <span
              className="absolute inset-y-0 w-px bg-foreground/45"
              style={{ left: `${medianRatio * 100}%` }}
              aria-hidden
            />
          ) : null}
          {hasMarker ? (
            <span
              className="absolute inset-y-0.5 w-[2px] rounded-full bg-foreground"
              style={{ left: `${currentRatio * 100}%` }}
              aria-hidden
            />
          ) : null}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums">
            Min {formatRatio(context.min) ?? "—"}
          </span>
          <span className="font-mono tabular-nums">
            Srednia {formatRatio(context.median) ?? "—"}
          </span>
          <span className="font-mono tabular-nums">
            Max {formatRatio(context.max) ?? "—"}
          </span>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Zakres: <span className="font-mono tabular-nums">{coverageText}</span>
        {context.isTruncated ? " (skrocony zakres)" : ""}
      </p>
    </article>
  );
}

export function StockMetricsGrid({
  summary,
  currency,
  peContext,
}: Readonly<{
  summary: StockValuationSummary;
  currency: string;
  peContext: StockValuationRangeContext;
}>) {
  const valuationRows = [
    { label: "Cena do sprzedazy (P/S)", value: formatRatio(summary.priceToSales) },
    { label: "EV do EBITDA", value: formatRatio(summary.evToEbitda) },
    { label: "Cena do wartosci ksiegowej (P/B)", value: formatRatio(summary.priceToBook) },
  ].filter((row): row is { label: string; value: string } => row.value !== null);

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
    { label: "Stan na", value: summary.asOf ? formatDate(summary.asOf.slice(0, 10)) : null },
  ].filter((row): row is { label: string; value: string } => row.value !== null);

  return (
    <section className="space-y-3 pt-3">
      <h2 className="text-2xl font-semibold tracking-tight">Wycena i fundamenty</h2>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-2.5">
          <p className="text-sm text-muted-foreground">
            Kontekst 5Y: odczyt biezacy na tle historii spolki.
          </p>
          <ValuationRangeBar context={peContext} />
          <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Dodatkowe mnozniki
            </p>
            <div className="mt-2">
              {valuationRows.length > 0 ? (
                valuationRows.map((metric) => (
                  <MetricRow key={metric.label} label={metric.label} value={metric.value} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Brak dodatkowych mnoznikow.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Fundamenty
          </p>
          <div className="mt-2">
            {fundamentalRows.map((metric) => (
              <MetricRow key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
