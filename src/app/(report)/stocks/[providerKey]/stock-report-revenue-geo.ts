import type { InstrumentRevenueGeoBreakdown } from "@/features/market-data/server/get-instrument-revenue-geo-breakdown";

import { toPercentSlices } from "./stock-report-revenue-mix-helpers";
import type { RevenueBreakdownCardViewModel } from "./stock-report-revenue-breakdown-view-model";

const GEO_COLORS = ["#4f5f75", "#6c785e", "#826447", "#7d6b5c", "#756a7f", "#50746d"] as const;
const GEO_HELP =
  "TradingView raportuje geografie wedlug krajow lub regionow z ostatniego dostepnego okresu; to nie zawsze pokrywa sie 1:1 z miejscem klienta ani z dawnym ukladem regionow.";
const MAX_VISIBLE_COUNTRIES = 5;

const formatFetchedAt = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const groupEntries = (entries: NonNullable<InstrumentRevenueGeoBreakdown>["entries"]) => {
  const visibleEntries = entries.slice(0, MAX_VISIBLE_COUNTRIES);
  const hiddenEntries = entries.slice(MAX_VISIBLE_COUNTRIES);
  const hiddenTotal = hiddenEntries.reduce((sum, entry) => sum + entry.latestValue, 0);

  return hiddenTotal > 0
    ? [...visibleEntries, { label: "Pozostale", latestValue: hiddenTotal }]
    : visibleEntries;
};

export function buildRevenueGeoCardViewModel(
  breakdown: InstrumentRevenueGeoBreakdown | null
): RevenueBreakdownCardViewModel {
  if (!breakdown) {
    return {
      title: "Przychody wedlug regionu",
      nowSubtitle: "TradingView · ostatni dostepny okres",
      note: GEO_HELP,
      nowSlices: [],
      nowEmptyState: "Dane geograficzne w trakcie opracowywania.",
      historyEmptyState:
        "Historyczny podzial geograficzny nie jest jeszcze zapisany w cache; pokazujemy tylko ostatni dostepny okres.",
    };
  }

  const groupedEntries = groupEntries(breakdown.entries);
  const subtitleDate = formatFetchedAt(breakdown.fetchedAt);

  return {
    title: "Przychody wedlug regionu",
    nowSubtitle: subtitleDate
      ? `TradingView · stan na ${subtitleDate}`
      : "TradingView · ostatni dostepny okres",
    note: GEO_HELP,
    nowSlices: toPercentSlices(
      groupedEntries.map((entry, index) => ({
        label: entry.label,
        value: entry.latestValue,
        color: GEO_COLORS[index % GEO_COLORS.length] ?? GEO_COLORS[0],
        help: GEO_HELP,
      }))
    ),
    nowEmptyState: "Brak geograficznego podzialu przychodow dla tej spolki.",
    historyEmptyState:
      "Historyczny podzial geograficzny nie jest jeszcze zapisany w cache; pokazujemy tylko ostatni dostepny okres.",
  };
}
