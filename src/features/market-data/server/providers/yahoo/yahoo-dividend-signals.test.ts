import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchYahooDividendSignals } from "./yahoo-dividend-signals";

const { mockHistorical, mockQuoteSummary } = vi.hoisted(() => ({
  mockHistorical: vi.fn(),
  mockQuoteSummary: vi.fn(),
}));

vi.mock("./yahoo-client", () => ({
  yahooFinance: {
    historical: mockHistorical,
    quoteSummary: mockQuoteSummary,
  },
}));

describe("fetchYahooDividendSignals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers exDividendDate over dividendDate for upcoming event date", async () => {
    mockHistorical.mockResolvedValueOnce([
      {
        date: new Date("2026-01-10T00:00:00.000Z"),
        dividends: 0.88,
      },
    ]);

    mockQuoteSummary.mockResolvedValueOnce({
      calendarEvents: {
        exDividendDate: new Date("2026-02-01T00:00:00.000Z"),
        dividendDate: new Date("2026-03-01T00:00:00.000Z"),
      },
    });

    const result = await fetchYahooDividendSignals("AVY", {
      historicalLookbackFromDate: "2025-01-01",
      pastFromDate: "2025-12-01",
      pastToDate: "2026-01-15",
      futureToDate: "2026-02-15",
      timeoutMs: 200,
    });

    expect(result.upcomingEvent).toEqual({
      eventDate: "2026-02-01",
      amountPerShare: "0.88",
    });
  });
});
