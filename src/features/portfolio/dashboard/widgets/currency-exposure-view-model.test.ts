import { describe, expect, it } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import { buildInvestorCurrencyExposure } from "./currency-exposure-view-model";

const baseSummary: PortfolioSummary = {
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-23T08:00:00.000Z",
  holdings: [],
};

describe("buildInvestorCurrencyExposure", () => {
  it("aggregates holdings by quote currency", () => {
    const result = buildInvestorCurrencyExposure({
      ...baseSummary,
      holdings: [
        {
          instrumentId: "1",
          provider: "yahoo",
          symbol: "AAPL",
          name: "Apple",
          exchange: null,
          currency: "USD",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "300",
          weight: 0.3,
          missingReason: null,
        },
        {
          instrumentId: "2",
          provider: "yahoo",
          symbol: "MSFT",
          name: "Microsoft",
          exchange: null,
          currency: "USD",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "200",
          weight: 0.2,
          missingReason: null,
        },
        {
          instrumentId: "3",
          provider: "yahoo",
          symbol: "CDR",
          name: "CD Projekt",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "500",
          weight: 0.5,
          missingReason: null,
        },
      ],
    });

    expect(result.chart).toEqual([
      { currencyCode: "PLN", sharePct: 50, valueBase: "500.00" },
      { currencyCode: "USD", sharePct: 50, valueBase: "500.00" },
    ]);
    expect(result.details[0]?.drivers).toHaveLength(1);
    expect(result.details[1]?.drivers).toHaveLength(2);
  });

  it("groups long tail into INNE bucket", () => {
    const currencies = ["USD", "EUR", "PLN", "JPY", "GBP", "CHF", "AUD"];

    const result = buildInvestorCurrencyExposure({
      ...baseSummary,
      holdings: currencies.map((currency, index) => ({
        instrumentId: `${currency}-${index}`,
        provider: "yahoo",
        symbol: `${currency}${index}`,
        name: currency,
        exchange: null,
        currency,
        logoUrl: null,
        instrumentType: "EQUITY",
        quantity: "1",
        price: "100",
        valueBase: "100",
        weight: 1 / currencies.length,
        missingReason: null,
      })),
    });

    expect(result.chart).toHaveLength(7);
    expect(result.chart[6]).toEqual({
      currencyCode: "INNE",
      sharePct: expect.any(Number),
      valueBase: "100.00",
    });
  });
});
