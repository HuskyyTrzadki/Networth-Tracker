import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => undefined })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/features/stocks/server/get-stock-chart-http-response", () => ({
  getStockChartHttpResponse: vi.fn(),
}));

describe("GET /api/stocks/[providerKey]/chart", () => {
  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
    } as never);

    const response = await GET(new Request("http://localhost/api/stocks/GOOG/chart"), {
      params: Promise.resolve({ providerKey: "GOOG" }),
    });

    expect(response.status).toBe(401);
    expect(vi.mocked(getStockChartHttpResponse)).not.toHaveBeenCalled();
  });

  it("delegates to shared chart response helper for authenticated user", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "u1" } },
          error: null,
        })),
      },
    } as never);

    const delegatedResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    vi.mocked(getStockChartHttpResponse).mockResolvedValueOnce(delegatedResponse as never);

    const request = new Request("http://localhost/api/stocks/GOOG/chart?range=1M");
    const response = await GET(request, {
      params: Promise.resolve({ providerKey: "GOOG" }),
    });

    expect(response.status).toBe(200);
    expect(vi.mocked(getStockChartHttpResponse)).toHaveBeenCalledTimes(1);
    const input = vi.mocked(getStockChartHttpResponse).mock.calls[0]?.[0];
    expect(input?.responseMode).toBe("private");
    expect(input?.rawProviderKey).toBe("GOOG");
  });
});
