import { describe, expect, it } from "vitest";

import { __test__ } from "./get-instrument-quotes-cached";

describe("getInstrumentQuotesCached helpers", () => {
  it("maps nullable day-change fields from cache rows", () => {
    const quote = __test__.buildQuote({
      instrument_id: "instrument-1",
      provider: "yahoo",
      provider_key: "AAPL",
      currency: "USD",
      price: 100,
      day_change: -1.25,
      day_change_percent: -0.0125,
      as_of: "2026-02-09T10:00:00.000Z",
      fetched_at: "2026-02-09T10:01:00.000Z",
    });

    expect(quote.dayChange).toBe("-1.25");
    expect(quote.dayChangePercent).toBe(-0.0125);
  });

  it("normalizes missing or invalid day-change fields to null", () => {
    const quote = __test__.buildQuote({
      instrument_id: "instrument-2",
      provider: "yahoo",
      provider_key: "MSFT",
      currency: "USD",
      price: 220,
      day_change: null,
      day_change_percent: Number.NaN,
      as_of: "2026-02-09T10:00:00.000Z",
      fetched_at: "2026-02-09T10:01:00.000Z",
    });

    expect(quote.dayChange).toBeNull();
    expect(quote.dayChangePercent).toBeNull();
  });

  it("detects missing day-change column errors for migration fallback", () => {
    expect(
      __test__.isMissingDayChangeColumnError(
        "column instrument_quotes_cache.day_change does not exist"
      )
    ).toBe(true);
    expect(
      __test__.isMissingDayChangeColumnError(
        "column instrument_quotes_cache.day_change_percent does not exist"
      )
    ).toBe(true);
    expect(__test__.isMissingDayChangeColumnError("other error")).toBe(false);
  });
});
