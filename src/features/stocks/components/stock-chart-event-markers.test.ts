import { describe, expect, it } from "vitest";

import { buildMockChartEventMarkers } from "./stock-chart-event-markers";

const points = [
  { t: "2023-01-15T00:00:00.000Z", price: 100 },
  { t: "2023-07-15T00:00:00.000Z", price: 108 },
  { t: "2024-01-15T00:00:00.000Z", price: 112 },
  { t: "2024-07-15T00:00:00.000Z", price: 118 },
  { t: "2025-01-15T00:00:00.000Z", price: 123 },
  { t: "2025-07-15T00:00:00.000Z", price: 129 },
] as const;

describe("buildMockChartEventMarkers", () => {
  it("builds narrative labels for news/global/earnings markers", () => {
    const markers = buildMockChartEventMarkers(points, {
      includeEarnings: true,
      includeNews: true,
      includeUserTrades: false,
      includeGlobalNews: true,
    });

    const earnings = markers.find((marker) => marker.kind === "earnings");
    const news = markers.find((marker) => marker.kind === "news");
    const globalNews = markers.find((marker) => marker.kind === "globalNews");

    expect(earnings && "annotationLabel" in earnings).toBe(true);
    expect(news && "annotationLabel" in news).toBe(true);
    expect(globalNews && "annotationLabel" in globalNews).toBe(true);
  });

  it("returns no markers for empty points", () => {
    const markers = buildMockChartEventMarkers([], {
      includeEarnings: true,
      includeNews: true,
      includeUserTrades: true,
      includeGlobalNews: true,
    });

    expect(markers).toHaveLength(0);
  });
});

