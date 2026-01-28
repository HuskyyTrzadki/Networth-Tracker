import { describe, expect, it } from "vitest";

import { parseTransactionsFilters } from "./filters";

describe("parseTransactionsFilters", () => {
  it("returns defaults for empty params", () => {
    const filters = parseTransactionsFilters({});

    expect(filters).toEqual({
      query: null,
      type: null,
      sort: "date_desc",
      page: 1,
      pageSize: 20,
      portfolioId: null,
    });
  });

  it("normalizes query, type, sort, and page", () => {
    const filters = parseTransactionsFilters({
      q: "  AAPL  ",
      type: "sell",
      sort: "date_asc",
      page: "3",
    });

    expect(filters).toEqual({
      query: "AAPL",
      type: "SELL",
      sort: "date_asc",
      page: 3,
      pageSize: 20,
      portfolioId: null,
    });
  });

  it("falls back when params are invalid", () => {
    const filters = parseTransactionsFilters({
      q: "   ",
      type: "other",
      sort: "unknown",
      page: "-2",
    });

    expect(filters).toEqual({
      query: null,
      type: null,
      sort: "date_desc",
      page: 1,
      pageSize: 20,
      portfolioId: null,
    });
  });

  it("handles array params by taking the first value", () => {
    const filters = parseTransactionsFilters({
      q: ["BTC", "ETH"],
      type: ["BUY", "SELL"],
      sort: ["date_asc"],
      page: ["2", "3"],
    });

    expect(filters).toEqual({
      query: "BTC",
      type: "BUY",
      sort: "date_asc",
      page: 2,
      pageSize: 20,
      portfolioId: null,
    });
  });

  it("parses portfolio selection", () => {
    const filters = parseTransactionsFilters({
      portfolio: "portfolio-123",
    });

    expect(filters.portfolioId).toBe("portfolio-123");
  });

  it("treats all as a missing portfolio filter", () => {
    const filters = parseTransactionsFilters({
      portfolio: "all",
    });

    expect(filters.portfolioId).toBeNull();
  });
});
