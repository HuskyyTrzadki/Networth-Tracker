import type { InstrumentRevenueSourceBreakdown } from "@/features/market-data/server/get-instrument-revenue-source-breakdown";

import { toPercentSlices } from "./stock-report-revenue-mix-helpers";
import type { RevenueBreakdownCardViewModel } from "./stock-report-revenue-breakdown-view-model";

const SOURCE_COLORS = ["#4f5f75", "#826447", "#6c785e", "#7d6b5c", "#756a7f", "#50746d"] as const;
const SOURCE_HELP =
  "TradingView raportuje przychody wedlug zrodel lub segmentow z ostatniego dostepnego okresu; nie zawsze sa to doslowne produkty ani identyczne kategorie jak w raporcie spolki.";
const MAX_VISIBLE_SOURCES = 5;

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

const groupEntries = (entries: NonNullable<InstrumentRevenueSourceBreakdown>["entries"]) => {
  const visibleEntries = entries.slice(0, MAX_VISIBLE_SOURCES);
  const hiddenEntries = entries.slice(MAX_VISIBLE_SOURCES);
  const hiddenTotal = hiddenEntries.reduce((sum, entry) => sum + entry.latestValue, 0);

  return hiddenTotal > 0
    ? [...visibleEntries, { label: "Pozostale", latestValue: hiddenTotal }]
    : visibleEntries;
};

export function buildRevenueSourceCardViewModel(
  breakdown: InstrumentRevenueSourceBreakdown | null
): RevenueBreakdownCardViewModel {
  if (!breakdown) {
    return {
      title: "Przychody wedlug segmentow",
      nowSubtitle: "TradingView · ostatni dostepny okres",
      note: SOURCE_HELP,
      nowSlices: [],
      nowEmptyState: "Dane o segmentach przychodow sa w trakcie opracowywania.",
      historyEmptyState:
        "Historyczny podzial segmentow nie jest jeszcze zapisany w cache; pokazujemy tylko ostatni dostepny okres.",
    };
  }

  const groupedEntries = groupEntries(breakdown.entries);
  const subtitleDate = formatFetchedAt(breakdown.fetchedAt);

  return {
    title: "Przychody wedlug segmentow",
    nowSubtitle: subtitleDate
      ? `TradingView · stan na ${subtitleDate}`
      : "TradingView · ostatni dostepny okres",
    note: SOURCE_HELP,
    nowSlices: toPercentSlices(
      groupedEntries.map((entry, index) => ({
        label: entry.label,
        value: entry.latestValue,
        color: SOURCE_COLORS[index % SOURCE_COLORS.length] ?? SOURCE_COLORS[0],
        help: SOURCE_HELP,
      }))
    ),
    nowEmptyState: "Brak segmentowego podzialu przychodow dla tej spolki.",
    historyEmptyState:
      "Historyczny podzial segmentow nie jest jeszcze zapisany w cache; pokazujemy tylko ostatni dostepny okres.",
  };
}
