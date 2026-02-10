import { describe, expect, it } from "vitest";

import { normalizeYahooQuote } from "./yahoo-quote";

describe("normalizeYahooQuote", () => {
  it("maps daily change and percent to normalized quote shape", () => {
    const normalized = normalizeYahooQuote("AAPL", {
      symbol: "AAPL",
      currency: "usd",
      regularMarketPrice: 123.45,
      regularMarketChange: 2.5,
      regularMarketChangePercent: 1.25,
      regularMarketTime: 1_706_000_000,
    });

    expect(normalized).toEqual({
      symbol: "AAPL",
      currency: "USD",
      price: "123.45",
      dayChange: "2.5",
      dayChangePercent: 0.0125,
      asOf: new Date(1_706_000_000 * 1000).toISOString(),
    });
  });

  it("falls back to previous close when change is missing", () => {
    const normalized = normalizeYahooQuote("AAPL", {
      symbol: "AAPL",
      currency: "USD",
      regularMarketPrice: 110,
      regularMarketPreviousClose: 100,
      regularMarketTime: 1_706_000_000,
    });

    expect(normalized?.dayChange).toBe("10");
    expect(normalized?.dayChangePercent).toBe(0.1);
  });

  it("parses numeric strings in Yahoo payload", () => {
    const normalized = normalizeYahooQuote("AAPL", {
      symbol: "AAPL",
      currency: "USD",
      regularMarketPrice: "100.5",
      regularMarketChange: "1.5",
      regularMarketTime: 1_706_000_000,
    });

    expect(normalized?.price).toBe("100.5");
    expect(normalized?.dayChange).toBe("1.5");
  });

  it("keeps daily fields nullable when Yahoo does not return them", () => {
    const normalized = normalizeYahooQuote("MSFT", {
      symbol: "MSFT",
      currency: "USD",
      regularMarketPrice: 100,
      regularMarketTime: 1_706_000_000,
    });

    expect(normalized?.dayChange).toBeNull();
    expect(normalized?.dayChangePercent).toBeNull();
  });

  it("returns null when required quote fields are missing", () => {
    expect(
      normalizeYahooQuote("AAPL", {
        symbol: "AAPL",
        regularMarketPrice: 1,
      })
    ).toBeNull();
  });
});
