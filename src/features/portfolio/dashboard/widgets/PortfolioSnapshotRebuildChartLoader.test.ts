import { describe, expect, it } from "vitest";

import { __test__ } from "./PortfolioSnapshotRebuildChartLoader";

describe("PortfolioSnapshotRebuildChartLoader helpers", () => {
  it("clamps percent to [0, 100] and rounds values", () => {
    expect(__test__.clampProgress(42.4)).toBe(42);
    expect(__test__.clampProgress(42.6)).toBe(43);
    expect(__test__.clampProgress(-5)).toBe(0);
    expect(__test__.clampProgress(130)).toBe(100);
  });

  it("returns null for invalid or missing values", () => {
    expect(__test__.clampProgress(null)).toBeNull();
    expect(__test__.clampProgress(Number.NaN)).toBeNull();
    expect(__test__.clampProgress(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
