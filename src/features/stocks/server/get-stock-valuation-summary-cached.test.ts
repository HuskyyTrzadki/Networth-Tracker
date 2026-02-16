import { beforeEach, describe, expect, it, vi } from "vitest";

import { yahooFinance } from "@/lib/yahoo-finance-client";

import { getStockValuationSummaryCached } from "./get-stock-valuation-summary-cached";

vi.mock("@/lib/yahoo-finance-client", () => ({
  yahooFinance: {
    quoteSummary: vi.fn(),
  },
}));

type CacheRow = Readonly<{
  provider: "yahoo";
  provider_key: string;
  market_cap: number | null;
  pe_ttm: number | null;
  price_to_sales: number | null;
  ev_to_ebitda: number | null;
  price_to_book: number | null;
  profit_margin: number | null;
  operating_margin: number | null;
  quarterly_earnings_yoy: number | null;
  quarterly_revenue_yoy: number | null;
  cash: number | null;
  debt: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  payout_date: string | null;
  as_of: string | null;
  fetched_at: string;
}>;

const createSupabaseMock = (row: CacheRow | null) =>
  ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: row,
              error: null,
            }),
          }),
        }),
      }),
    }),
  }) as never;

describe("getStockValuationSummaryCached", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns safe empty summary when provider fetch fails and no cache exists", async () => {
    vi.mocked(yahooFinance.quoteSummary).mockRejectedValueOnce(new Error("fetch failed"));

    const supabase = createSupabaseMock(null);
    const result = await getStockValuationSummaryCached(supabase, "MSFT", {
      ttlMs: 1,
    });

    expect(result.providerKey).toBe("MSFT");
    expect(result.marketCap).toBeNull();
    expect(result.peTtm).toBeNull();
    expect(result.fetchedAt).not.toBeNull();
  });

  it("returns stale cache when provider fetch fails and cache exists", async () => {
    vi.mocked(yahooFinance.quoteSummary).mockRejectedValueOnce(new Error("fetch failed"));

    const oldCache: CacheRow = {
      provider: "yahoo",
      provider_key: "MSFT",
      market_cap: 123_000_000_000,
      pe_ttm: 20.5,
      price_to_sales: 7.1,
      ev_to_ebitda: 15.2,
      price_to_book: 8.4,
      profit_margin: 0.22,
      operating_margin: 0.33,
      quarterly_earnings_yoy: 0.1,
      quarterly_revenue_yoy: 0.08,
      cash: 10_000_000_000,
      debt: 5_000_000_000,
      dividend_yield: 0.01,
      payout_ratio: 0.2,
      payout_date: "2025-01-10",
      as_of: "2025-01-12T00:00:00.000Z",
      fetched_at: "2020-01-01T00:00:00.000Z",
    };

    const supabase = createSupabaseMock(oldCache);
    const result = await getStockValuationSummaryCached(supabase, "MSFT", {
      ttlMs: 1,
    });

    expect(result.marketCap).toBe(123_000_000_000);
    expect(result.peTtm).toBe(20.5);
    expect(result.payoutDate).toBe("2025-01-10");
  });
});

