import { describe, expect, it } from "vitest";

import { formatNumericInput, formatNumericInputWithCursor } from "./format-numeric-input";

describe("formatNumericInput", () => {
  it("adds thousand separators for integer values", () => {
    expect(formatNumericInput("20000")).toBe("20 000");
    expect(formatNumericInput("33333333")).toBe("33 333 333");
  });

  it("preserves decimal part and normalizes dot to comma", () => {
    expect(formatNumericInput("12345.67")).toBe("12 345,67");
    expect(formatNumericInput("1000,5")).toBe("1 000,5");
  });

  it("respects max fraction digits when configured", () => {
    expect(formatNumericInput("5,123456", { maxFractionDigits: 4 })).toBe("5,1234");
  });

  it("keeps cursor close to typed integer position after grouping", () => {
    const next = formatNumericInputWithCursor("12345", 5);
    expect(next.value).toBe("12 345");
    expect(next.cursor).toBe(6);
  });

  it("keeps cursor in fraction part when editing decimals", () => {
    const next = formatNumericInputWithCursor("12345,67", 8);
    expect(next.value).toBe("12 345,67");
    expect(next.cursor).toBe(9);
  });
});
