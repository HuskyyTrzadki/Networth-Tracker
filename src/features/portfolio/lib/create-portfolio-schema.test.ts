import { describe, expect, it } from "vitest";

import { createPortfolioSchema } from "./create-portfolio-schema";

describe("createPortfolioSchema", () => {
  it("trims and validates name", () => {
    const parsed = createPortfolioSchema.parse({
      name: "  Nowy  ",
      baseCurrency: "PLN",
      isTaxAdvantaged: false,
    });

    expect(parsed).toEqual({
      name: "Nowy",
      baseCurrency: "PLN",
      isTaxAdvantaged: false,
    });
  });

  it("rejects unsupported currencies", () => {
    const result = createPortfolioSchema.safeParse({
      name: "Test",
      baseCurrency: "EUR",
      isTaxAdvantaged: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts tax-advantaged toggle", () => {
    const parsed = createPortfolioSchema.parse({
      name: "IKE",
      baseCurrency: "USD",
      isTaxAdvantaged: true,
    });

    expect(parsed.isTaxAdvantaged).toBe(true);
  });
});
