import { describe, expect, it } from "vitest";

import { getPriceTrendColor, resolveStockPriceTrend } from "./stock-chart-trend";

describe("stock-chart-trend", () => {
  it("detects upward trend", () => {
    const trend = resolveStockPriceTrend([100, 101, 103]);

    expect(trend.direction).toBe("up");
    expect(trend.changePercent).toBeCloseTo(3, 4);
  });

  it("detects downward trend", () => {
    const trend = resolveStockPriceTrend([200, 197, 190]);

    expect(trend.direction).toBe("down");
    expect(trend.changePercent).toBeCloseTo(-5, 4);
  });

  it("returns flat for tiny moves", () => {
    const trend = resolveStockPriceTrend([100, 100.05, 100.08]);

    expect(trend.direction).toBe("flat");
  });

  it("ignores null values", () => {
    const trend = resolveStockPriceTrend([null, 150, null, 165, null]);

    expect(trend.start).toBe(150);
    expect(trend.end).toBe(165);
    expect(trend.direction).toBe("up");
  });

  it("returns flat when not enough valid values", () => {
    const trend = resolveStockPriceTrend([null, null]);

    expect(trend.direction).toBe("flat");
    expect(trend.changePercent).toBeNull();
  });

  it("maps trend to semantic line colors", () => {
    expect(getPriceTrendColor("up")).toBe("var(--profit)");
    expect(getPriceTrendColor("down")).toBe("var(--loss)");
    expect(getPriceTrendColor("flat")).toBe("var(--chart-1)");
  });
});
