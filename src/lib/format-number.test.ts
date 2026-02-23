import { describe, expect, it } from "vitest";

import { formatGroupedNumber } from "./format-number";

const groupSeparator =
  new Intl.NumberFormat("pl-PL", { useGrouping: true })
    .formatToParts(1000)
    .find((part) => part.type === "group")?.value ?? " ";

describe("formatGroupedNumber", () => {
  it("formats integer values with Polish grouping", () => {
    expect(formatGroupedNumber("154864")).toBe(`154${groupSeparator}864`);
  });

  it("rounds and trims fractional values by default", () => {
    expect(formatGroupedNumber("154864.01896209718")).toBe(
      `154${groupSeparator}864,0189621`
    );
  });

  it("supports fixed fraction formatting", () => {
    expect(
      formatGroupedNumber("1234.5", {
        minFractionDigits: 2,
        maxFractionDigits: 2,
        trimTrailingZeros: false,
      })
    ).toBe(`1${groupSeparator}234,50`);
  });

  it("returns null for invalid input", () => {
    expect(formatGroupedNumber("not-a-number")).toBeNull();
  });
});
