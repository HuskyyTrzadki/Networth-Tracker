import { describe, expect, it } from "vitest";

import {
  buildDividendEventKey,
  classifyDividendMarket,
  computeDividendSmartDefault,
} from "./dividend-utils";

describe("buildDividendEventKey", () => {
  it("normalizes provider key and event date", () => {
    expect(buildDividendEventKey(" aapl ", "2026-02-15")).toBe("AAPL_2026-02-15");
  });
});

describe("classifyDividendMarket", () => {
  it("uses region first", () => {
    expect(
      classifyDividendMarket({
        providerKey: "CDR.WA",
        symbol: "CDR.WA",
        region: "PL",
      })
    ).toBe("PL");
    expect(
      classifyDividendMarket({
        providerKey: "AAPL",
        symbol: "AAPL",
        region: "US",
      })
    ).toBe("US");
  });

  it("falls back to symbol suffix", () => {
    expect(
      classifyDividendMarket({
        providerKey: "CDR.WA",
        symbol: "CDR.WA",
        region: null,
      })
    ).toBe("PL");
  });

  it("returns UNKNOWN when no rule matches", () => {
    expect(
      classifyDividendMarket({
        providerKey: "RHM.DE",
        symbol: "RHM.DE",
        region: null,
      })
    ).toBe("UNKNOWN");
  });
});

describe("computeDividendSmartDefault", () => {
  it("applies Belka for PL regular account", () => {
    const result = computeDividendSmartDefault({
      gross: "100",
      market: "PL",
      isTaxAdvantaged: false,
    });

    expect(result.netSuggested).toBe("81.00");
  });

  it("skips Belka for PL tax-advantaged account", () => {
    const result = computeDividendSmartDefault({
      gross: "100",
      market: "PL",
      isTaxAdvantaged: true,
    });

    expect(result.netSuggested).toBe("100.00");
  });

  it("applies W-8BEN for US stocks", () => {
    const result = computeDividendSmartDefault({
      gross: "100",
      market: "US",
      isTaxAdvantaged: true,
    });

    expect(result.netSuggested).toBe("85.00");
  });
});

