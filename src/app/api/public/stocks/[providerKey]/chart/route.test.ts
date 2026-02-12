import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  tryCreateAdminClient: vi.fn(),
}));

vi.mock("@/features/stocks/server/get-stock-chart-http-response", () => ({
  getStockChartHttpResponse: vi.fn(),
}));

describe("GET /api/public/stocks/[providerKey]/chart", () => {
  it("delegates to shared chart response helper in public mode", async () => {
    vi.mocked(tryCreateAdminClient).mockReturnValue({} as never);
    const delegatedResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    vi.mocked(getStockChartHttpResponse).mockResolvedValueOnce(delegatedResponse as never);

    const request = new Request(
      "http://localhost/api/public/stocks/GOOG/chart?range=1D"
    );
    const response = await GET(request, {
      params: Promise.resolve({ providerKey: "GOOG" }),
    });

    expect(response.status).toBe(200);
    expect(vi.mocked(getStockChartHttpResponse)).toHaveBeenCalledTimes(1);
    const input = vi.mocked(getStockChartHttpResponse).mock.calls[0]?.[0];
    expect(input?.responseMode).toBe("public");
    expect(input?.rawProviderKey).toBe("GOOG");
  });
});
