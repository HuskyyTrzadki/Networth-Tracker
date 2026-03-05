import { describe, expect, it } from "vitest";

import { buildTradingViewRevenueSourceSnapshot } from "./revenue-source-parser";

describe("buildTradingViewRevenueSourceSnapshot", () => {
  it("builds latest + history from extracted source rows", () => {
    const snapshot = buildTradingViewRevenueSourceSnapshot({
      provider: "yahoo",
      providerKey: "PKN.WA",
      sourceUrl: "https://www.tradingview.com/symbols/GPW-PKN/financials-revenue/",
      rows: [
        {
          label: "Refining",
          rawValues: ["12,80 B", "17,24 B", "25,26 B"],
        },
        {
          label: "Retail",
          rawValues: ["9,50 B", "11,00 B"],
        },
      ],
      fetchedAt: "2026-03-05T12:00:00.000Z",
    });

    expect(snapshot.latestByLabel).toEqual({
      Refining: 25_260_000_000,
      Retail: 11_000_000_000,
    });

    expect(snapshot.metadata).toMatchObject({
      labelsCount: 2,
      sourcesCount: 2,
    });
  });
});
