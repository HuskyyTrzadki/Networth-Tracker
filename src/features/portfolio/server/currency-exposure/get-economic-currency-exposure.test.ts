import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateGeminiJson } from "@/lib/ai/gemini-client";

import { getEconomicCurrencyExposure } from "./get-economic-currency-exposure";

vi.mock("../get-portfolio-summary", () => ({
  getPortfolioSummary: vi.fn(),
}));

vi.mock("../get-portfolio-holdings", () => ({
  getPortfolioHoldings: vi.fn(),
}));

vi.mock("./cache", () => ({
  readCurrencyExposureCache: vi.fn(),
  loadRevenueGeoByProviderKey: vi.fn(),
  saveCurrencyExposureCache: vi.fn(),
}));

vi.mock("./fingerprint", () => ({
  buildInstrumentSetFingerprint: vi.fn(() => "fingerprint"),
}));

vi.mock("@/lib/ai/gemini-client", () => ({
  generateGeminiJson: vi.fn(),
}));

const { getPortfolioSummary } = await import("../get-portfolio-summary");
const { getPortfolioHoldings } = await import("../get-portfolio-holdings");
const {
  readCurrencyExposureCache,
  loadRevenueGeoByProviderKey,
} = await import("./cache");

describe("getEconomicCurrencyExposure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pending source data when a Yahoo equity has no geo coverage", async () => {
    vi.mocked(getPortfolioSummary).mockResolvedValueOnce({
      baseCurrency: "PLN",
      totalValueBase: "1000.00",
      isPartial: false,
      missingQuotes: 0,
      missingFx: 0,
      asOf: "2026-03-02T09:00:00.000Z",
      holdings: [
        {
          instrumentId: "instrument-1",
          provider: "yahoo",
          symbol: "AAPL",
          name: "Apple",
          exchange: "NASDAQ",
          currency: "USD",
          logoUrl: null,
          instrumentType: "EQUITY",
          quantity: "1",
          price: "100",
          valueBase: "1000",
          weight: 1,
          missingReason: null,
        },
      ],
    });

    vi.mocked(getPortfolioHoldings).mockResolvedValueOnce([
      {
        instrumentId: "instrument-1",
        provider: "yahoo",
        providerKey: "AAPL",
        symbol: "AAPL",
        name: "Apple",
        currency: "USD",
        exchange: "NASDAQ",
        logoUrl: null,
        instrumentType: "EQUITY",
        quantity: "1",
      },
    ]);

    vi.mocked(readCurrencyExposureCache).mockResolvedValueOnce(null);
    vi.mocked(loadRevenueGeoByProviderKey).mockResolvedValueOnce(new Map());

    const result = await getEconomicCurrencyExposure({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      } as never,
      userId: "user-1",
      portfolioId: null,
      traceId: "trace-1",
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "PENDING_SOURCE_DATA",
        pendingProviderKeys: ["AAPL"],
      })
    );
    expect(vi.mocked(generateGeminiJson)).not.toHaveBeenCalled();
  });
});
