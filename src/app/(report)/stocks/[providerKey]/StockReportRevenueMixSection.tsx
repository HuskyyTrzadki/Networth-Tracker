"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

import { Button } from "@/features/design-system/components/ui/button";

import { StockReportRevenueSankeyCard } from "./StockReportRevenueSankeyCard";
import {
  QUARTER_LABELS,
  getQuarterCell,
  parseCompactMoney,
  toPercentSlices,
  type MixMode,
  type QuarterKey,
} from "./stock-report-revenue-mix-helpers";
import {
  HOW_THEY_MAKE_MONEY,
  REVENUE_BY_GEO,
  REVENUE_BY_PRODUCTS,
  type HowTheyMakeMoneyMode,
} from "./stock-report-static-data";

const ProfitabilitySnapshot = dynamic(
  () =>
    import("./stock-report-revenue-mix-cards").then(
      (module) => module.ProfitabilitySnapshot
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[420px] w-full animate-pulse rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/35"
        aria-hidden="true"
      />
    ),
  }
);

const DonutCard = dynamic(
  () =>
    import("./stock-report-revenue-mix-cards").then(
      (module) => module.DonutCard
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[360px] w-full animate-pulse rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/35"
        aria-hidden="true"
      />
    ),
  }
);

const GEO_COLOR_BY_ICON: Readonly<Record<string, string>> = {
  NA: "#4f5f75",
  EU: "#6c785e",
  APAC: "#7d6b5c",
  ROW: "#756a7f",
};

const COST_LABEL_BY_KEY: Readonly<Record<string, string>> = {
  COGS: "Koszt sprzedanych produktow i uslug",
  OPEX: "Koszty operacyjne (R&D + SG&A)",
  Podatki: "Podatki",
};

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

