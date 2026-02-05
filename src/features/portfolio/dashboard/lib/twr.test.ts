import { describe, expect, it } from "vitest";

import { computeDailyReturns, computePeriodReturn } from "./twr";

const row = (
  bucketDate: string,
  totalValue: number | null,
  externalCashflow: number | null,
  implicitTransfer: number | null,
  isPartial = false
) => ({
  bucketDate,
  totalValue,
  externalCashflow,
  implicitTransfer,
  isPartial,
});

describe("computeDailyReturns", () => {
  it("computes simple daily return without flows", () => {
    const rows = [
      row("2026-01-01", 100, 0, 0),
      row("2026-01-02", 110, 0, 0),
    ];

    const [day] = computeDailyReturns(rows);
    expect(day.value).toBeCloseTo(0.1);
  });

  it("neutralizes implicit transfer on buy without cash", () => {
    const rows = [
      row("2026-01-01", 200, 0, 0),
      row("2026-01-02", 300, 0, 100),
    ];

    const [day] = computeDailyReturns(rows);
    expect(day.value).toBeCloseTo(0);
  });

  it("neutralizes implicit transfer on sell without cash", () => {
    const rows = [
      row("2026-01-01", 300, 0, 0),
      row("2026-01-02", 200, 0, -100),
    ];

    const [day] = computeDailyReturns(rows);
    expect(day.value).toBeCloseTo(0);
  });

  it("marks return as partial when any day is partial", () => {
    const rows = [
      row("2026-01-01", 100, 0, 0, true),
      row("2026-01-02", 110, 0, 0),
    ];

    const [day] = computeDailyReturns(rows);
    expect(day.isPartial).toBe(true);
  });

  it("returns null when flow is missing", () => {
    const rows = [
      row("2026-01-01", 100, 0, 0),
      row("2026-01-02", 110, null, 0),
    ];

    const [day] = computeDailyReturns(rows);
    expect(day.value).toBeNull();
  });
});

describe("computePeriodReturn", () => {
  it("chains daily returns", () => {
    const rows = [
      row("2026-01-01", 100, 0, 0),
      row("2026-01-02", 110, 0, 0),
      row("2026-01-03", 121, 0, 0),
    ];

    const daily = computeDailyReturns(rows);
    const period = computePeriodReturn(daily);
    expect(period.value).toBeCloseTo(0.21);
  });

  it("restarts after missing data", () => {
    const rows = [
      row("2026-01-01", 100, 0, 0),
      row("2026-01-02", 110, null, 0),
      row("2026-01-03", 121, 0, 0),
    ];

    const daily = computeDailyReturns(rows);
    const period = computePeriodReturn(daily);
    expect(period.value).toBeCloseTo((121 - 0 - 110) / 110);
  });
});
