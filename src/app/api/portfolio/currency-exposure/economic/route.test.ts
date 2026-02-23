import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

import { POST } from "./route";
import { getEconomicCurrencyExposure } from "@/features/portfolio/server/currency-exposure/get-economic-currency-exposure";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";

vi.mock("@/features/portfolio/server/currency-exposure/get-economic-currency-exposure", () => ({
  getEconomicCurrencyExposure: vi.fn(),
}));

vi.mock("@/lib/http/route-handler", () => ({
  getAuthenticatedSupabase: vi.fn(),
  parseJsonBody: vi.fn(),
  toErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error",
}));

describe("POST /api/portfolio/currency-exposure/economic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated user", async () => {
    vi.mocked(getAuthenticatedSupabase).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(new Request("http://localhost/api/portfolio/currency-exposure/economic"));

    expect(response.status).toBe(401);
    expect(vi.mocked(getEconomicCurrencyExposure)).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    vi.mocked(getAuthenticatedSupabase).mockResolvedValueOnce({
      ok: true,
      supabase: { from: vi.fn() } as never,
      user: { id: "user-1" } as never,
    });

    vi.mocked(parseJsonBody).mockResolvedValueOnce({
      ok: true,
      body: {
        portfolioId: "not-a-uuid",
      },
    });

    const response = await POST(new Request("http://localhost/api/portfolio/currency-exposure/economic", {
      method: "POST",
    }));

    expect(response.status).toBe(400);
    expect(vi.mocked(getEconomicCurrencyExposure)).not.toHaveBeenCalled();
  });

  it("returns response payload for valid request", async () => {
    vi.mocked(getAuthenticatedSupabase).mockResolvedValueOnce({
      ok: true,
      supabase: { from: vi.fn() } as never,
      user: { id: "user-1" } as never,
    });

    vi.mocked(parseJsonBody).mockResolvedValueOnce({
      ok: true,
      body: {
        portfolioId: null,
      },
    });

    vi.mocked(getEconomicCurrencyExposure).mockResolvedValueOnce({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-02-23T08:00:00.000Z",
      modelMode: "ECONOMIC",
      chart: [{ currencyCode: "USD", sharePct: 60, valueBase: "6000.00" }],
      details: [],
      meta: {
        model: "gemini-2.5-flash-lite",
        promptVersion: "currency_exposure_v1",
        fromCache: true,
      },
    });

    const response = await POST(new Request("http://localhost/api/portfolio/currency-exposure/economic", {
      method: "POST",
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(vi.mocked(getEconomicCurrencyExposure)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        portfolioId: null,
      })
    );
  });
});
