import { describe, expect, it } from "vitest";

import {
  buildTradingViewRevenueGeoSnapshot,
  normalizeTradingViewMoneyValue,
} from "./revenue-geo-parser";

describe("normalizeTradingViewMoneyValue", () => {
  it("normalizes localized billions with unicode separators", () => {
    expect(normalizeTradingViewMoneyValue("‪‪12,80 B‬‬")).toBe(12_800_000_000);
  });

  it("normalizes millions", () => {
    expect(normalizeTradingViewMoneyValue("916,00 M")).toBe(916_000_000);
  });

  it("returns null for empty markers", () => {
    expect(normalizeTradingViewMoneyValue("—")).toBeNull();
  });
});

describe("buildTradingViewRevenueGeoSnapshot", () => {
  it("builds latest + history from extracted rows", () => {
    const snapshot = buildTradingViewRevenueGeoSnapshot({
      provider: "yahoo",
      providerKey: "PKN.WA",
      sourceUrl: "https://www.tradingview.com/symbols/GPW-PKN/financials-revenue/",
      rows: [
        {
          country: "Germany",
          rawValues: ["12,80 B", "17,24 B", "25,26 B", "23,30 B", "18,72 B"],
        },
        {
          country: "Poland",
          rawValues: ["66 B", "71,67 B", "163,19 B"],
        },
        {
          country: "No data",
          rawValues: ["—", "—"],
        },
      ],
      fetchedAt: "2026-02-22T18:00:00.000Z",
      metadata: {
        locale: "pl",
      },
    });

    expect(snapshot.source).toBe("tradingview_dom");
    expect(snapshot.fetchedAt).toBe("2026-02-22T18:00:00.000Z");

    expect(snapshot.latestByCountry).toEqual({
      Germany: 18_720_000_000,
      Poland: 163_190_000_000,
    });

    expect(snapshot.historyByCountry).toEqual({
      Germany: [
        12_800_000_000,
        17_240_000_000,
        25_260_000_000,
        23_300_000_000,
        18_720_000_000,
      ],
      Poland: [66_000_000_000, 71_670_000_000, 163_190_000_000],
    });

    expect(snapshot.metadata).toMatchObject({
      sourceUrl: "https://www.tradingview.com/symbols/GPW-PKN/financials-revenue/",
      countriesCount: 2,
      locale: "pl",
    });
  });
});
