import { describe, expect, it } from "vitest";

import type { PortfolioSummary } from "../valuation";
import { buildWeightedEconomicCurrencyExposure } from "./weighting";

const buildSummary = (aaplValueBase: string): PortfolioSummary => ({
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-23T08:00:00.000Z",
  holdings: [
    {
      instrumentId: "aapl",
      provider: "yahoo",
      symbol: "AAPL",
      name: "Apple",
      exchange: null,
      currency: "USD",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      price: "100",
      valueBase: aaplValueBase,
      weight: 0.6,
      missingReason: null,
    },
    {
      instrumentId: "cdr",
      provider: "yahoo",
      symbol: "CDR",
      name: "CD Projekt",
      exchange: null,
      currency: "PLN",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      price: "100",
      valueBase: "400",
      weight: 0.4,
      missingReason: null,
    },
  ],
});

const cachedBreakdown = [
  {
    instrumentId: "aapl",
    currencyExposure: [
      { currencyCode: "USD", sharePct: 60 },
      { currencyCode: "EUR", sharePct: 40 },
    ],
    rationale: null,
  },
  {
    instrumentId: "cdr",
    currencyExposure: [{ currencyCode: "PLN", sharePct: 100 }],
    rationale: null,
  },
] as const;

describe("buildWeightedEconomicCurrencyExposure", () => {
  it("reweights cached per-asset splits using current values", () => {
    const monday = buildWeightedEconomicCurrencyExposure(
      buildSummary("600"),
      cachedBreakdown,
      "ALL",
      null,
      true
    );

    const tuesday = buildWeightedEconomicCurrencyExposure(
      buildSummary("900"),
      cachedBreakdown,
      "ALL",
      null,
      true
    );

    expect(monday.chart.find((row) => row.currencyCode === "USD")?.sharePct).toBeCloseTo(36, 4);
    expect(tuesday.chart.find((row) => row.currencyCode === "USD")?.sharePct).toBeCloseTo(41.5384, 3);
    expect(monday.meta.fromCache).toBe(true);
  });
});
