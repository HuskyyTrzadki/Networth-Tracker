import { describe, expect, it } from "vitest";

import { __test__ } from "./range-market-data";

describe("mergeRowMaps", () => {
  it("keeps one row per date when fetched data overlaps cached data", () => {
    const merged = __test__.mergeRowMaps(
      new Map([
        [
          "AAPL",
          [
            { price_date: "2026-03-12", close: 205 },
            { price_date: "2026-03-13", close: 210 },
          ],
        ],
      ]),
      new Map([
        [
          "AAPL",
          [
            { price_date: "2026-03-11", close: 203 },
            { price_date: "2026-03-13", close: 211 },
          ],
        ],
      ]),
      (row) => row.price_date
    );

    expect(merged.get("AAPL")).toEqual([
      { price_date: "2026-03-11", close: 203 },
      { price_date: "2026-03-12", close: 205 },
      { price_date: "2026-03-13", close: 211 },
    ]);
  });
});
