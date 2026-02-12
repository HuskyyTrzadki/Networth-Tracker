import { describe, expect, it, vi } from "vitest";

import { getStockChartHttpResponse } from "./get-stock-chart-http-response";

import { getStockChartResponse } from "./get-stock-chart-response";

vi.mock("./get-stock-chart-response", () => ({
  getStockChartResponse: vi.fn(),
}));

describe("getStockChartHttpResponse", () => {
  it("returns 400 for empty provider key", async () => {
    const response = await getStockChartHttpResponse({
      request: new Request("http://localhost/api/public/stocks/%20/chart?range=1M"),
      rawProviderKey: "  ",
      supabase: {} as never,
      responseMode: "public",
    });

    expect(response.status).toBe(400);
  });

  it("returns cache-control headers for public response mode", async () => {
    vi.mocked(getStockChartResponse).mockResolvedValueOnce({
      providerKey: "GOOG",
      requestedRange: "1D",
      resolvedRange: "1D",
      timezone: "America/New_York",
      currency: "USD",
      hasIntraday: true,
      hasPe: false,
      activeOverlays: [],
      hasOverlayData: { pe: false, epsTtm: false, revenueTtm: false },
      overlayCoverage: {
        pe: {
          firstPointDate: null,
          lastPointDate: null,
          completeForRequestedRange: false,
        },
        epsTtm: {
          firstPointDate: null,
          lastPointDate: null,
          completeForRequestedRange: false,
        },
        revenueTtm: {
          firstPointDate: null,
          lastPointDate: null,
          completeForRequestedRange: false,
        },
      },
      points: [],
    });

    const response = await getStockChartHttpResponse({
      request: new Request("http://localhost/api/public/stocks/GOOG/chart?range=1D"),
      rawProviderKey: "GOOG",
      supabase: {} as never,
      responseMode: "public",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=30, stale-while-revalidate=120"
    );
    expect(response.headers.get("X-Cache-Policy")).toBe("public-edge");
  });

  it("returns private no-store headers for private response mode", async () => {
    vi.mocked(getStockChartResponse).mockResolvedValueOnce({
      providerKey: "GOOG",
      requestedRange: "3Y",
      resolvedRange: "3Y",
      timezone: "America/New_York",
      currency: "USD",
      hasIntraday: false,
      hasPe: false,
      activeOverlays: [],
      hasOverlayData: { pe: false, epsTtm: false, revenueTtm: false },
      overlayCoverage: {
        pe: {
          firstPointDate: null,
          lastPointDate: null,
          completeForRequestedRange: false,
        },
        epsTtm: {
          firstPointDate: null,
          lastPointDate: null,
          completeForRequestedRange: false,
        },
        revenueTtm: {
          firstPointDate: null,
          lastPointDate: null,
          completeForRequestedRange: false,
        },
      },
      points: [],
    });

    const response = await getStockChartHttpResponse({
      request: new Request("http://localhost/api/stocks/GOOG/chart?range=3Y"),
      rawProviderKey: "GOOG",
      supabase: {} as never,
      responseMode: "private",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Cache-Policy")).toBe("private-no-store");
  });
});
