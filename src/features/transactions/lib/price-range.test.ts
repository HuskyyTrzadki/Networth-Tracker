import { describe, expect, it } from "vitest";

import { isPriceWithinSessionRange } from "./price-range";

describe("isPriceWithinSessionRange", () => {
  it("returns true when price is inside range inclusively", () => {
    expect(
      isPriceWithinSessionRange("24.77", { low: "24.10", high: "25.00" })
    ).toBe(true);
    expect(
      isPriceWithinSessionRange("24.10", { low: "24.10", high: "25.00" })
    ).toBe(true);
    expect(
      isPriceWithinSessionRange("25.00", { low: "24.10", high: "25.00" })
    ).toBe(true);
  });

  it("returns false when price is outside range", () => {
    expect(
      isPriceWithinSessionRange("24.09", { low: "24.10", high: "25.00" })
    ).toBe(false);
    expect(
      isPriceWithinSessionRange("25.01", { low: "24.10", high: "25.00" })
    ).toBe(false);
  });

  it("accepts tiny float artifacts around candle boundaries", () => {
    expect(
      isPriceWithinSessionRange("88.52", {
        low: "87",
        high: "88.5199966430664",
      })
    ).toBe(true);
  });

  it("returns null when one value is invalid", () => {
    expect(
      isPriceWithinSessionRange("abc", { low: "24.10", high: "25.00" })
    ).toBeNull();
    expect(
      isPriceWithinSessionRange("24.77", { low: "bad", high: "25.00" })
    ).toBeNull();
  });
});
