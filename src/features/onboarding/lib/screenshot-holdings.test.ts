import { describe, expect, it } from "vitest";

import { normalizeScreenshotHoldings } from "./screenshot-holdings";

describe("normalizeScreenshotHoldings", () => {
  it("dedupes exact duplicates and keeps differing quantities", () => {
    const input = [
      { ticker: "AAPL", quantity: "10" },
      { ticker: "AAPL", quantity: "10" },
      { ticker: "AAPL", quantity: "12" },
      { ticker: "MSFT", quantity: "2" },
    ];

    const result = normalizeScreenshotHoldings(input);

    expect(result).toEqual([
      { ticker: "AAPL", quantity: "10" },
      { ticker: "AAPL", quantity: "12" },
      { ticker: "MSFT", quantity: "2" },
    ]);
  });
});
