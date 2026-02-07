import { describe, expect, it } from "vitest";

import { formatSuggestedPriceForInput } from "./price-format";

describe("formatSuggestedPriceForInput", () => {
  it("formats numeric values to two decimals", () => {
    expect(formatSuggestedPriceForInput("24.770000457763672")).toBe("24.77");
    expect(formatSuggestedPriceForInput("24")).toBe("24.00");
  });

  it("returns original value for non-numeric input", () => {
    expect(formatSuggestedPriceForInput("not-a-number")).toBe("not-a-number");
  });
});

