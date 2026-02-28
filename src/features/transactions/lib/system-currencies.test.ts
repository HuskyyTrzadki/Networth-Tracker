import { describe, expect, it } from "vitest";

import { isCashInstrumentLike } from "./system-currencies";

describe("system-currencies", () => {
  it("recognizes cash instruments by type", () => {
    expect(isCashInstrumentLike({ instrumentType: "CURRENCY" })).toBe(true);
  });

  it("recognizes system provider as cash", () => {
    expect(isCashInstrumentLike({ provider: "system" })).toBe(true);
  });

  it("rejects non-cash instruments even when quoted in cash currencies", () => {
    expect(
      isCashInstrumentLike({
        instrumentType: "EQUITY",
        provider: "yahoo",
      })
    ).toBe(false);
  });
});
