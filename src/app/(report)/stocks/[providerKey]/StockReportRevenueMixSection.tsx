"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

import { Button } from "@/features/design-system/components/ui/button";

import { InvestorTakeaway, ReportCard, SectionHeader } from "./ReportPrimitives";
import type { RevenueBreakdownCardViewModel } from "./stock-report-revenue-breakdown-view-model";
import {
  QUARTER_LABELS,
  type MixMode,
  type QuarterKey,
} from "./stock-report-revenue-mix-helpers";
import {
  HOW_THEY_MAKE_MONEY,
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
        className="h-[420px] w-full animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
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
        className="h-[360px] w-full animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
        aria-hidden="true"
      />
    ),
  }
);

const StockReportRevenueSankeyCard = dynamic(
  () =>
    import("./StockReportRevenueSankeyCard").then(
      (module) => module.StockReportRevenueSankeyCard
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[336px] w-full animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
        aria-hidden="true"
      />
    ),
  }
);

const COST_LABEL_BY_KEY: Readonly<Record<string, string>> = {
  COGS: "Koszt sprzedanych produktow i uslug",
  OPEX: "Koszty operacyjne (R&D + SG&A)",
  Podatki: "Podatki",
};

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

type Props = Readonly<{
  geoViewModel: RevenueBreakdownCardViewModel;
  sourceViewModel: RevenueBreakdownCardViewModel;
}>;

export default function StockReportRevenueMixSection({
  geoViewModel,
  sourceViewModel,
}: Props) {
  const [mode, setMode] = useState<MixMode>("now");
  const [quarter, setQuarter] = useState<QuarterKey>("q4");
  const [profitMode, setProfitMode] = useState<HowTheyMakeMoneyMode>("lastQuarter");
  const sourceSlices = mode === "now" ? sourceViewModel.nowSlices : [];
  const geoSlices = mode === "now" ? geoViewModel.nowSlices : [];
  const sourceSubtitle =
    mode === "now"
      ? sourceViewModel.nowSubtitle
      : "Historyczny podzial segmentow jeszcze niedostepny";
  const geoSubtitle =
    mode === "now"
      ? geoViewModel.nowSubtitle
      : "Historyczny podzial geograficzny jeszcze niedostepny";
  const sourceEmptyState =
    mode === "now"
      ? sourceViewModel.nowEmptyState
      : sourceViewModel.historyEmptyState;
  const geoEmptyState =
    mode === "now"
      ? geoViewModel.nowEmptyState
      : geoViewModel.historyEmptyState;

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
  const sankeySegments = sourceSlices.map((slice) => ({
    id: slice.key,
    label: slice.label,
    valuePercent: slice.value,
    color: slice.color,
    description: slice.help,
  }));
  const netMarginPercent = netSlice?.valuePercent ?? 0;

  return (
    <TooltipProvider>
      <section className="space-y-3 border-b border-dashed border-black/15 pb-6">
        <SectionHeader
          as="h3"
          title="Jak firma zarabia"
          description="Marze i mix przychodow w jednej, spokojniejszej sekcji."
        />

        <ProfitabilitySnapshot mode={profitMode} onModeChange={setProfitMode} />

        <ReportCard contentClassName="space-y-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-base font-semibold tracking-tight">Mix przychodow</h4>
              <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                {periodLabel}
              </p>
            </div>

            <div className="inline-flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 rounded-none px-3 text-[11px]"
                variant={mode === "now" ? "default" : "outline"}
                onClick={() => setMode("now")}
              >
                Teraz
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-none px-3 text-[11px]"
                variant={mode === "quarterly" ? "default" : "outline"}
                onClick={() => setMode("quarterly")}
              >
                Kwartalnie
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-none px-3 text-[11px]"
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
                  className="h-7 rounded-none px-2.5 text-[11px] font-mono"
                  variant={quarter === nextQuarter ? "default" : "outline"}
                  onClick={() => setQuarter(nextQuarter)}
                >
                  {QUARTER_LABELS[nextQuarter]}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            <StockReportRevenueSankeyCard
              revenueSegments={sankeySegments}
              costSlices={costSlices}
              netMarginPercent={netMarginPercent}
              netProfitDescription={netSlice?.help}
              emptyState={sourceEmptyState}
            />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <DonutCard
                title={sourceViewModel.title}
                subtitle={sourceSubtitle}
                note={sourceViewModel.note}
                slices={sourceSlices}
                emptyState={sourceEmptyState}
              />
              <DonutCard
                title={geoViewModel.title}
                subtitle={geoSubtitle}
                note={geoViewModel.note}
                slices={geoSlices}
                emptyState={geoEmptyState}
              />
            </div>
          </div>
          <InvestorTakeaway>
            Szukaj odpowiedzi na trzy pytania: skad bierze sie zysk, czy jeden segment nie
            dominuje za mocno i czy geografia przychodow daje dywersyfikacje.
          </InvestorTakeaway>
        </ReportCard>
      </section>
    </TooltipProvider>
  );
}
