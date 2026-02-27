import { describe, expect, it } from "vitest";

import { isCashInstrumentLike } from "./system-currencies";

describe("system-currencies", () => {
  it("recognizes cash instruments by type", () => {
    expect(isCashInstrumentLike({ instrumentType: "CURRENCY", symbol: "AAPL" })).toBe(true);
  });

  it("recognizes system provider as cash", () => {
    expect(isCashInstrumentLike({ provider: "system", symbol: "ANY" })).toBe(true);
  });

  it("recognizes supported cash currency codes", () => {
    expect(isCashInstrumentLike({ symbol: "pln" })).toBe(true);
    expect(isCashInstrumentLike({ ticker: "USD" })).toBe(true);
    expect(isCashInstrumentLike({ currency: "eur" })).toBe(true);
  });

  it("rejects non-cash instruments", () => {
    expect(isCashInstrumentLike({ instrumentType: "EQUITY", symbol: "AAPL" })).toBe(false);
  });
});
