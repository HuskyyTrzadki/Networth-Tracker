"use client";
import { useState } from "react";
import type {
  StockValuationRangeContext,
  StockValuationSummary,
} from "@/features/stocks/types";
import { InfoHint } from "@/features/design-system";
import { Badge } from "@/features/design-system/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/features/design-system/components/ui/toggle-group";
import { cn } from "@/lib/cn";

import { MissingValuationHistoryPanel, StockValuationGauge } from "./StockValuationGauge";

type ValuationMetricKey = "peTtm" | "priceToSales" | "priceToBook";
type ValuationMetricConfig = Readonly<{
  key: ValuationMetricKey;
  switchLabel: string;
  title: string;
  bestFor: string;
  cautionLabel: string;
  caution: string;
  tooltip: string;
  recommended?: boolean;
}>;

const ratioFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });
const VALUATION_METRICS: readonly ValuationMetricConfig[] = [
  {
    key: "peTtm",
    switchLabel: "P/E",
    title: "P/E (TTM)",
    bestFor: "Dojrzale, stabilnie zyskowne firmy.",
    cautionLabel: "Nie uzywaj gdy",
    caution: "zysk jest ujemny, mocno cykliczny albo pelen jednorazowek.",
    tooltip:
      "P/E ma sens, gdy zysk jest powtarzalny. Przy slabszej jakosci zysku latwo wyciagnac zly wniosek.",
    recommended: true,
  },
  {
    key: "priceToSales",
    switchLabel: "P/S",
    title: "P/S",
    bestFor: "Tech, growth i SaaS, gdy zyski sa jeszcze niestabilne.",
    cautionLabel: "Warunek",
    caution: "patrz rownoczesnie na marze, bo sam P/S nie pokazuje jakosci biznesu.",
    tooltip:
      "P/S pomaga, gdy wynik netto jest jeszcze zabrudzony. Bez marzy i cash flow latwo przecenic sam wzrost.",
  },
  {
    key: "priceToBook",
    switchLabel: "P/B",
    title: "P/B",
    bestFor: "Banki, ubezpieczyciele i firmy asset-heavy.",
    cautionLabel: "Nie uzywaj gdy",
    caution: "bilans jest napompowany goodwill, intangible albo aktywami trudnymi do wyceny.",
    tooltip:
      "P/B ma sens, gdy wartosc ksiegowa dobrze opisuje biznes. Przy slabej jakosci aktywow ten mnoznik szybko przestaje pomagac.",
  },
];
const formatRatio = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? ratioFormatter.format(value)
    : "—";

const getSummaryMetricValue = (
  summary: StockValuationSummary,
  metric: ValuationMetricKey
) => {
  if (metric === "peTtm") return summary.peTtm;
  if (metric === "priceToSales") return summary.priceToSales;
  return summary.priceToBook;
};
function MetricSummaryRow({
  label,
  value,
  active = false,
  interactive = false,
  onClick,
}: Readonly<{
  label: string;
  value: string;
  active?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}>) {
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={interactive ? onClick : undefined}
      className={cn(
        "relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-black/15 px-2 py-2 text-[13px] text-left last:border-b-0",
        active && "bg-foreground/5",
        interactive &&
          "cursor-pointer transition-colors duration-150 hover:bg-emerald-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
        active &&
          "before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[2px] before:rounded-full before:bg-foreground before:content-['']"
      )}
    >
      <p className={cn("text-muted-foreground", active && "text-foreground")}>{label}</p>
      <div className="flex items-center gap-2">
        {active ? (
          <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/75">
            Aktywne
          </span>
        ) : null}
        <p className="text-right font-mono text-[13px] font-semibold tabular-nums">{value}</p>
      </div>
    </Tag>
  );
}
export function StockValuationContextCard({
  summary,
  valuationContexts,
}: Readonly<{
  summary: StockValuationSummary;
  valuationContexts: Readonly<Record<ValuationMetricKey, StockValuationRangeContext>>;
}>) {
  const [activeMetric, setActiveMetric] = useState<ValuationMetricKey>("peTtm");
  const activeConfig =
    VALUATION_METRICS.find((metric) => metric.key === activeMetric) ?? VALUATION_METRICS[0];
  const activeContext = valuationContexts[activeMetric];
  const currentValue = getSummaryMetricValue(summary, activeMetric);
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Aktualny odczyt na tle ostatnich 5 lat.
        </p>
        <ToggleGroup
          type="single"
          value={activeMetric}
          onValueChange={(value) => {
            if (value === "peTtm" || value === "priceToSales" || value === "priceToBook") {
              setActiveMetric(value);
            }
          }}
          className="rounded-sm border border-black/10 bg-background/65 p-1"
        >
          {VALUATION_METRICS.map((metric) => (
            <ToggleGroupItem
              key={metric.key}
              value={metric.key}
              variant="ledger"
              className="h-8 min-w-14 px-3 text-[12px]"
            >
              {metric.switchLabel}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <article className="space-y-4 border-b border-dashed border-black/15 pb-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{activeConfig.title}</h3>
            {activeConfig.recommended ? (
              <Badge className="border-emerald-700/15 bg-emerald-700/10 text-emerald-900">
                {/* TODO: Replace this hardcoded badge with sector-aware LLM guidance once we have reliable company classification and rule confidence. */}
                Rekomendowane
              </Badge>
            ) : null}
            <InfoHint
              text={activeConfig.tooltip}
              ariaLabel={`Dlaczego ${activeConfig.switchLabel} ma sens`}
              className="size-4 border-black/10 bg-white"
            />
          </div>
          <div className="space-y-1 text-sm leading-relaxed text-foreground/90">
            <p>
              <span className="font-semibold text-foreground">Najlepsze dla:</span>{" "}
              {activeConfig.bestFor}
            </p>
            <p>
              <span className="font-semibold text-foreground">{activeConfig.cautionLabel}:</span>{" "}
              {activeConfig.caution}
            </p>
          </div>
        </div>
        {activeContext.pointsCount > 0 ? (
          <StockValuationGauge context={activeContext} metric={activeMetric} />
        ) : (
          <MissingValuationHistoryPanel currentValue={currentValue} />
        )}
      </article>

      <div className="border-t border-dashed border-black/15 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Wszystkie mnozniki
        </p>
        <div className="mt-2">
          <MetricSummaryRow
            label="P/E (TTM)"
            value={formatRatio(summary.peTtm)}
            active={activeMetric === "peTtm"}
            interactive
            onClick={() => setActiveMetric("peTtm")}
          />
          <MetricSummaryRow
            label="Cena do sprzedazy (P/S)"
            value={formatRatio(summary.priceToSales)}
            active={activeMetric === "priceToSales"}
            interactive
            onClick={() => setActiveMetric("priceToSales")}
          />
          <MetricSummaryRow
            label="Cena do wartosci ksiegowej (P/B)"
            value={formatRatio(summary.priceToBook)}
            active={activeMetric === "priceToBook"}
            interactive
            onClick={() => setActiveMetric("priceToBook")}
          />
          <MetricSummaryRow label="EV do EBITDA" value={formatRatio(summary.evToEbitda)} />
        </div>
      </div>
    </div>
  );
}
