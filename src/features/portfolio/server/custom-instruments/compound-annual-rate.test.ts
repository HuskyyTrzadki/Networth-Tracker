import { describe, expect, it } from "vitest";

import { parseDecimalString, toFixedDecimalString } from "@/lib/decimal";
import { shiftIsoDate } from "@/features/market-data/server/lib/date-utils";

import {
  computeCompoundedAnnualRateDailyFactor,
  computeCompoundedAnnualRateQuote,
  computeCompoundedAnnualRateQuoteFromPreviousDay,
} from "./compound-annual-rate";

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

  it("decreases price for negative annual rate", () => {
    const quote = computeCompoundedAnnualRateQuote({
      anchorPrice: "100",
      anchorDate: "2026-01-01",
      annualRatePct: "-36.5",
      asOfDate: "2026-01-11",
    });

    expect(Number(quote.price)).toBeLessThan(100);
  });

  it("keeps 10-year incremental compounding aligned with anchor pow method at storage precision", () => {
    const anchorPrice = "123.45";
    const anchorDate = "2016-01-01";
    const annualRatePct = "5";

    const dailyRateFactor = computeCompoundedAnnualRateDailyFactor(annualRatePct);
    if (!dailyRateFactor) {
      throw new Error("Daily factor is required for deterministic drift test.");
    }

    let incrementallyCompoundedPrice = anchorPrice;
    let asOfDate = anchorDate;

    for (let day = 1; day <= 3650; day += 1) {
      asOfDate = shiftIsoDate(asOfDate, 1);

      const incrementalQuote = computeCompoundedAnnualRateQuoteFromPreviousDay({
        previousPrice: incrementallyCompoundedPrice,
        dailyRateFactor,
      });
      if (!incrementalQuote) {
        throw new Error("Incremental quote should be available for valid inputs.");
      }
      incrementallyCompoundedPrice = incrementalQuote.price;
    }

    const anchorPowQuote = computeCompoundedAnnualRateQuote({
      anchorPrice,
      anchorDate,
      annualRatePct,
      asOfDate,
    });

    const incrementalStorage = parseDecimalString(incrementallyCompoundedPrice);
    const anchorStorage = parseDecimalString(anchorPowQuote.price);
    if (!incrementalStorage || !anchorStorage) {
      throw new Error("Expected parsable decimal prices in drift test.");
    }

    const finalDiff = incrementalStorage.minus(anchorStorage).abs();
    expect(toFixedDecimalString(finalDiff, 2)).toBe("0.00");
  });
});
