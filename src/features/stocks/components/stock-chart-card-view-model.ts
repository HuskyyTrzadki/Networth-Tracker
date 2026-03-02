import type { StockTradeMarker } from "../server/types";

export type VisibleTradeMarker = Readonly<{
  kind: "tradeMarker";
  id: string;
  t: string;
  tradeDate: string;
  side: StockTradeMarker["side"];
  netQuantity: number;
  weightedPrice: number;
  grossNotional: number;
  buyQuantity: number;
  sellQuantity: number;
  buyNotional: number;
  sellNotional: number;
  tradeCount: number;
}>;

const changeFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const toDateKey = (value: string) => value.slice(0, 10);
const MAX_TRADE_DATE_SNAP_DISTANCE_MS = 3 * 24 * 60 * 60 * 1000;

const toUtcStartOfDay = (value: string) => Date.parse(`${value}T00:00:00.000Z`);

const resolveTradeMarkerTimestamp = (
  tradeDate: string,
  chartDates: readonly Readonly<{ date: string; time: string; ts: number }>[],
  chartTimeByDate: ReadonlyMap<string, string>
) => {
  const exactMatch = chartTimeByDate.get(tradeDate);
  if (exactMatch) {
    return exactMatch;
  }

  const tradeTs = toUtcStartOfDay(tradeDate);
  if (!Number.isFinite(tradeTs)) {
    return null;
  }

  let bestMatch:
    | Readonly<{
        time: string;
        distanceMs: number;
        directionPenalty: number;
      }>
    | null = null;

  for (const chartDate of chartDates) {
    const distanceMs = Math.abs(chartDate.ts - tradeTs);
    if (distanceMs > MAX_TRADE_DATE_SNAP_DISTANCE_MS) {
      continue;
    }

    const directionPenalty = chartDate.ts < tradeTs ? 1 : 0;
    if (
      bestMatch === null ||
      distanceMs < bestMatch.distanceMs ||
      (distanceMs === bestMatch.distanceMs &&
        directionPenalty < bestMatch.directionPenalty)
    ) {
      bestMatch = {
        time: chartDate.time,
        distanceMs,
        directionPenalty,
      };
    }
  }

  return bestMatch?.time ?? null;
};

export const formatChangePercent = (value: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return changeFormatter.format(value / 100);
};

export const resolveVisibleTradeMarkers = (
  markers: readonly StockTradeMarker[],
  chartPoints: readonly Readonly<{ t: string }>[]
): readonly VisibleTradeMarker[] => {
  if (markers.length === 0 || chartPoints.length === 0) {
    return [];
  }

  const chartTimeByDate = new Map<string, string>();
  const chartDates = chartPoints
    .map((point) => ({
      date: toDateKey(point.t),
      time: point.t,
      ts: toUtcStartOfDay(toDateKey(point.t)),
    }))
    .filter((point) => Number.isFinite(point.ts));

  for (const point of chartPoints) {
    chartTimeByDate.set(toDateKey(point.t), point.t);
  }

  const mappedMarkers = markers
    .map((marker) => {
      const t = resolveTradeMarkerTimestamp(
        marker.tradeDate,
        chartDates,
        chartTimeByDate
      );
      if (!t) {
        return null;
      }

      return {
        kind: "tradeMarker",
        id: marker.id,
        t,
        tradeDate: marker.tradeDate,
        side: marker.side,
        netQuantity: marker.netQuantity,
        weightedPrice: marker.weightedPrice,
        grossNotional: marker.grossNotional,
        buyQuantity: marker.buyQuantity,
        sellQuantity: marker.sellQuantity,
        buyNotional: marker.buyNotional,
        sellNotional: marker.sellNotional,
        tradeCount: marker.tradeCount,
      } satisfies VisibleTradeMarker;
    })
    .filter((marker): marker is VisibleTradeMarker => marker !== null);

  return mappedMarkers;
};
