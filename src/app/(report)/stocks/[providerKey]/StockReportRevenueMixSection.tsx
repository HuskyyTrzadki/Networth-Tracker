"use client";

import dynamic from "next/dynamic";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ReportCard, SectionHeader } from "./ReportPrimitives";
import type { RevenueBreakdownCardViewModel } from "./stock-report-revenue-breakdown-view-model";
import {
  PROFIT_CONVERSION_EMPTY_STATE,
  type ProfitConversionViewModel,
} from "./stock-report-profit-conversion";

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

type Props = Readonly<{
  geoViewModel: RevenueBreakdownCardViewModel;
  sourceViewModel: RevenueBreakdownCardViewModel;
  profitConversionViewModel: ProfitConversionViewModel | null;
}>;

export default function StockReportRevenueMixSection({
  geoViewModel,
  sourceViewModel,
  profitConversionViewModel,
}: Props) {
  const sourceSlices = sourceViewModel.nowSlices;
  const geoSlices = geoViewModel.nowSlices;
  const sourceEmptyState = sourceViewModel.nowEmptyState;
  const geoEmptyState = geoViewModel.nowEmptyState;
  const sankeySegments = sourceSlices.map((slice) => ({
    id: slice.key,
    label: slice.label,
    valuePercent: slice.value,
    color: slice.color,
    description: slice.help,
  }));
  const sankeyEmptyState =
    sourceSlices.length === 0
      ? sourceEmptyState
      : profitConversionViewModel
        ? sourceEmptyState
        : PROFIT_CONVERSION_EMPTY_STATE;

  return (
    <TooltipProvider>
      <section className="space-y-3 border-b border-dashed border-black/15 pb-6">
        <SectionHeader as="h3" title="Jak firma zarabia" />

        <ProfitabilitySnapshot viewModel={profitConversionViewModel} />

        <ReportCard contentClassName="space-y-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-base font-semibold tracking-tight">Mix przychodow</h4>
              <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                TradingView: ostatni dostepny okres
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <StockReportRevenueSankeyCard
              revenueSegments={sankeySegments}
              costSlices={profitConversionViewModel?.sankeyCostSlices ?? []}
              netMarginPercent={profitConversionViewModel?.netMarginPercent ?? 0}
              netProfitDescription={profitConversionViewModel?.netProfitDescription}
              emptyState={sankeyEmptyState}
            />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <DonutCard
                title={sourceViewModel.title}
                slices={sourceSlices}
                emptyState={sourceEmptyState}
              />
              <DonutCard
                title={geoViewModel.title}
                slices={geoSlices}
                emptyState={geoEmptyState}
              />
            </div>
          </div>
        </ReportCard>
      </section>
    </TooltipProvider>
  );
}
