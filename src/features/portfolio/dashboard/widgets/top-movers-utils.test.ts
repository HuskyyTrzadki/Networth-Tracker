import { describe, expect, it } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import { buildTopMovers } from "./top-movers-utils";

const baseSummary = {
  baseCurrency: "PLN",
  totalValueBase: "10000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-09T12:00:00.000Z",
  holdings: [],
} satisfies PortfolioSummary;

describe("buildTopMovers", () => {
  it("picks top 2 gainers and top 2 losers by absolute daily impact", () => {
    const movers = buildTopMovers({
      ...baseSummary,
      holdings: [
        holding("g1", "AAA", "120", 0.02),
        holding("g2", "BBB", "80", 0.01),
        holding("g3", "CCC", "20", 0.005),
        holding("l1", "DDD", "-150", -0.025),
        holding("l2", "EEE", "-70", -0.01),
        holding("l3", "FFF", "-30", -0.006),
      ],
    });

    expect(movers.map((row) => row.instrumentId)).toEqual(["g1", "g2", "l1", "l2"]);
  });

  it("fills remaining slots from one side when opposite side is missing", () => {
    const movers = buildTopMovers({
      ...baseSummary,
      holdings: [
        holding("g1", "AAA", "90", 0.02),
        holding("g2", "BBB", "70", 0.01),
        holding("g3", "CCC", "30", 0.004),
      ],
    });

    expect(movers.map((row) => row.instrumentId)).toEqual(["g1", "g2", "g3"]);
  });

  it("ignores currency holdings and rows without valid day change", () => {
    const movers = buildTopMovers({
      ...baseSummary,
      holdings: [
        {
          ...holding("cash", "PLN", "500", 0.001),
          instrumentType: "CURRENCY",
        },
        {
          ...holding("missing", "AAA", "10", 0.02),
          todayChangeBase: null,
        },
        {
          ...holding("zero", "BBB", "10", 0.02),
          todayChangeBase: "0",
        },
        holding("valid", "CCC", "-25", -0.01),
      ],
    });

    expect(movers).toHaveLength(1);
    expect(movers[0]?.instrumentId).toBe("valid");
  });
});

function holding(
  instrumentId: string,
  symbol: string,
  todayChangeBase: string,
  todayChangePercent: number
) {
  return {
    instrumentId,
    symbol,
    name: `${symbol} Corp`,
    exchange: null,
    currency: "PLN",
    logoUrl: null,
    instrumentType: "EQUITY" as const,
    quantity: "1",
    averageBuyPriceBase: "100",
    price: "100",
    valueBase: "100",
    weight: 0.1,
    todayChangeBase,
    todayChangePercent,
    missingReason: null,
  };
}
