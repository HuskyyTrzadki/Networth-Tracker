import type { VisibleTradeMarker } from "./stock-chart-card-view-model";

type ChartPointLike = Readonly<{
  t: string;
}>;

export type PositionedTradeMarker = VisibleTradeMarker &
  Readonly<{
    markerY: number;
    clusteredMarkerCount: number;
    tradeDateEnd: string | null;
    markerSizeScale: number;
  }>;

const DEFAULT_PLOT_WIDTH_PX = 960;
const TRADE_CLUSTER_GAP_PX = 28;
const TRADE_MARKER_BAND_OFFSET_RATIO = 0.038;
const MIN_MARKER_BAND_OFFSET_RATIO = 0.08;

const resolveMarkerSizeScale = (
  grossNotional: number,
  maxGrossNotional: number
) => {
  if (!Number.isFinite(grossNotional) || !Number.isFinite(maxGrossNotional)) {
    return 0.5;
  }

  const safeGrossNotional = Math.max(grossNotional, 0);
  const safeMaxGrossNotional = Math.max(maxGrossNotional, 0);
  if (safeMaxGrossNotional <= 0) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, Math.sqrt(safeGrossNotional / safeMaxGrossNotional)));
};

const buildClusteredTradeMarker = (
  members: readonly VisibleTradeMarker[]
): PositionedTradeMarker | null => {
  if (members.length === 0) {
    return null;
  }

  const sortedMembers = [...members].sort((left, right) => left.t.localeCompare(right.t));
  const buyQuantity = sortedMembers.reduce((sum, marker) => sum + marker.buyQuantity, 0);
  const sellQuantity = sortedMembers.reduce((sum, marker) => sum + marker.sellQuantity, 0);
  const buyNotional = sortedMembers.reduce((sum, marker) => sum + marker.buyNotional, 0);
  const sellNotional = sortedMembers.reduce((sum, marker) => sum + marker.sellNotional, 0);

  const signedNetQuantity = buyQuantity - sellQuantity;
  const side =
    signedNetQuantity > 0
      ? "BUY"
      : signedNetQuantity < 0
        ? "SELL"
        : buyNotional >= sellNotional
          ? "BUY"
          : "SELL";
  const dominantQuantity = side === "BUY" ? buyQuantity : sellQuantity;
  const grossNotional = side === "BUY" ? buyNotional : sellNotional;

  if (dominantQuantity <= 0 || !Number.isFinite(grossNotional)) {
    return null;
  }

  const weightedPrice = grossNotional / dominantQuantity;
  if (!Number.isFinite(weightedPrice)) {
    return null;
  }

  const representativeIndex = Math.floor((sortedMembers.length - 1) / 2);
  const representative = sortedMembers[representativeIndex] ?? sortedMembers[0];
  const firstMarker = sortedMembers[0];
  const lastMarker = sortedMembers.at(-1) ?? firstMarker;

  if (!representative || !firstMarker || !lastMarker) {
    return null;
  }

  return {
    kind: "tradeMarker",
    id:
      sortedMembers.length === 1
        ? representative.id
        : `trade-cluster:${firstMarker.tradeDate}:${lastMarker.tradeDate}:${side}`,
    t: representative.t,
    tradeDate: firstMarker.tradeDate,
    tradeDateEnd:
      sortedMembers.length > 1 && lastMarker.tradeDate !== firstMarker.tradeDate
        ? lastMarker.tradeDate
        : null,
    side,
    netQuantity: Math.abs(signedNetQuantity),
    weightedPrice,
    grossNotional,
    buyQuantity,
    sellQuantity,
    buyNotional,
    sellNotional,
    tradeCount: sortedMembers.reduce((sum, marker) => sum + marker.tradeCount, 0),
    markerSizeScale: 0.5,
    markerY: 0,
    clusteredMarkerCount: sortedMembers.length,
  };
};

export const buildPositionedTradeMarkers = ({
  markers,
  chartData,
  priceAxisDomain,
  plotWidth,
}: Readonly<{
  markers: readonly VisibleTradeMarker[];
  chartData: readonly ChartPointLike[];
  priceAxisDomain: [number, number] | undefined;
  plotWidth: number;
}>): readonly PositionedTradeMarker[] => {
  if (markers.length === 0) {
    return [];
  }

  const chartIndexByTimestamp = new Map(
    chartData.map((point, index) => [point.t, index] as const)
  );
  const totalPoints = Math.max(chartData.length - 1, 1);
  const effectivePlotWidth =
    Number.isFinite(plotWidth) && plotWidth > 0 ? plotWidth : DEFAULT_PLOT_WIDTH_PX;

  const positionedMarkers = markers
    .map((marker, index) => {
      const chartIndex = chartIndexByTimestamp.get(marker.t);
      if (typeof chartIndex !== "number") {
        return null;
      }

      return {
        marker,
        xPx: (chartIndex / totalPoints) * effectivePlotWidth,
        chartIndex,
        sourceIndex: index,
      };
    })
    .filter(
      (
        marker
      ): marker is Readonly<{
        marker: VisibleTradeMarker;
        xPx: number;
        chartIndex: number;
        sourceIndex: number;
      }> => marker !== null
    )
    .sort((left, right) =>
      left.chartIndex === right.chartIndex
        ? left.sourceIndex - right.sourceIndex
        : left.chartIndex - right.chartIndex
    );

  if (positionedMarkers.length === 0) {
    return [];
  }

  const clusters: VisibleTradeMarker[][] = [];
  let currentCluster: VisibleTradeMarker[] = [];
  let lastXPx: number | null = null;

  for (const entry of positionedMarkers) {
    if (
      currentCluster.length === 0 ||
      lastXPx === null ||
      entry.xPx - lastXPx < TRADE_CLUSTER_GAP_PX
    ) {
      currentCluster.push(entry.marker);
    } else {
      clusters.push(currentCluster);
      currentCluster = [entry.marker];
    }

    lastXPx = entry.xPx;
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const clusteredMarkers = clusters
    .map(buildClusteredTradeMarker)
    .filter((marker): marker is PositionedTradeMarker => marker !== null);

  if (clusteredMarkers.length === 0) {
    return [];
  }

  const grossNotionals = clusteredMarkers.map((marker) => marker.grossNotional);
  const maxGrossNotional = Math.max(...grossNotionals);
  const topDomainPrice = priceAxisDomain?.[1] ?? 0;
  const bottomDomainPrice = priceAxisDomain?.[0] ?? 0;
  const domainSpan = Math.max(topDomainPrice - bottomDomainPrice, 1);
  const markerY = Math.max(
    bottomDomainPrice + domainSpan * MIN_MARKER_BAND_OFFSET_RATIO,
    topDomainPrice - domainSpan * TRADE_MARKER_BAND_OFFSET_RATIO
  );

  return clusteredMarkers.map((marker) => ({
    ...marker,
    markerY,
    markerSizeScale: resolveMarkerSizeScale(
      marker.grossNotional,
      maxGrossNotional
    ),
  }));
};
