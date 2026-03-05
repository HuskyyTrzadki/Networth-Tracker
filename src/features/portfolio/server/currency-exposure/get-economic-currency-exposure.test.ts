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
const createSupabaseStub = () =>
  ({
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
  }) as never;

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
      supabase: createSupabaseStub(),
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

  it("returns weighted response from cache and skips model call", async () => {
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
          symbol: "IEF",
          name: "iShares Bond ETF",
          exchange: "NASDAQ",
          currency: "USD",
          logoUrl: null,
          instrumentType: "ETF",
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
        providerKey: "IEF",
        symbol: "IEF",
        name: "iShares Bond ETF",
        currency: "USD",
        exchange: "NASDAQ",
        logoUrl: null,
        instrumentType: "ETF",
        quantity: "1",
      },
    ]);
    vi.mocked(readCurrencyExposureCache).mockResolvedValueOnce({
      id: "cache-1",
      result_json: {
        assetBreakdown: [
          {
            instrumentId: "instrument-1",
            currencyExposure: [{ currencyCode: "USD", sharePct: 100 }],
            rationale: null,
          },
        ],
      },
    } as never);
    vi.mocked(loadRevenueGeoByProviderKey).mockResolvedValueOnce(new Map());

    const result = await getEconomicCurrencyExposure({
      supabase: createSupabaseStub(),
      userId: "user-1",
      portfolioId: null,
      traceId: "trace-cache",
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "READY",
        modelMode: "ECONOMIC",
        meta: expect.objectContaining({ fromCache: true }),
      })
    );
    expect(vi.mocked(generateGeminiJson)).not.toHaveBeenCalled();
  });

  it("throws when model payload does not match expected schema", async () => {
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
          symbol: "IEF",
          name: "iShares Bond ETF",
          exchange: "NASDAQ",
          currency: "USD",
          logoUrl: null,
          instrumentType: "ETF",
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
        providerKey: "IEF",
        symbol: "IEF",
        name: "iShares Bond ETF",
        currency: "USD",
        exchange: "NASDAQ",
        logoUrl: null,
        instrumentType: "ETF",
        quantity: "1",
      },
    ]);
    vi.mocked(readCurrencyExposureCache).mockResolvedValueOnce(null);
    vi.mocked(loadRevenueGeoByProviderKey).mockResolvedValueOnce(new Map());
    vi.mocked(generateGeminiJson).mockResolvedValueOnce(
      JSON.stringify({
        notAssets: [],
      })
    );

    await expect(
      getEconomicCurrencyExposure({
        supabase: createSupabaseStub(),
        userId: "user-1",
        portfolioId: null,
        traceId: "trace-invalid",
      })
    ).rejects.toThrow("Gemini returned invalid economic exposure schema.");
  });
});
