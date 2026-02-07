import { describe, expect, it } from "vitest";

import { __test__ } from "./get-instrument-daily-prices-cached";

describe("pickLatestRowsForRequestedDate", () => {
  it("returns latest candle on or before requested date per symbol", () => {
    const rows = [
      { provider_key: "INTC", price_date: "2026-02-06" },
      { provider_key: "INTC", price_date: "2025-08-15" },
      { provider_key: "INTC", price_date: "2025-08-14" },
      { provider_key: "AAPL", price_date: "2025-08-16" },
      { provider_key: "AAPL", price_date: "2025-08-13" },
    ] as const;

    const picked = __test__.pickLatestRowsForRequestedDate(
      rows as unknown as Parameters<
        typeof __test__.pickLatestRowsForRequestedDate
      >[0],
      "2025-08-14"
    );

    expect(picked.get("INTC")?.price_date).toBe("2025-08-14");
    expect(picked.get("AAPL")?.price_date).toBe("2025-08-13");
  });
});

