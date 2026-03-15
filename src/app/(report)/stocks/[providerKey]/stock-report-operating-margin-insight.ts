import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildMarginInsightWidget } from "./stock-report-margin-insight";

export function buildOperatingMarginInsightWidget(input: Readonly<{
  quarterlyRevenueEvents: readonly FundamentalSeriesEvent[];
  quarterlyOperatingIncomeEvents: readonly FundamentalSeriesEvent[];
  annualRevenueEvents: readonly FundamentalSeriesEvent[];
  annualOperatingIncomeEvents: readonly FundamentalSeriesEvent[];
}>) {
  return buildMarginInsightWidget(
    {
      id: "operating-margin",
      title: "Marza operacyjna",
      subtitle: "Zysk operacyjny jako procent przychodow",
      seriesLabel: "Marza operacyjna",
      color: "#4c78c2",
      emptyState: "Brak historii marzy operacyjnej dla tej spolki.",
    },
    {
      quarterlyRevenueEvents: input.quarterlyRevenueEvents,
      quarterlyNumeratorEvents: input.quarterlyOperatingIncomeEvents,
      annualRevenueEvents: input.annualRevenueEvents,
      annualNumeratorEvents: input.annualOperatingIncomeEvents,
    }
  );
}
