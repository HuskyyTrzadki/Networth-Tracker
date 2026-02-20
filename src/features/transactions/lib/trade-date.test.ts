import { describe, expect, it, vi } from "vitest";

import {
  TRADE_DATE_MIN_ISO,
  getTradeDateLowerBound,
  isValidTradeDate,
} from "./trade-date";

describe("trade-date", () => {
  it("returns fixed lower bound", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-06T12:00:00Z"));

    expect(getTradeDateLowerBound()).toBe(TRADE_DATE_MIN_ISO);

    vi.useRealTimers();
  });

  it("accepts boundary date and rejects one day before", () => {
    const now = new Date("2026-02-06T12:00:00Z");

    expect(isValidTradeDate("2023-12-01", now)).toBe(true);
    expect(isValidTradeDate("2023-11-30", now)).toBe(false);
  });
});
