import { describe, expect, it } from "vitest";

import { createPortfolioSchema } from "./create-portfolio-schema";

describe("createPortfolioSchema", () => {
  it("trims and validates name", () => {
    const parsed = createPortfolioSchema.parse({
      name: "  Nowy  ",
      baseCurrency: "PLN",
    });

    expect(parsed).toEqual({ name: "Nowy", baseCurrency: "PLN" });
  });

  it("rejects unsupported currencies", () => {
    const result = createPortfolioSchema.safeParse({
      name: "Test",
      baseCurrency: "EUR",
    });

    expect(result.success).toBe(false);
  });
});
