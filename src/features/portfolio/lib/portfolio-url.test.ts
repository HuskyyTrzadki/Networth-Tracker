import { describe, expect, it } from "vitest";

import { buildPortfolioUrl } from "./portfolio-url";

describe("buildPortfolioUrl", () => {
  it("adds portfolio param when provided", () => {
    const result = buildPortfolioUrl({
      pathname: "/portfolio",
      searchParamsString: "q=abc",
      nextPortfolioId: "portfolio-1",
      resetPageParam: false,
    });

    expect(result).toBe("/portfolio/portfolio-1?q=abc");
  });

  it("removes portfolio param when null", () => {
    const result = buildPortfolioUrl({
      pathname: "/portfolio",
      searchParamsString: "portfolio=old",
      nextPortfolioId: null,
      resetPageParam: false,
    });

    expect(result).toBe("/portfolio");
  });

  it("keeps canonical detail route when already scoped", () => {
    const result = buildPortfolioUrl({
      pathname: "/portfolio/old-id",
      searchParamsString: "q=abc",
      nextPortfolioId: "new-id",
      resetPageParam: false,
    });

    expect(result).toBe("/portfolio/new-id?q=abc");
  });

  it("resets page when requested", () => {
    const result = buildPortfolioUrl({
      pathname: "/transactions",
      searchParamsString: "q=abc&page=4",
      nextPortfolioId: "portfolio-2",
      resetPageParam: true,
    });

    expect(result).toBe("/transactions?q=abc&page=1&portfolio=portfolio-2");
  });

  it("clears page when reset is false", () => {
    const result = buildPortfolioUrl({
      pathname: "/transactions",
      searchParamsString: "q=abc&page=2",
      nextPortfolioId: null,
      resetPageParam: false,
    });

    expect(result).toBe("/transactions?q=abc");
  });

  it("preserves unrelated params", () => {
    const result = buildPortfolioUrl({
      pathname: "/transactions",
      searchParamsString: "q=abc&sort=date_desc",
      nextPortfolioId: "portfolio-3",
      resetPageParam: false,
    });

    expect(result).toBe("/transactions?q=abc&sort=date_desc&portfolio=portfolio-3");
  });
});
