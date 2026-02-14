import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { listStockTradeMarkers } from "@/features/stocks/server/list-stock-trade-markers";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => undefined })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/features/stocks/server/list-stock-trade-markers", () => ({
  listStockTradeMarkers: vi.fn(),
}));

describe("GET /api/stocks/[providerKey]/trade-markers", () => {
  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
    } as never);

    const response = await GET(
      new Request("http://localhost/api/stocks/GOOG/trade-markers"),
      {
        params: Promise.resolve({ providerKey: "GOOG" }),
      }
    );

    expect(response.status).toBe(401);
    expect(vi.mocked(listStockTradeMarkers)).not.toHaveBeenCalled();
  });

  it("returns markers for authenticated user", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "u1" } },
          error: null,
        })),
      },
    } as never);

    vi.mocked(listStockTradeMarkers).mockResolvedValueOnce([
      {
        id: "tx-1",
        tradeDate: "2026-02-11",
        side: "BUY",
        price: 120.5,
        quantity: 2,
        portfolioId: "p-1",
        portfolioName: "Main",
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/stocks/GOOG/trade-markers"),
      {
        params: Promise.resolve({ providerKey: "GOOG" }),
      }
    );
    const payload = (await response.json()) as { markers?: unknown[] };

    expect(response.status).toBe(200);
    expect(payload.markers).toHaveLength(1);
    expect(vi.mocked(listStockTradeMarkers)).toHaveBeenCalledWith(
      expect.anything(),
      "GOOG"
    );
  });
});
