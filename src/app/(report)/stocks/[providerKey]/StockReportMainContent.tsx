import { Suspense } from "react";

import InsightsWidgetsSectionSlot from "./InsightsWidgetsSectionSlot";
import RenderOnVisible from "./RenderOnVisible";
import StockChartSection from "./StockChartSection";
import StockMetricsSection from "./StockMetricsSection";
import StockReportRevenueMixSectionSlot from "./StockReportRevenueMixSectionSlot";
import {
  BalanceSnapshotSection,
  StockReportAdvancedSection,
  SummaryStartSection,
} from "./StockReportSupplementarySections";

type MainContentProps = Readonly<{
  providerKey: string;
  metricCurrency: string;
}>;

function StockMetricsSectionSkeleton() {
  return (
    <div
      className="h-[380px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
      aria-hidden="true"
    />
  );
}

export default function StockReportMainContent({
  providerKey,
  metricCurrency,
}: MainContentProps) {
  return (
    <section className="flex min-w-0 w-full max-w-screen-xl flex-1 flex-col gap-6 lg:pl-4 lg:pt-4">
      <SummaryStartSection />

      <section id="sekcja-wykres" className="border-b border-dashed border-black/15 pb-6">
        <Suspense
          fallback={
            <div className="h-[460px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]" />
          }
        >
          <StockChartSection providerKey={providerKey} />
        </Suspense>
      </section>

      <section
        id="sekcja-fundamenty"
        className="border-b border-dashed border-black/15 pb-6"
      >
        <RenderOnVisible rootMargin="220px 0px" fallback={<StockMetricsSectionSkeleton />}>
          <Suspense fallback={<StockMetricsSectionSkeleton />}>
            <StockMetricsSection providerKey={providerKey} metricCurrency={metricCurrency} />
          </Suspense>
        </RenderOnVisible>
      </section>

      <section id="sekcja-jak-zarabia">
        <StockReportRevenueMixSectionSlot providerKey={providerKey} />
      </section>

      <BalanceSnapshotSection />

      <section id="sekcja-trendy">
        <InsightsWidgetsSectionSlot providerKey={providerKey} />
      </section>

      <StockReportAdvancedSection />
    </section>
  );
}
