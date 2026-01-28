import { describe, expect, it } from "vitest";

import { resolvePortfolioSelection } from "./resolve-portfolio-selection";

describe("resolvePortfolioSelection", () => {
  it("locks selection when URL contains a valid id", () => {
    const result = resolvePortfolioSelection({
      searchParams: { portfolio: "portfolio-2" },
      portfolios: [{ id: "portfolio-1" }, { id: "portfolio-2" }],
    });

    expect(result).toEqual({
      forcedPortfolioId: "portfolio-2",
      initialPortfolioId: "portfolio-2",
    });
  });

  it("falls back to default when missing", () => {
    const result = resolvePortfolioSelection({
      searchParams: {},
      portfolios: [{ id: "default-1" }, { id: "portfolio-2" }],
    });

    expect(result).toEqual({
      forcedPortfolioId: null,
      initialPortfolioId: "default-1",
    });
  });

  it("treats all as missing", () => {
    const result = resolvePortfolioSelection({
      searchParams: { portfolio: "all" },
      portfolios: [{ id: "default-1" }],
    });

    expect(result).toEqual({
      forcedPortfolioId: null,
      initialPortfolioId: "default-1",
    });
  });

  it("ignores unknown id in URL", () => {
    const result = resolvePortfolioSelection({
      searchParams: { portfolio: "unknown" },
      portfolios: [{ id: "default-1" }],
    });

    expect(result).toEqual({
      forcedPortfolioId: null,
      initialPortfolioId: "default-1",
    });
  });

  it("throws when no portfolios exist", () => {
    expect(() =>
      resolvePortfolioSelection({ searchParams: {}, portfolios: [] })
    ).toThrow("Brak portfela dla użytkownika.");
  });
});
