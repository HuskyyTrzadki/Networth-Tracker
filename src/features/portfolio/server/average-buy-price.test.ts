import { describe, expect, it } from "vitest";

import { computeAverageBuyPriceByInstrument } from "./average-buy-price";

describe("computeAverageBuyPriceByInstrument", () => {
  it("computes weighted average for multiple buys", () => {
    const averageByInstrument = computeAverageBuyPriceByInstrument([
      {
        instrumentId: "cdr",
        side: "BUY",
        quantity: "2",
        price: "100",
      },
      {
        instrumentId: "cdr",
        side: "BUY",
        quantity: "4",
        price: "130",
      },
    ]);

    expect(averageByInstrument.get("cdr")).toBe("120");
  });

  it("keeps average unchanged on partial sell", () => {
    const averageByInstrument = computeAverageBuyPriceByInstrument([
      {
        instrumentId: "cdr",
        side: "BUY",
        quantity: "2",
        price: "100",
      },
      {
        instrumentId: "cdr",
        side: "BUY",
        quantity: "4",
        price: "130",
      },
      {
        instrumentId: "cdr",
        side: "SELL",
        quantity: "1",
        price: "140",
      },
    ]);

    expect(averageByInstrument.get("cdr")).toBe("120");
  });

  it("clears average when position is fully closed", () => {
    const averageByInstrument = computeAverageBuyPriceByInstrument([
      {
        instrumentId: "cdr",
        side: "BUY",
        quantity: "2",
        price: "100",
      },
      {
        instrumentId: "cdr",
        side: "SELL",
        quantity: "2",
        price: "120",
      },
    ]);

    expect(averageByInstrument.get("cdr")).toBeUndefined();
  });
});
