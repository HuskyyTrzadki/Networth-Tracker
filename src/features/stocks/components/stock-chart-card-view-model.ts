import type { StockChartResponse, StockTradeMarker } from "../server/types";

export type VisibleMarker = Readonly<{
  key: string;
  t: string;
  side: StockTradeMarker["side"];
  portfolioName: string;
  price: number;
}>;

const changeFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const toDateKey = (value: string) => value.slice(0, 10);

export const formatChangePercent = (value: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return changeFormatter.format(value / 100);
};

export const resolveVisibleTradeMarkers = (
  markers: readonly StockTradeMarker[],
  chartPoints: StockChartResponse["points"]
): readonly VisibleMarker[] => {
  if (markers.length === 0 || chartPoints.length === 0) {
    return [];
  }

  const chartTimeByDate = new Map<string, string>();
  for (const point of chartPoints) {
    const time = point.t;
    const key = toDateKey(time);
    chartTimeByDate.set(key, time);
  }

  return markers
    .map((marker) => {
      const t = chartTimeByDate.get(marker.tradeDate);
      if (!t) {
        return null;
      }

      return {
        key: marker.id,
        t,
        side: marker.side,
        portfolioName: marker.portfolioName,
        price: marker.price,
      } satisfies VisibleMarker;
    })
    .filter((marker): marker is VisibleMarker => marker !== null);
};
