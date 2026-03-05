import { describe, expect, it } from "vitest";

import { buildRevenueSourceCardViewModel } from "./stock-report-revenue-source";

describe("buildRevenueSourceCardViewModel", () => {
  it("returns a pending state when source breakdown is missing", () => {
    const viewModel = buildRevenueSourceCardViewModel(null);

    expect(viewModel.title).toBe("Przychody wedlug segmentow");
    expect(viewModel.nowSlices).toEqual([]);
    expect(viewModel.nowEmptyState).toContain("w trakcie opracowywania");
  });

  it("groups the long tail into Pozostale", () => {
    const viewModel = buildRevenueSourceCardViewModel({
      fetchedAt: "2026-03-05T12:00:00.000Z",
      source: "tradingview_dom",
      entries: [
        { label: "Cloud", latestValue: 50 },
        { label: "Ads", latestValue: 40 },
        { label: "Subscriptions", latestValue: 30 },
        { label: "Hardware", latestValue: 20 },
        { label: "Payments", latestValue: 10 },
        { label: "Other", latestValue: 5 },
      ],
    });

    expect(viewModel.nowSlices).toHaveLength(6);
    expect(viewModel.nowSlices.at(-1)?.label).toBe("Pozostale");
  });
});
