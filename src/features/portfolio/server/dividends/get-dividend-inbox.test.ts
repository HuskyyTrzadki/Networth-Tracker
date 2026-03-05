import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDividendInbox } from "./get-dividend-inbox";

vi.mock("@/features/market-data", () => ({
  getInstrumentDividendSignalsCached: vi.fn(),
}));

const { getInstrumentDividendSignalsCached } = await import("@/features/market-data");

describe("getDividendInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty read-only aggregate response when no holdings exist", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as never;

    const result = await getDividendInbox({
      supabase,
      userId: "user-1",
      portfolioId: null,
    });

    expect(result).toEqual(
      expect.objectContaining({
        scope: "ALL",
        isReadOnly: true,
        pastItems: [],
        upcomingItems: [],
      })
    );
    expect(vi.mocked(getInstrumentDividendSignalsCached)).not.toHaveBeenCalled();
  });

  it("builds upcoming items for actionable portfolio scope", async () => {
    const portfolioId = "5b0ad507-14be-4e96-9140-cbc6612ea2f7";
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: portfolioId, is_tax_advantaged: false },
      error: null,
    });
    const inQuery = vi.fn().mockResolvedValue({
      data: [{ provider_key: "AAPL", region: "US" }],
      error: null,
    });

    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            provider: "yahoo",
            provider_key: "AAPL",
            symbol: "AAPL",
            name: "Apple",
            currency: "usd",
            quantity: "2",
            instrument_type: "EQUITY",
          },
        ],
        error: null,
      }),
      from: vi.fn((table: string) => {
        if (table === "portfolios") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle })),
            })),
          };
        }

        if (table === "instruments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ in: inQuery })),
            })),
          };
        }

        if (table === "transactions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn().mockResolvedValue({ data: [], error: null }),
                  })),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never;

    vi.mocked(getInstrumentDividendSignalsCached).mockResolvedValueOnce(
      new Map([
        [
          "AAPL",
          {
            pastEvents: [],
            upcomingEvent: {
              eventDate: "2026-04-15",
              amountPerShare: "0.25",
            },
          },
        ],
      ])
    );

    const result = await getDividendInbox({
      supabase,
      userId: "user-1",
      portfolioId,
    });

    expect(result.scope).toBe("PORTFOLIO");
    expect(result.isReadOnly).toBe(false);
    expect(result.upcomingItems).toEqual([
      expect.objectContaining({
        providerKey: "AAPL",
        eventDate: "2026-04-15",
        canBook: false,
        disabledReason: "Dostępne do zaksięgowania po dniu wypłaty.",
      }),
    ]);
  });
});
