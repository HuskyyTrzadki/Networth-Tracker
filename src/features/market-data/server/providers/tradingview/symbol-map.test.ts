import { describe, expect, it } from "vitest";

import { mapInstrumentToTradingViewSymbol } from "./symbol-map";

describe("mapInstrumentToTradingViewSymbol", () => {
  it("maps WSE provider keys with .WA suffix to GPW path", () => {
    expect(
      mapInstrumentToTradingViewSymbol({
        exchange: "WSE",
        providerKey: "PKN.WA",
        symbol: "PKN.WA",
      })
    ).toEqual({
      ok: true,
      venue: "GPW",
      ticker: "PKN",
      symbolPath: "GPW-PKN",
    });
  });

  it("maps NASDAQ tickers unchanged", () => {
    expect(
      mapInstrumentToTradingViewSymbol({
        exchange: "NASDAQ",
        providerKey: "NVDA",
        symbol: "NVDA",
      })
    ).toEqual({
      ok: true,
      venue: "NASDAQ",
      ticker: "NVDA",
      symbolPath: "NASDAQ-NVDA",
    });
  });

  it("maps NYSE tickers unchanged", () => {
    expect(
      mapInstrumentToTradingViewSymbol({
        exchange: "NYSE",
        providerKey: "KO",
        symbol: "KO",
      })
    ).toEqual({
      ok: true,
      venue: "NYSE",
      ticker: "KO",
      symbolPath: "NYSE-KO",
    });
  });

  it("fails for unsupported exchanges", () => {
    expect(
      mapInstrumentToTradingViewSymbol({
        exchange: "LSE",
        providerKey: "HSBA",
        symbol: "HSBA",
      })
    ).toEqual({ ok: false, reason: "UNSUPPORTED_EXCHANGE" });
  });

  it("fails for invalid ticker symbols", () => {
    expect(
      mapInstrumentToTradingViewSymbol({
        exchange: "NASDAQ",
        providerKey: "BAD/TICKER",
        symbol: "BAD/TICKER",
      })
    ).toEqual({ ok: false, reason: "INVALID_TICKER" });
  });
});
