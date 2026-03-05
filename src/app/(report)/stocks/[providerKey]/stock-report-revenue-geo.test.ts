import { describe, expect, it } from "vitest";

import { buildRevenueGeoCardViewModel } from "./stock-report-revenue-geo";

describe("buildRevenueGeoCardViewModel", () => {
  it("returns a pending state when cached geography is missing", () => {
    const viewModel = buildRevenueGeoCardViewModel(null);

    expect(viewModel.title).toBe("Przychody wedlug regionu");
    expect(viewModel.nowSlices).toEqual([]);
    expect(viewModel.nowEmptyState).toMatch(/opracowywania/i);
  });

  it("keeps top countries and groups the tail into Pozostale", () => {
    const viewModel = buildRevenueGeoCardViewModel({
      fetchedAt: "2026-03-05T10:00:00.000Z",
      source: "tradingview_dom",
      entries: [
        { label: "USA", latestValue: 40 },
        { label: "Kanada", latestValue: 20 },
        { label: "Japonia", latestValue: 15 },
        { label: "Niemcy", latestValue: 10 },
        { label: "Francja", latestValue: 5 },
        { label: "Brazylia", latestValue: 4 },
        { label: "Australia", latestValue: 3 },
      ],
    });

    const labels = viewModel.nowSlices.map((slice) => slice.label);
    const total = viewModel.nowSlices.reduce((sum, slice) => sum + slice.value, 0);

    expect(labels).toEqual([
      "USA",
      "Kanada",
      "Japonia",
      "Niemcy",
      "Francja",
      "Pozostale",
    ]);
    expect(total).toBeCloseTo(100, 5);
    expect(viewModel.nowSubtitle).toContain("TradingView");
  });
});
