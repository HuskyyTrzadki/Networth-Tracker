import { describe, expect, it } from "vitest";

import { __test__ } from "./get-fx-rates-cached";

describe("getFxRatesCached inversion", () => {
  it("inverts cached FX when only reverse is available", () => {
    const inverted = __test__.invertRate(
      {
        base_currency: "USD",
        quote_currency: "PLN",
        provider: "yahoo",
        rate: 2,
        as_of: "2025-01-01T10:00:00Z",
        fetched_at: "2025-01-01T10:05:00Z",
      },
      "PLN",
      "USD"
    );

    expect(inverted).not.toBeNull();
    expect(inverted?.rate).toBe("0.5");
    expect(inverted?.from).toBe("PLN");
    expect(inverted?.to).toBe("USD");
    expect(inverted?.source).toBe("inverted");
  });

  it("returns null for invalid rate", () => {
    const inverted = __test__.invertRate(
      {
        base_currency: "USD",
        quote_currency: "PLN",
        provider: "yahoo",
        rate: Number.NaN,
        as_of: "2025-01-01T10:00:00Z",
        fetched_at: "2025-01-01T10:05:00Z",
      },
      "PLN",
      "USD"
    );

    expect(inverted).toBeNull();
  });
});
