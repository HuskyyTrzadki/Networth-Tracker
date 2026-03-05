import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEconomicCurrencyExposure } from "./use-economic-currency-exposure";
import { getEconomicCurrencyExposure } from "@/features/portfolio/client/get-economic-currency-exposure";

vi.mock("@/features/portfolio/client/get-economic-currency-exposure", () => ({
  getEconomicCurrencyExposure: vi.fn(),
}));

describe("useEconomicCurrencyExposure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads economic exposure response", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockResolvedValueOnce({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-03-05T00:00:00.000Z",
      modelMode: "ECONOMIC",
      status: "READY",
      chart: [],
      details: [],
      meta: {
        model: "gemini",
        promptVersion: "v1",
        fromCache: false,
      },
    });

    const { result } = renderHook(() =>
      useEconomicCurrencyExposure({ selectedPortfolioId: null })
    );

    await act(async () => {
      await result.current.loadEconomicExposure({ allowCachedResponse: true });
    });

    await waitFor(() => {
      expect(result.current.economicResponse?.status).toBe("READY");
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("skips second request when cached response is allowed", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockResolvedValue({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-03-05T00:00:00.000Z",
      modelMode: "ECONOMIC",
      status: "READY",
      chart: [],
      details: [],
      meta: {
        model: "gemini",
        promptVersion: "v1",
        fromCache: false,
      },
    });

    const { result } = renderHook(() =>
      useEconomicCurrencyExposure({ selectedPortfolioId: null })
    );

    await act(async () => {
      await result.current.loadEconomicExposure({ allowCachedResponse: true });
    });

    await act(async () => {
      await result.current.loadEconomicExposure({ allowCachedResponse: true });
    });

    expect(vi.mocked(getEconomicCurrencyExposure)).toHaveBeenCalledTimes(1);
  });

  it("forces reload when cached response is not allowed", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockResolvedValue({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-03-05T00:00:00.000Z",
      modelMode: "ECONOMIC",
      status: "READY",
      chart: [],
      details: [],
      meta: {
        model: "gemini",
        promptVersion: "v1",
        fromCache: false,
      },
    });

    const { result } = renderHook(() =>
      useEconomicCurrencyExposure({ selectedPortfolioId: null })
    );

    await act(async () => {
      await result.current.loadEconomicExposure({ allowCachedResponse: true });
    });

    await act(async () => {
      await result.current.loadEconomicExposure({ allowCachedResponse: false });
    });

    expect(vi.mocked(getEconomicCurrencyExposure)).toHaveBeenCalledTimes(2);
  });

  it("maps unknown errors to fallback message", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockRejectedValueOnce("bad");

    const { result } = renderHook(() =>
      useEconomicCurrencyExposure({ selectedPortfolioId: null })
    );

    await act(async () => {
      await result.current.loadEconomicExposure({ allowCachedResponse: true });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Nie udało się policzyć ekspozycji.");
      expect(result.current.isLoading).toBe(false);
    });
  });
});
