import { describe, expect, it } from "vitest";

import { toBenchmarkReturnSeries } from "./benchmark-performance";

describe("toBenchmarkReturnSeries", () => {
  it("computes cumulative returns from close-price points", () => {
    const result = toBenchmarkReturnSeries([
      { label: "2026-01-01", value: 100 },
      { label: "2026-01-02", value: 110 },
      { label: "2026-01-03", value: 121 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: "2026-01-02", value: 0.1 });
    expect(result[1]?.label).toBe("2026-01-03");
    expect(result[1]?.value).toBeCloseTo(0.21);
  });

  it("breaks the series when there is a missing day value", () => {
    const result = toBenchmarkReturnSeries([
      { label: "2026-01-01", value: 100 },
      { label: "2026-01-02", value: null },
      { label: "2026-01-03", value: 120 },
      { label: "2026-01-04", value: 126 },
    ]);

    expect(result).toEqual([
      { label: "2026-01-02", value: null },
      { label: "2026-01-03", value: 0.2 },
      { label: "2026-01-04", value: 0.26 },
    ]);
  });
});
