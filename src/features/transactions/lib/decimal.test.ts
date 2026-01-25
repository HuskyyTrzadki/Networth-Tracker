import { describe, expect, it } from "vitest";

import {
  addDecimals,
  multiplyDecimals,
  parseDecimalString,
  toFixedDecimalString,
} from "./decimal";

describe("parseDecimalString", () => {
  it("parses comma decimals and spaces", () => {
    const parsed = parseDecimalString("1 234,50");
    expect(parsed?.toFixed(2)).toBe("1234.50");
  });

  it("returns null for invalid input", () => {
    expect(parseDecimalString("abc")).toBeNull();
  });

  it("accepts number input for server payloads", () => {
    const parsed = parseDecimalString(12.5);
    expect(parsed?.toFixed(1)).toBe("12.5");
  });
});

describe("decimal math", () => {
  it("multiplies decimals without float drift", () => {
    const quantity = parseDecimalString("1,5");
    const price = parseDecimalString("10");

    if (!quantity || !price) throw new Error("Invalid test data.");

    const value = multiplyDecimals(quantity, price);
    expect(toFixedDecimalString(value, 2)).toBe("15.00");
  });

  it("adds decimals with aligned scale", () => {
    const first = parseDecimalString("1,25");
    const second = parseDecimalString("0,3");

    if (!first || !second) throw new Error("Invalid test data.");

    const total = addDecimals(first, second);
    expect(toFixedDecimalString(total, 2)).toBe("1.55");
  });

  it("rounds half up at target scale", () => {
    const value = parseDecimalString("1,005");
    if (!value) throw new Error("Invalid test data.");

    expect(toFixedDecimalString(value, 2)).toBe("1.01");
  });
});
