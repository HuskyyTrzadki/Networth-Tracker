import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  getInstrumentDividendSignalsCached,
  type InstrumentDividendSignals,
} from "./get-instrument-dividend-signals-cached";

const { mockFetchYahooDividendSignals } = vi.hoisted(() => ({
  mockFetchYahooDividendSignals: vi.fn(),
}));

vi.mock("./providers/yahoo/yahoo-dividend-signals", () => ({
  fetchYahooDividendSignals: mockFetchYahooDividendSignals,
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

const EMPTY_SIGNALS: InstrumentDividendSignals = {
  pastEvents: [],
  upcomingEvent: null,
};

describe("getInstrumentDividendSignalsCached", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps partial results when one ticker provider call fails", async () => {
    mockFetchYahooDividendSignals.mockImplementation(
      async (providerKey: string): Promise<InstrumentDividendSignals> => {
        if (providerKey === "BROKEN") {
          throw new Error("timeout");
        }

        return {
          pastEvents: [{ eventDate: "2026-01-10", amountPerShare: "1.25" }],
          upcomingEvent: { eventDate: "2026-03-01", amountPerShare: "1.25" },
        };
      }
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await getInstrumentDividendSignalsCached(
      [
        { provider: "yahoo", providerKey: "AAPL" },
        { provider: "yahoo", providerKey: "BROKEN" },
      ],
      {
        pastFromDate: "2026-01-01",
        pastToDate: "2026-02-01",
        futureToDate: "2026-03-20",
        historicalLookbackFromDate: "2025-01-01",
      }
    );

    expect(result.get("AAPL")).toEqual({
      pastEvents: [{ eventDate: "2026-01-10", amountPerShare: "1.25" }],
      upcomingEvent: { eventDate: "2026-03-01", amountPerShare: "1.25" },
    });
    expect(result.get("BROKEN")).toEqual(EMPTY_SIGNALS);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("limits concurrent provider calls", async () => {
    let active = 0;
    let maxActive = 0;

    mockFetchYahooDividendSignals.mockImplementation(
      async (): Promise<InstrumentDividendSignals> => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 20));
        active -= 1;
        return EMPTY_SIGNALS;
      }
    );

    await getInstrumentDividendSignalsCached(
      [
        { provider: "yahoo", providerKey: "AAPL" },
        { provider: "yahoo", providerKey: "MSFT" },
        { provider: "yahoo", providerKey: "NVDA" },
        { provider: "yahoo", providerKey: "AVY" },
        { provider: "yahoo", providerKey: "GOOGL" },
      ],
      {
        pastFromDate: "2026-01-01",
        pastToDate: "2026-02-01",
        futureToDate: "2026-03-20",
        historicalLookbackFromDate: "2025-01-01",
        maxConcurrency: 2,
      }
    );

    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
