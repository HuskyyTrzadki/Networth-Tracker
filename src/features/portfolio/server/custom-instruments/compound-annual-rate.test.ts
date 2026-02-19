import { describe, expect, it } from "vitest";

import { computeCompoundedAnnualRateQuote } from "./compound-annual-rate";

describe("computeCompoundedAnnualRateQuote", () => {
  it("keeps price stable for 0% annual rate", () => {
    const quote = computeCompoundedAnnualRateQuote({
      anchorPrice: "100",
      anchorDate: "2026-01-01",
      annualRatePct: "0",
      asOfDate: "2026-01-11",
    });

    expect(quote.price).toBe("100");
    expect(quote.dayChange).toBeDefined();
  });

  it("increases price for positive annual rate", () => {
    const quote = computeCompoundedAnnualRateQuote({
      anchorPrice: "100",
      anchorDate: "2026-01-01",
      annualRatePct: "36.5",
      asOfDate: "2026-01-11",
    });

    expect(Number(quote.price)).toBeGreaterThan(100);
  });
});

