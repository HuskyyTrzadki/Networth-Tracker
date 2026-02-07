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

  it("returns null when one value is invalid", () => {
    expect(
      isPriceWithinSessionRange("abc", { low: "24.10", high: "25.00" })
    ).toBeNull();
    expect(
      isPriceWithinSessionRange("24.77", { low: "bad", high: "25.00" })
    ).toBeNull();
  });
});

