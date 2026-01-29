import { describe, expect, it } from "vitest";

import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

describe("formatCurrencyString", () => {
  it("returns null for invalid decimal input", () => {
    const formatter = getCurrencyFormatter("PLN");

    expect(formatter).not.toBeNull();
    expect(formatCurrencyString("not-a-number", formatter!)).toBeNull();
  });

  it("returns null for invalid currency codes", () => {
    expect(getCurrencyFormatter("PL")).toBeNull();
  });

  it("formats a numeric string using the provided formatter", () => {
    const formatter = getCurrencyFormatter("PLN");
    const formatted = formatCurrencyString("1200.5", formatter!);

    expect(formatted).not.toBeNull();
    expect(formatted).toMatch(/1/);
  });
});
