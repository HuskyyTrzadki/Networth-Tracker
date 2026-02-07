import { describe, expect, it, vi } from "vitest";

import {
  TRADE_DATE_MAX_YEARS_BACK,
  getTradeDateLowerBound,
  isValidTradeDate,
} from "./trade-date";

describe("trade-date", () => {
  it("returns lower bound exactly N years back", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-06T12:00:00Z"));

    expect(getTradeDateLowerBound()).toBe("2021-02-06");
    expect(TRADE_DATE_MAX_YEARS_BACK).toBe(5);

    vi.useRealTimers();
  });

  it("accepts boundary date and rejects one day before", () => {
    const now = new Date("2026-02-06T12:00:00Z");

    expect(isValidTradeDate("2021-02-06", now)).toBe(true);
    expect(isValidTradeDate("2021-02-05", now)).toBe(false);
  });
});
