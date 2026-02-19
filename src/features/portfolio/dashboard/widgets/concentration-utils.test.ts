import { describe, expect, it } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import { getConcentrationWarning } from "./concentration-utils";

const baseSummary = {
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: null,
  holdings: [],
} satisfies PortfolioSummary;

describe("getConcentrationWarning", () => {
  it("returns null when valuation is partial", () => {
    const summary = {
      ...baseSummary,
      isPartial: true,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "900",
          weight: 0.9,
          missingReason: null,
        },
      ],
    } satisfies PortfolioSummary;

    expect(getConcentrationWarning(summary)).toBeNull();
  });

  it("ignores ETF/mutual fund/index holdings", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "ETF",
          name: "ETF",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "ETF",
          quantity: "1",
          price: "100",
          valueBase: "800",
          weight: 0.8,
          missingReason: null,
        },
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "200",
          weight: 0.2,
          missingReason: null,
        },
      ],
    } satisfies PortfolioSummary;

    expect(getConcentrationWarning(summary)).toBeNull();
  });

  it("treats null instrument type as eligible", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "210",
          weight: 0.21,
          missingReason: null,
        },
      ],
    } satisfies PortfolioSummary;

    expect(getConcentrationWarning(summary)?.severity).toBe("SOFT");
  });

  it("selects the highest eligible holding", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "250",
          weight: 0.25,
          missingReason: null,
        },
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "BBB",
          name: "BBB",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "350",
          weight: 0.35,
          missingReason: null,
        },
      ],
    } satisfies PortfolioSummary;

    const warning = getConcentrationWarning(summary);

    expect(warning?.symbol).toBe("BBB");
    expect(warning?.severity).toBe("HARD");
  });

  it("uses strict thresholds for severity", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "200",
          weight: 0.2,
          missingReason: null,
        },
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "BBB",
          name: "BBB",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "300",
          weight: 0.3,
          missingReason: null,
        },
        {
          instrumentId: "c",
          provider: "yahoo",
          symbol: "CCC",
          name: "CCC",
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
    } satisfies PortfolioSummary;

    expect(getConcentrationWarning(summary)).toBeNull();
  });
});