export default function StockReportRevenueMixSection() {
  const [mode, setMode] = useState<MixMode>("now");
  const [quarter, setQuarter] = useState<QuarterKey>("q4");
  const [profitMode, setProfitMode] = useState<HowTheyMakeMoneyMode>("lastQuarter");
  const [mixVisual, setMixVisual] = useState<"sankey" | "donut">("sankey");

  const productEntries = REVENUE_BY_PRODUCTS.map((row) => {
    const cell = mode === "annual" ? null : getQuarterCell(row, mode === "now" ? "q4" : quarter);
    const quarterlyValue = cell ? parseCompactMoney(cell.value) : null;
    const annual =
      (parseCompactMoney(row.q1.value) ?? 0) +
      (parseCompactMoney(row.q2.value) ?? 0) +
      (parseCompactMoney(row.q3.value) ?? 0) +
      (parseCompactMoney(row.q4.value) ?? 0);

    return {
      id: row.iconLabel,
      label: row.name,
      value: mode === "annual" ? annual : quarterlyValue ?? 0,
      color: row.iconLabel === "FOA" ? "#4f5f75" : "#826447",
      help:
        row.iconLabel === "FOA"
          ? "Glowna linia przychodow (core produkty)."
          : "Segment poboczny/eksperymentalny; czesto o nizszej skali, ale wysokiej intensywnosci inwestycji.",
    };
  });

  const productsSlices = toPercentSlices(productEntries);

  const geoEntries = REVENUE_BY_GEO.map((row) => {
    const cell = mode === "annual" ? null : getQuarterCell(row, mode === "now" ? "q4" : quarter);
    const quarterlyValue = cell ? parseCompactMoney(cell.value) : null;
    const annual =
      (parseCompactMoney(row.q1.value) ?? 0) +
      (parseCompactMoney(row.q2.value) ?? 0) +
      (parseCompactMoney(row.q3.value) ?? 0) +
      (parseCompactMoney(row.q4.value) ?? 0);

    return {
      id: row.iconLabel,
      label: row.name,
      value: mode === "annual" ? annual : quarterlyValue ?? 0,
      color: GEO_COLOR_BY_ICON[row.iconLabel] ?? "#6f6a63",
      help: "Przychody raportowane w podziale geograficznym; nie zawsze pokrywaja sie 1:1 z miejscem klienta (zalezy od polityki raportowania).",
    };
  });

  const geoSlices = toPercentSlices(geoEntries);

  const periodLabel =
    mode === "annual"
      ? "Suma Q1-Q4 2025"
      : mode === "now"
        ? QUARTER_LABELS.q4
        : QUARTER_LABELS[quarter];
  const profitability = HOW_THEY_MAKE_MONEY[profitMode];
  const profitabilityTotal = profitability.slices.reduce(
    (sum, slice) => sum + slice.valuePercent,
    0
  );
  const normalizedProfitability = profitability.slices.map((slice) => ({
    ...slice,
    valuePercent:
      profitabilityTotal > 0
        ? (slice.valuePercent / profitabilityTotal) * 100
        : 0,
  }));
  const netSlice = normalizedProfitability.find((slice) => slice.key === "Zysk");
  const cogsSlice = normalizedProfitability.find((slice) => slice.key === "COGS");
  const rdSlice = normalizedProfitability.find((slice) => slice.key === "R&D");
  const sgaSlice = normalizedProfitability.find((slice) => slice.key === "SG&A");
  const taxSlice = normalizedProfitability.find((slice) => slice.key === "Podatki");
  const opexPercent = (rdSlice?.valuePercent ?? 0) + (sgaSlice?.valuePercent ?? 0);
  const opexIntensity =
    opexPercent >= 30 ? "wysoki" : opexPercent >= 18 ? "umiarkowany" : "nizszy";

  const costSlices = [
    {
      id: "COGS",
      label: COST_LABEL_BY_KEY.COGS,
      valuePercent: cogsSlice?.valuePercent ?? 0,
      description:
        cogsSlice?.help ??
        "Pierwszy odsiew kosztowy: koszt wytworzenia i dostarczenia produktu/uslugi.",
    },
    {
      id: "OPEX",
      label: COST_LABEL_BY_KEY.OPEX,
      valuePercent: opexPercent,
      description: `R&D: ${percentFormatter.format(rdSlice?.valuePercent ?? 0)}% • SG&A: ${percentFormatter.format(sgaSlice?.valuePercent ?? 0)}%. To wydatki na wzrost (produkty, AI, sprzedaz i administracje). Aktualny poziom OPEX jest ${opexIntensity}.`,
    },
    {
      id: "Podatki",
      label: COST_LABEL_BY_KEY.Podatki,
      valuePercent: taxSlice?.valuePercent ?? 0,
      description: taxSlice?.help ?? "Obciazenia podatkowe od wyniku finansowego spolki.",
    },
  ].filter((slice) => slice.valuePercent > 0);
  const sankeySegments = productsSlices.map((slice) => ({
    id: slice.key,
    label: slice.label,
    valuePercent: slice.value,
    color: productEntries.find((entry) => entry.label === slice.label)?.color ?? "#646464",
    description:
      productEntries.find((entry) => entry.label === slice.label)?.help ??
      "Udzial segmentu w calosci przychodow.",
  }));
  const netMarginPercent = netSlice?.valuePercent ?? 0;

  return (
    <TooltipProvider>
      <section className="space-y-3 border-b border-dashed border-[color:var(--report-rule)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold tracking-tight">Jak firma zarabia</h3>
            <p className="mt-1 text-sm text-muted-foreground">Najpierw wynik i marze, potem mix przychodow.</p>
          </div>
        </div>

        <ProfitabilitySnapshot mode={profitMode} onModeChange={setProfitMode} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-semibold tracking-tight">
              Mix przychodow ({mixVisual === "sankey" ? "diagram przeplywu" : "wykresy kolowe"})
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Widok: <span className="font-mono">{periodLabel}</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 rounded-sm px-3 text-[11px]"
              variant={mixVisual === "sankey" ? "default" : "outline"}
              onClick={() => setMixVisual("sankey")}
            >
              Sankey
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-sm px-3 text-[11px]"
              variant={mixVisual === "donut" ? "default" : "outline"}
              onClick={() => setMixVisual("donut")}
            >
              Kołowe
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-sm px-3 text-[11px]"
              variant={mode === "now" ? "default" : "outline"}
              onClick={() => setMode("now")}
            >
              Teraz
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-sm px-3 text-[11px]"
              variant={mode === "quarterly" ? "default" : "outline"}
              onClick={() => setMode("quarterly")}
            >
              Kwartalnie
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-sm px-3 text-[11px]"
              variant={mode === "annual" ? "default" : "outline"}
              onClick={() => setMode("annual")}
            >
              Rocznie
            </Button>
          </div>
        </div>

        {mode === "quarterly" ? (
          <div className="flex flex-wrap items-center gap-2">
            {(["q1", "q2", "q3", "q4"] as const).map((nextQuarter) => (
              <Button
                key={nextQuarter}
                size="sm"
                className="h-7 rounded-sm px-2.5 text-[11px] font-mono"
                variant={quarter === nextQuarter ? "default" : "outline"}
                onClick={() => setQuarter(nextQuarter)}
              >
                {QUARTER_LABELS[nextQuarter]}
              </Button>
            ))}
          </div>
        ) : null}

        {mixVisual === "sankey" ? (
          <div className="space-y-3">
            <StockReportRevenueSankeyCard
              revenueSegments={sankeySegments}
              costSlices={costSlices}
              netMarginPercent={netMarginPercent}
              netProfitDescription={netSlice?.help}
            />
            <DonutCard
              title="Geografia przychodow"
              subtitle={`Osobny widok geograficzny (${periodLabel})`}
              slices={geoSlices}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <DonutCard
              title="Przychody wedlug produktow"
              subtitle="Udzial segmentow w przychodach"
              slices={productsSlices}
            />
            <DonutCard
              title="Przychody wedlug regionu"
              subtitle="Udzial regionow w przychodach"
              slices={geoSlices}
            />
          </div>
        )}
      </section>
    </TooltipProvider>
  );
}
