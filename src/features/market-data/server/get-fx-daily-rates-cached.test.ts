import { describe, expect, it } from "vitest";

import { __test__ } from "./get-fx-daily-rates-cached";

describe("pickLatestRowsByPairForRequestedDate", () => {
  it("returns latest rate on or before requested date per pair", () => {
    const rows = [
      { base_currency: "USD", quote_currency: "PLN", rate_date: "2026-02-06" },
      { base_currency: "USD", quote_currency: "PLN", rate_date: "2025-08-14" },
      { base_currency: "EUR", quote_currency: "USD", rate_date: "2025-08-15" },
      { base_currency: "EUR", quote_currency: "USD", rate_date: "2025-08-13" },
    ] as const;

    const picked = __test__.pickLatestRowsByPairForRequestedDate(
      rows as unknown as Parameters<
        typeof __test__.pickLatestRowsByPairForRequestedDate
      >[0],
      "2025-08-14"
    );

    expect(picked.get("USD:PLN")?.rate_date).toBe("2025-08-14");
    expect(picked.get("EUR:USD")?.rate_date).toBe("2025-08-13");
  });
});

