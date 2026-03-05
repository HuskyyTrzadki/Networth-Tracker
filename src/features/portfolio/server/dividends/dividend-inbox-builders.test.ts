import { describe, expect, it } from "vitest";

import {
  buildPastDividendInboxItem,
  buildUpcomingDividendInboxItem,
  finalizePastDividendItems,
  finalizeUpcomingDividendItems,
} from "./dividend-inbox-builders";

describe("dividend-inbox-builders", () => {
  it("finalizes past items with booking flags, support checks, and descending sort", () => {
    const pastA = buildPastDividendInboxItem({
      dividendEventKey: "AAPL_2026-03-01",
      providerKey: "AAPL",
      symbol: "AAPL",
      name: "Apple",
      eventDate: "2026-03-01",
      payoutCurrency: "USD",
      amountPerShare: "1.00",
      estimatedShares: "10",
      estimatedGross: "10.00",
      market: "US",
      smartDefault: { netSuggested: "8.50", hint: "hint" },
    });

    const pastB = buildPastDividendInboxItem({
      dividendEventKey: "XYZ_2026-02-01",
      providerKey: "XYZ",
      symbol: "XYZ",
      name: "XYZ",
      eventDate: "2026-02-01",
      payoutCurrency: "JPY",
      amountPerShare: "2.00",
      estimatedShares: "2",
      estimatedGross: "4.00",
      market: "UNKNOWN",
      smartDefault: { netSuggested: "4.00", hint: null },
    });

    const result = finalizePastDividendItems({
      rawItems: [pastB, pastA],
      bookedKeys: new Set<string>([pastA.dividendEventKey]),
      isReadOnly: false,
    });

    expect(result.map((item) => item.dividendEventKey)).toEqual([
      "AAPL_2026-03-01",
      "XYZ_2026-02-01",
    ]);
    expect(result[0]).toEqual(
      expect.objectContaining({
        isBooked: true,
        canBook: false,
        disabledReason: null,
      })
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        isBooked: false,
        canBook: false,
        disabledReason:
          "Waluta JPY nie jest jeszcze obsługiwana dla księgowania.",
      })
    );
  });

  it("finalizes upcoming items with booked flags and ascending sort", () => {
    const upcomingLater = buildUpcomingDividendInboxItem({
      dividendEventKey: "MSFT_2026-04-01",
      providerKey: "MSFT",
      symbol: "MSFT",
      name: "Microsoft",
      eventDate: "2026-04-01",
      payoutCurrency: "USD",
      amountPerShare: "0.50",
      estimatedShares: "5",
      estimatedGross: "2.50",
      market: "US",
      smartDefault: { netSuggested: "2.13", hint: "hint" },
    });

    const upcomingSooner = buildUpcomingDividendInboxItem({
      dividendEventKey: "PKO_2026-03-15",
      providerKey: "PKO",
      symbol: "PKO",
      name: "PKO",
      eventDate: "2026-03-15",
      payoutCurrency: "PLN",
      amountPerShare: "1.20",
      estimatedShares: "3",
      estimatedGross: "3.60",
      market: "PL",
      smartDefault: { netSuggested: "2.92", hint: "hint" },
    });

    const result = finalizeUpcomingDividendItems({
      items: [upcomingLater, upcomingSooner],
      bookedKeys: new Set<string>([upcomingSooner.dividendEventKey]),
    });

    expect(result.map((item) => item.dividendEventKey)).toEqual([
      "PKO_2026-03-15",
      "MSFT_2026-04-01",
    ]);
    expect(result[0]?.isBooked).toBe(true);
    expect(result[1]?.isBooked).toBe(false);
  });
});
