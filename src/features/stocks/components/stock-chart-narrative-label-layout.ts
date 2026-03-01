import type { StockChartEventMarkerPoint } from "./stock-chart-plot-events";

export type NarrativeLabelLayout = Readonly<{
  show: boolean;
  dx: number;
  dy: number;
  textAnchor: "start" | "end";
  text: string;
}>;

type NarrativeEventMarkerPoint = Extract<
  StockChartEventMarkerPoint,
  Readonly<{ kind: "news" | "globalNews" }>
>;

const isNarrativeEventMarker = (
  marker: StockChartEventMarkerPoint
): marker is NarrativeEventMarkerPoint =>
  (marker.kind === "news" || marker.kind === "globalNews") &&
  typeof marker.annotationLabel === "string" &&
  marker.annotationLabel.length > 0;

export const buildNarrativeLabelLayout = (
  eventMarkerPoints: readonly StockChartEventMarkerPoint[],
  truncateLabel: (label: string) => string
): ReadonlyMap<string, NarrativeLabelLayout> => {
  const layout = new Map<string, NarrativeLabelLayout>();
  const labeledMarkers = eventMarkerPoints
    .filter(isNarrativeEventMarker)
    .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));

  let lastVisibleTs: number | null = null;
  let visibleIndex = 0;
  const minLabelGapMs = 320 * 24 * 60 * 60 * 1000;

  for (const marker of labeledMarkers) {
    const markerTs = Date.parse(marker.t);
    const isTooCloseToPrevious =
      Number.isFinite(markerTs) &&
      lastVisibleTs !== null &&
      markerTs - lastVisibleTs < minLabelGapMs;

    if (isTooCloseToPrevious) {
      layout.set(marker.id, {
        show: false,
        dx: 0,
        dy: 0,
        textAnchor: "start",
        text: truncateLabel(marker.annotationLabel ?? ""),
      });
      continue;
    }

    if (Number.isFinite(markerTs)) {
      lastVisibleTs = markerTs;
    }

    const side = visibleIndex % 2 === 0 ? 1 : -1;
    const tier = Math.floor(visibleIndex / 2) % 3;
    const baseDx = 20;
    const tierDx = 14;
    const baseDy = marker.kind === "globalNews" ? -34 : -30;
    const tierDy = 14;

    layout.set(marker.id, {
      show: true,
      dx: side * (baseDx + tier * tierDx),
      dy: baseDy - tier * tierDy,
      textAnchor: side === 1 ? "start" : "end",
      text: truncateLabel(marker.annotationLabel ?? ""),
    });

    visibleIndex += 1;
  }

  return layout;
};
