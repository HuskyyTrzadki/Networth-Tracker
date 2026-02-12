import { describe, expect, it } from "vitest";

import { parseStockChartQuery } from "./parse-stock-chart-query";

describe("parseStockChartQuery", () => {
  it("parses range and overlays from query params", () => {
    const query = parseStockChartQuery(
      new URLSearchParams("range=3y&overlays=epsTtm,revenueTtm,epsTtm")
    );

    expect(query).toEqual({
      ok: true,
      range: "3Y",
      overlays: ["epsTtm", "revenueTtm"],
    });
  });

  it("keeps backward compatibility with includePe", () => {
    const query = parseStockChartQuery(
      new URLSearchParams("range=1m&overlays=epsTtm&includePe=1")
    );

    expect(query).toEqual({
      ok: true,
      range: "1M",
      overlays: ["epsTtm", "pe"],
    });
  });

  it("accepts 10Y as a valid range", () => {
    const query = parseStockChartQuery(new URLSearchParams("range=10Y"));
    expect(query).toEqual({
      ok: true,
      range: "10Y",
      overlays: [],
    });
  });

  it("returns 400-compatible error for invalid range", () => {
    const query = parseStockChartQuery(new URLSearchParams("range=2Y"));
    expect(query).toEqual({
      ok: false,
      message: "Invalid chart range.",
    });
  });

  it("returns 400-compatible error for invalid overlays", () => {
    const query = parseStockChartQuery(
      new URLSearchParams("overlays=epsTtm,revenueTtm,magic")
    );
    expect(query).toEqual({
      ok: false,
      message: "Invalid chart overlays.",
    });
  });
});
