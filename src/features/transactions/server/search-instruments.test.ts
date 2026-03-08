import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchLocalInstruments } from "./search/local-search";
import { searchYahooInstruments } from "./search/yahoo-search";

import {
  searchInstruments,
  getDisplayTicker,
  __test__,
} from "./search-instruments";
import type { InstrumentSearchResult } from "../lib/instrument-search";

vi.mock("./search/local-search", () => ({
  searchLocalInstruments: vi.fn(),
}));

vi.mock("./search/yahoo-search", () => ({
  searchYahooInstruments: vi.fn(),
}));

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

describe("searchInstruments", () => {
  const supabase = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps auto mode cache-only when the local cache has any matches", async () => {
    vi.mocked(searchLocalInstruments).mockResolvedValueOnce([
      baseInstrument({
        id: "yahoo:PKN.WA",
        providerKey: "PKN.WA",
        symbol: "PKN.WA",
        ticker: "PKN",
        name: "ORLEN",
      }),
    ]);

    const response = await searchInstruments(supabase, {
      query: "cyberfolks",
      mode: "auto",
      limit: 3,
      timeoutMs: 2000,
    });

    expect(searchYahooInstruments).not.toHaveBeenCalled();
    expect(response.results.map((item) => item.providerKey)).toEqual(["PKN.WA"]);
  });

  it("returns only the exact cached instrument match for compact local results", async () => {
    const local = [
      baseInstrument({
        id: "yahoo:AMZN",
        providerKey: "AMZN",
        symbol: "AMZN",
        ticker: "AMZN",
        name: "Amazon.com, Inc.",
      }),
      baseInstrument({
        id: "yahoo:AMZP",
        providerKey: "AMZP",
        symbol: "AMZP",
        ticker: "AMZP",
        name: "Amazonas Energia",
      }),
    ];

    expect(__test__.buildCompactLocalResults("amzn", local, 3)).toEqual([
      local[0],
    ]);
  });

  it("fetches Yahoo for show-more mode even when local cache already has matches", async () => {
    vi.mocked(searchLocalInstruments).mockResolvedValueOnce([
      baseInstrument({ id: "yahoo:A", providerKey: "A" }),
      baseInstrument({ id: "yahoo:B", providerKey: "B" }),
    ]);
    vi.mocked(searchYahooInstruments).mockResolvedValueOnce([
      baseInstrument({ id: "yahoo:C", providerKey: "C" }),
    ]);

    const response = await searchInstruments(supabase, {
      query: "or",
      mode: "all",
      limit: 3,
      timeoutMs: 2000,
    });

    expect(searchYahooInstruments).toHaveBeenCalledWith("or", 3, 2000, null);
    expect(response.results).toHaveLength(3);
  });

  it("extends timeout and widens Yahoo candidate fetch when auto mode has no local matches", async () => {
    vi.mocked(searchLocalInstruments).mockResolvedValueOnce([]);
    vi.mocked(searchYahooInstruments).mockResolvedValueOnce([]);

    await searchInstruments(supabase, {
      query: "cyberfolks",
      mode: "auto",
      limit: 3,
      timeoutMs: 2000,
    });

    expect(searchYahooInstruments).toHaveBeenCalledWith(
      "cyberfolks",
      10,
      4000,
      null
    );
  });
});

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
