import type { StockChartMode } from "./stock-chart-card-helpers";
import type {
  StockChartOverlay,
  StockChartRange,
  StockChartResponse,
  StockTradeMarker,
} from "../server/types";

export type VisibleLegendItem = Readonly<{
  key: string;
  label: string;
  color: string;
  variant?: "solid" | "ring";
}>;

export type StockChartNotice = Readonly<{
  tone: "warning" | "muted";
  text: string;
}>;

type ResolveChartStateParams = Readonly<{
  fetchedChart: StockChartResponse | null;
  initialChart: StockChartResponse;
  isLoading: boolean;
  isInitialState: boolean;
}>;

export const resolveStockChartResourceState = ({
  fetchedChart,
  initialChart,
  isLoading,
  isInitialState,
}: ResolveChartStateParams) => {
  const lastKnownChart = fetchedChart ?? initialChart;
  const shouldHideInitialFallback = isLoading && fetchedChart === null && !isInitialState;

  return {
    chart: shouldHideInitialFallback ? null : lastKnownChart,
    lastKnownChart,
  } as const;
};

export const resolveStockTradeMarkers = (
  fetchedTradeMarkers: readonly StockTradeMarker[] | null,
  initialTradeMarkers: readonly StockTradeMarker[]
): readonly StockTradeMarker[] => {
  if (fetchedTradeMarkers === null) {
    return initialTradeMarkers;
  }

  if (fetchedTradeMarkers.length === 0 && initialTradeMarkers.length > 0) {
    return initialTradeMarkers;
  }

  return fetchedTradeMarkers;
};

export const isStockChartTenYearUnavailable = (
  chart: Pick<StockChartResponse, "requestedRange" | "resolvedRange">
) => chart.requestedRange === "10Y" && chart.resolvedRange !== "10Y";

const EVENT_ELIGIBLE_RANGES: readonly StockChartRange[] = ["3Y", "5Y", "10Y", "ALL"];

export const isStockChartEventRangeEligible = (range: StockChartRange) =>
  EVENT_ELIGIBLE_RANGES.includes(range);

const resolveFallbackNotice = (
  requestedRange: StockChartRange,
  resolvedRange: StockChartRange
) => {
  if (requestedRange === "1D" && resolvedRange !== "1D") {
    return "Brak danych intraday, wiec pokazujemy 1M.";
  }

  if (requestedRange === "10Y" && resolvedRange !== "10Y") {
    return "Brak pelnych 10 lat, wiec pokazujemy caly dostepny zakres.";
  }

  return null;
};

type BuildChartNoticeParams = Readonly<{
  coverageWarnings: readonly string[];
  mode: StockChartMode;
  requestedRange: StockChartRange;
  resolvedRange: StockChartRange;
}>;

export const buildStockChartNotice = ({
  coverageWarnings,
  mode,
  requestedRange,
  resolvedRange,
}: BuildChartNoticeParams): StockChartNotice | null => {
  if (coverageWarnings.length > 0) {
    return {
      tone: "warning",
      text: `Niepelne dane: ${coverageWarnings.join(" · ")}`,
    };
  }

  if (mode === "raw") {
    return {
      tone: "muted",
      text: "W trybie surowym pokazujemy jedna nakladke naraz.",
    };
  }

  const fallbackNotice = resolveFallbackNotice(requestedRange, resolvedRange);
  if (!fallbackNotice) {
    return null;
  }

  return {
    tone: "muted",
    text: fallbackNotice,
  };
};

export const buildVisibleLegendItems = ({
  baseLegendItems,
  showTradeMarkers,
  hasTradeMarkers,
  showCompanyEvents,
  showGlobalEvents,
  hasVisibleEvents,
}: Readonly<{
  baseLegendItems: readonly VisibleLegendItem[];
  showTradeMarkers: boolean;
  hasTradeMarkers: boolean;
  showCompanyEvents: boolean;
  showGlobalEvents: boolean;
  hasVisibleEvents: boolean;
}>) => {
  const items = [...baseLegendItems];

  if (showTradeMarkers && hasTradeMarkers) {
    items.push({
      key: "trade-markers",
      label: "Twoje transakcje",
      color: "var(--profit)",
      variant: "ring",
    });
  }

  if (hasVisibleEvents && showCompanyEvents) {
    items.push({
      key: "company-events",
      label: "Wydarzenia spolki",
      color: "#d97706",
    });
  }

  if (hasVisibleEvents && showGlobalEvents) {
    items.push({
      key: "global-events",
      label: "Wydarzenia globalne",
      color: "#0f766e",
    });
  }

  return items;
};

export const resolveInitialFundamentalSelection = (
  activeOverlays: readonly StockChartOverlay[]
): StockChartOverlay[] => {
  if (activeOverlays.length > 0) {
    return [...activeOverlays];
  }

  return ["pe"];
};
