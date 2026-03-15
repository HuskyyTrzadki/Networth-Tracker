import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildMarginInsightWidget } from "./stock-report-margin-insight";

export function buildNetMarginInsightWidget(input: Readonly<{
  quarterlyRevenueEvents: readonly FundamentalSeriesEvent[];
  quarterlyNetIncomeEvents: readonly FundamentalSeriesEvent[];
  annualRevenueEvents: readonly FundamentalSeriesEvent[];
  annualNetIncomeEvents: readonly FundamentalSeriesEvent[];
}>) {
  return buildMarginInsightWidget(
    {
      id: "net-margin",
      title: "Marza netto",
      subtitle: "Zysk netto jako procent przychodow",
      seriesLabel: "Marza netto",
      color: "#7c6ab2",
      emptyState: "Brak historii marzy netto dla tej spolki.",
    },
    {
      quarterlyRevenueEvents: input.quarterlyRevenueEvents,
      quarterlyNumeratorEvents: input.quarterlyNetIncomeEvents,
      annualRevenueEvents: input.annualRevenueEvents,
      annualNumeratorEvents: input.annualNetIncomeEvents,
    }
  );
}
