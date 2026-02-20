import { describe, expect, it } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import { buildAllocationViewModel } from "./allocation-view-model";

type Holding = PortfolioSummary["holdings"][number];

const baseSummary = {
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: null,
  holdings: [],
} as const;

describe("buildAllocationViewModel", () => {
  it("groups holdings into Nieruchomości, Akcje and Gotówka", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "custom:flat",
          provider: "custom",
          symbol: "CUSTOM",
          name: "Kawalerka",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          customAssetType: "REAL_ESTATE",
          quantity: "1",
          price: "1",
          valueBase: "700000",
          weight: 0.7,
          missingReason: null,
        } satisfies Holding,
        {
          instrumentId: "goog",
          provider: "yahoo",
          symbol: "GOOG",
          name: "Alphabet",
          exchange: "NASDAQ",
          currency: "USD",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "1",
          valueBase: "290000",
          weight: 0.29,
          missingReason: null,
        } satisfies Holding,
        {
          instrumentId: "cash:pln",
          provider: "yahoo",
          symbol: "PLN",
          name: "Polish Zloty",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "CURRENCY",
          quantity: "1",
          price: "1",
          valueBase: "10000",
          weight: 0.01,
          missingReason: null,
        } satisfies Holding,
      ] satisfies readonly Holding[],
    };

    const result = buildAllocationViewModel(summary);

    expect(result.categories.map((category) => category.label)).toEqual([
      "Nieruchomości",
      "Akcje",
      "Gotówka",
    ]);
    expect(result.assets[0]?.label).toBe("Kawalerka");
  });

  it("maps fixed-income custom kinds into Lokaty i Obligacje", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "custom:bond",
          provider: "custom",
          symbol: "CUSTOM",
          name: "Obligacje 10Y",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          customAssetType: "TREASURY_BONDS",
          quantity: "1",
          price: "1",
          valueBase: "100000",
          weight: 1,
          missingReason: null,
        } satisfies Holding,
      ] satisfies readonly Holding[],
    };

    const result = buildAllocationViewModel(summary);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]?.label).toBe("Lokaty i Obligacje");
  });

  it("hides donut by default for variance >= 50x", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "A",
          name: "A",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "1",
          valueBase: "990",
          weight: 0.99,
          missingReason: null,
        } satisfies Holding,
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "B",
          name: "B",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "1",
          valueBase: "10",
          weight: 0.01,
          missingReason: null,
        } satisfies Holding,
      ] satisfies readonly Holding[],
    };

    const result = buildAllocationViewModel(summary);

    expect(result.largestToSmallestRatio).toBeGreaterThanOrEqual(50);
    expect(result.hideDonutByDefault).toBe(true);
  });

  it("hides donut by default when there are more than six positions", () => {
    const holdings = Array.from({ length: 7 }, (_, index) => ({
      instrumentId: `h-${index}`,
      provider: "yahoo",
      symbol: `S${index}`,
      name: `Spolka ${index}`,
      exchange: null,
      currency: "PLN",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      price: "1",
      valueBase: "100",
      weight: 1 / 7,
      missingReason: null,
    })) satisfies Holding[];

    const result = buildAllocationViewModel({
      ...baseSummary,
      holdings,
    });

    expect(result.hideDonutByDefault).toBe(true);
  });
});
