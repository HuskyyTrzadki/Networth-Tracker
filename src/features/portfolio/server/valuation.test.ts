import { describe, expect, it } from "vitest";

import { buildPortfolioSummary } from "./valuation";

describe("buildPortfolioSummary", () => {
  it("nets holdings and computes total value", () => {
    const summary = buildPortfolioSummary({
      baseCurrency: "PLN",
      holdings: [
        {
          instrumentId: "i1",
          symbol: "AAA",
          name: "AAA",
          currency: "USD",
          exchange: null,
          provider: "yahoo",
          providerKey: "AAA",
          logoUrl: null,
          instrumentType: null,
          quantity: "2",
        },
      ],
      quotesByInstrument: new Map([
        [
          "i1",
          {
            instrumentId: "i1",
            currency: "USD",
            price: "10",
            asOf: "2026-01-28T10:00:00.000Z",
            fetchedAt: "2026-01-28T10:05:00.000Z",
          },
        ],
      ]),
      fxByPair: new Map([
        [
          "USD:PLN",
          {
            from: "USD",
            to: "PLN",
            rate: "4",
            asOf: "2026-01-28T09:00:00.000Z",
            fetchedAt: "2026-01-28T09:05:00.000Z",
          },
        ],
      ]),
    });

    expect(summary.totalValueBase).toBe("80");
    expect(summary.isPartial).toBe(false);
    expect(summary.asOf).toBe("2026-01-28T09:00:00.000Z");
  });

  it("marks partial valuation when quote is missing", () => {
    const summary = buildPortfolioSummary({
      baseCurrency: "PLN",
      holdings: [
        {
          instrumentId: "i1",
          symbol: "AAA",
          name: "AAA",
          currency: "PLN",
          exchange: null,
          provider: "yahoo",
          providerKey: "AAA",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
        },
      ],
      quotesByInstrument: new Map([["i1", null]]),
      fxByPair: new Map(),
    });

    expect(summary.totalValueBase).toBeNull();
    expect(summary.isPartial).toBe(true);
    expect(summary.missingQuotes).toBe(1);
  });

  it("marks partial valuation when FX is missing", () => {
    const summary = buildPortfolioSummary({
      baseCurrency: "PLN",
      holdings: [
        {
          instrumentId: "i1",
          symbol: "AAA",
          name: "AAA",
          currency: "USD",
          exchange: null,
          provider: "yahoo",
          providerKey: "AAA",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
        },
      ],
      quotesByInstrument: new Map([
        [
          "i1",
          {
            instrumentId: "i1",
            currency: "USD",
            price: "10",
            asOf: "2026-01-28T10:00:00.000Z",
            fetchedAt: "2026-01-28T10:05:00.000Z",
          },
        ],
      ]),
      fxByPair: new Map(),
    });

    expect(summary.totalValueBase).toBeNull();
    expect(summary.isPartial).toBe(true);
    expect(summary.missingFx).toBe(1);
  });

  it("values cash holdings at 1.0 without quotes", () => {
    const summary = buildPortfolioSummary({
      baseCurrency: "PLN",
      holdings: [
        {
          instrumentId: "cash-pln",
          symbol: "PLN",
          name: "Gotówka PLN",
          currency: "PLN",
          exchange: null,
          provider: "system",
          providerKey: "PLN",
          logoUrl: null,
          instrumentType: "CURRENCY",
          quantity: "1000",
        },
      ],
      quotesByInstrument: new Map(),
      fxByPair: new Map(),
    });

    expect(summary.totalValueBase).toBe("1000");
    expect(summary.missingQuotes).toBe(0);
    expect(summary.missingFx).toBe(0);
  });

  it("marks partial when cash needs FX", () => {
    const summary = buildPortfolioSummary({
      baseCurrency: "PLN",
      holdings: [
        {
          instrumentId: "cash-usd",
          symbol: "USD",
          name: "Gotówka USD",
          currency: "USD",
          exchange: null,
          provider: "system",
          providerKey: "USD",
          logoUrl: null,
          instrumentType: "CURRENCY",
          quantity: "100",
        },
      ],
      quotesByInstrument: new Map(),
      fxByPair: new Map(),
    });

    expect(summary.totalValueBase).toBeNull();
    expect(summary.missingQuotes).toBe(0);
    expect(summary.missingFx).toBe(1);
  });
});
