import { describe, expect, it } from "vitest";

import {
  getDisplayTicker,
  __test__,
} from "./search-instruments";
import type { InstrumentSearchResult } from "../lib/instrument-search";

const baseInstrument = (overrides: Partial<InstrumentSearchResult>) =>
  ({
    id: "yahoo:TEST",
    provider: "yahoo",
    providerKey: "TEST",
    symbol: "TEST",
    ticker: "TEST",
    name: "Test",
    currency: "USD",
    ...overrides,
  }) satisfies InstrumentSearchResult;

describe("getDisplayTicker", () => {
  it("strips GPW suffix .WA", () => {
    expect(getDisplayTicker("CDR.WA", "EQUITY")).toBe("CDR");
  });

  it("strips other dotted suffixes", () => {
    expect(getDisplayTicker("VWRD.L", "ETF")).toBe("VWRD");
  });

  it("keeps class shares with dashes", () => {
    expect(getDisplayTicker("BRK-B", "EQUITY")).toBe("BRK-B");
  });

  it("shortens crypto pairs", () => {
    expect(getDisplayTicker("BTC-USD", "CRYPTOCURRENCY")).toBe("BTC");
  });
});

describe("mergeInstrumentResults", () => {
  it("prefers local results on duplicates", () => {
    const local = [
      baseInstrument({ providerKey: "AAPL", id: "yahoo:AAPL", name: "Apple" }),
    ];
    const yahoo = [
      baseInstrument({ providerKey: "AAPL", id: "yahoo:AAPL", name: "Apple Inc." }),
      baseInstrument({ providerKey: "MSFT", id: "yahoo:MSFT", name: "Microsoft" }),
    ];

    const merged = __test__.mergeInstrumentResults(local, yahoo, 10);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.name).toBe("Apple");
    expect(merged[1]?.providerKey).toBe("MSFT");
  });

  it("fills missing instrumentType from Yahoo when local is blank", () => {
    const local = [
      baseInstrument({ providerKey: "NFLX", id: "yahoo:NFLX" }),
    ];
    const yahoo = [
      baseInstrument({
        providerKey: "NFLX",
        id: "yahoo:NFLX",
        instrumentType: "EQUITY",
      }),
    ];

    const merged = __test__.mergeInstrumentResults(local, yahoo, 10);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.instrumentType).toBe("EQUITY");
  });
});
