import {
  STOCK_CHART_OVERLAYS,
  STOCK_CHART_RANGES,
  type StockChartOverlay,
  type StockChartRange,
} from "./types";

const isChartRange = (value: string): value is StockChartRange =>
  STOCK_CHART_RANGES.includes(value as StockChartRange);

const isOverlay = (value: string): value is StockChartOverlay =>
  STOCK_CHART_OVERLAYS.includes(value as StockChartOverlay);

const parseOverlayList = (value: string | null): readonly StockChartOverlay[] => {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
    )
  ).filter(isOverlay);
};

const hasUnknownOverlay = (value: string | null) => {
  if (!value) return false;
  const parsed = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parsed.some((part) => !isOverlay(part));
};

export function parseStockChartQuery(searchParams: URLSearchParams):
  | Readonly<{
      ok: true;
      range: StockChartRange;
      overlays: readonly StockChartOverlay[];
    }>
  | Readonly<{ ok: false; message: string }> {
  const rangeRaw = searchParams.get("range")?.toUpperCase() ?? "1M";
  if (!isChartRange(rangeRaw)) {
    return { ok: false, message: "Invalid chart range." };
  }

  const overlaysRaw = searchParams.get("overlays");
  if (hasUnknownOverlay(overlaysRaw)) {
    return { ok: false, message: "Invalid chart overlays." };
  }

  const includePe = searchParams.get("includePe") === "1";
  const parsedOverlays = parseOverlayList(overlaysRaw);
  const overlays = includePe
    ? Array.from(new Set<StockChartOverlay>([...parsedOverlays, "pe"]))
    : parsedOverlays;

  return {
    ok: true,
    range: rangeRaw,
    overlays,
  };
}
