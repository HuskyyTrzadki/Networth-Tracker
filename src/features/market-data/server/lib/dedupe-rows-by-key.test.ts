import { describe, expect, it } from "vitest";

import { dedupeRowsByKey } from "./dedupe-rows-by-key";

describe("dedupeRowsByKey", () => {
  it("keeps the last row for a duplicate cache key", () => {
    const rows = [
      { key: "AAPL:2026-03-13", asOf: "2026-03-13T20:00:00.000Z", close: 210 },
      { key: "MSFT:2026-03-13", asOf: "2026-03-13T20:00:00.000Z", close: 380 },
      { key: "AAPL:2026-03-13", asOf: "2026-03-13T20:05:00.000Z", close: 211 },
    ] as const;

    const deduped = dedupeRowsByKey(rows, (row) => row.key);

    expect(deduped).toHaveLength(2);
    expect(deduped.find((row) => row.key === "AAPL:2026-03-13")).toEqual(
      rows[2]
    );
  });
});
