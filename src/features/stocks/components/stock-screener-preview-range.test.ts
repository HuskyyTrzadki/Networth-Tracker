import { describe, expect, it } from "vitest";

import { resolveScreenerPreviewData } from "./stock-screener-preview-range";

const previewChart = [
  { date: "2025-02-01", price: 100 },
  { date: "2025-04-01", price: 110 },
  { date: "2025-07-01", price: 120 },
  { date: "2025-10-01", price: 150 },
  { date: "2026-01-01", price: 180 },
] as const;

describe("resolveScreenerPreviewData", () => {
  it("slices the preview chart to the requested range", () => {
    const result = resolveScreenerPreviewData(previewChart, "3M");

    expect(result.data.map((point) => point.date)).toEqual([
      "2025-10-01",
      "2026-01-01",
    ]);
    expect(result.changePercent).toBeCloseTo(0.2);
  });

  it("falls back to the last two points when the filtered range is too short", () => {
    const result = resolveScreenerPreviewData(
      [{ date: "2026-01-01", price: 180 }] as const,
      "1M"
    );

    expect(result.data).toEqual([{ date: "2026-01-01", price: 180 }]);
    expect(result.changePercent).toBe(0);
  });
});
