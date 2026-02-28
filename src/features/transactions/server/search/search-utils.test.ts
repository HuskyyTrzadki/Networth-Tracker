import { describe, expect, it } from "vitest";

import { getExchangePriority, normalizeExchangeLabel } from "./search-utils";

describe("normalizeExchangeLabel", () => {
  it("maps Yahoo aliases to canonical exchange names", () => {
    expect(normalizeExchangeLabel("NMS")).toBe("NASDAQ");
    expect(normalizeExchangeLabel("NyQ")).toBe("NYSE");
    expect(normalizeExchangeLabel("London Stock Exchange")).toBe("LSE");
    expect(normalizeExchangeLabel("Warsaw")).toBe("WSE");
    expect(normalizeExchangeLabel("XETRA")).toBe("FRANKFURT");
  });

  it("returns uppercase sanitized value for unknown exchanges", () => {
    expect(normalizeExchangeLabel("  tse  ")).toBe("TSE");
  });
});

describe("getExchangePriority", () => {
  it("prefers configured exchanges and uses aliases", () => {
    const nyse = getExchangePriority({ exchange: "NYSE" });
    const nasdaqFromAlias = getExchangePriority({ exchange: "NMS" });
    const lse = getExchangePriority({ exchangeDisplayName: "London Stock Exchange" });
    const unknown = getExchangePriority({ exchange: "TSE" });

    expect(nyse).toBeLessThan(nasdaqFromAlias);
    expect(nasdaqFromAlias).toBeLessThan(lse);
    expect(unknown).toBe(Number.POSITIVE_INFINITY);
  });
});
