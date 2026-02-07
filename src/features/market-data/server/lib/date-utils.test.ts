import { describe, expect, it } from "vitest";

import { isoDateRange, shiftIsoDate, subtractIsoDays } from "./date-utils";

describe("date-utils", () => {
  it("shifts ISO dates in UTC-safe day units", () => {
    expect(shiftIsoDate("2026-01-01", 1)).toBe("2026-01-02");
    expect(shiftIsoDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftIsoDate("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("subtracts days from ISO dates", () => {
    expect(subtractIsoDays("2026-01-10", 10)).toBe("2025-12-31");
  });

  it("builds inclusive ISO day ranges", () => {
    expect(isoDateRange("2026-01-01", "2026-01-03")).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("returns empty range when from > to", () => {
    expect(isoDateRange("2026-01-03", "2026-01-01")).toEqual([]);
  });
});
