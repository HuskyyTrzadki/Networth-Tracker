import { beforeEach, describe, expect, it, vi } from "vitest";

import { yahooFinance } from "@/lib/yahoo-finance-client";

import { searchYahooInstruments } from "./yahoo-search";

vi.mock("@/lib/yahoo-finance-client", () => ({
  yahooFinance: {
    search: vi.fn(),
    quote: vi.fn(),
  },
}));

describe("searchYahooInstruments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses fuzzy search and disables strict Yahoo search validation", async () => {
    vi.mocked(yahooFinance.search).mockResolvedValueOnce({
      quotes: [
        {
          symbol: "CBF.WA",
          shortname: "CYBERFLKS",
          longname: "Cyber_Folks S.A.",
          exchange: "WSE",
          exchDisp: "WSE",
          quoteType: "EQUITY",
          isYahooFinance: true,
          score: 20001,
        },
      ],
    } as never);
    vi.mocked(yahooFinance.quote).mockResolvedValueOnce({
      "CBF.WA": {
        symbol: "CBF.WA",
        currency: "PLN",
        region: "PL",
        shortName: "CYBERFLKS",
        longName: "Cyber_Folks S.A.",
        exchange: "WSE",
        fullExchangeName: "WSE",
      },
    } as never);

    const results = await searchYahooInstruments("cyberfolk", 3, 1000, ["EQUITY"]);

    expect(yahooFinance.search).toHaveBeenCalledWith(
      "cyberfolk",
      {
        quotesCount: 3,
        newsCount: 0,
        enableFuzzyQuery: true,
      },
      { validateResult: false }
    );
    expect(results).toEqual([
      expect.objectContaining({
        providerKey: "CBF.WA",
        ticker: "CBF",
        currency: "PLN",
        exchange: "WSE",
      }),
    ]);
  });

  it("keeps Yahoo relevance score ahead of exchange preference for obvious canonical matches", async () => {
    vi.mocked(yahooFinance.search).mockResolvedValueOnce({
      quotes: [
        {
          symbol: "APLE",
          shortname: "Apple Hospitality REIT, Inc.",
          longname: "Apple Hospitality REIT, Inc.",
          exchange: "NYSE",
          exchDisp: "NYSE",
          quoteType: "EQUITY",
          isYahooFinance: true,
          score: 20053,
        },
        {
          symbol: "AAPL",
          shortname: "Apple Inc.",
          longname: "Apple Inc.",
          exchange: "NASDAQ",
          exchDisp: "NASDAQ",
          quoteType: "EQUITY",
          isYahooFinance: true,
          score: 32087,
        },
      ],
    } as never);
    vi.mocked(yahooFinance.quote).mockResolvedValueOnce({
      APLE: {
        symbol: "APLE",
        currency: "USD",
        region: "US",
        shortName: "Apple Hospitality REIT, Inc.",
        longName: "Apple Hospitality REIT, Inc.",
        exchange: "NYSE",
        fullExchangeName: "NYSE",
      },
      AAPL: {
        symbol: "AAPL",
        currency: "USD",
        region: "US",
        shortName: "Apple Inc.",
        longName: "Apple Inc.",
        exchange: "NASDAQ",
        fullExchangeName: "NASDAQ",
      },
    } as never);

    const results = await searchYahooInstruments("apple", 3, 1000, ["EQUITY"]);

    expect(results.map((item) => item.providerKey)).toEqual(["AAPL", "APLE"]);
  });

  it("returns an empty list when Yahoo search resolves to a non-object payload", async () => {
    vi.mocked(yahooFinance.search).mockResolvedValueOnce(null as never);

    const results = await searchYahooInstruments("cyberfolk", 3, 1000, ["EQUITY"]);

    expect(results).toEqual([]);
    expect(yahooFinance.quote).not.toHaveBeenCalled();
  });
});
