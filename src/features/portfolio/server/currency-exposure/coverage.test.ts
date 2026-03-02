import { describe, expect, it } from "vitest";

import { findRevenueGeoCoverageGaps, isRevenueGeoRequiredHolding } from "./coverage";

describe("currency exposure coverage helpers", () => {
  it("requires revenue geo only for Yahoo equities", () => {
    expect(
      isRevenueGeoRequiredHolding({
        instrumentId: "aapl",
        provider: "yahoo",
        providerKey: "AAPL",
        instrumentType: "EQUITY",
      })
    ).toBe(true);

    expect(
      isRevenueGeoRequiredHolding({
        instrumentId: "eimi",
        provider: "yahoo",
        providerKey: "EIMI.L",
        instrumentType: "ETF",
      })
    ).toBe(false);
  });

  it("returns missing provider keys once and sorted", () => {
    const gaps = findRevenueGeoCoverageGaps(
      [
        {
          instrumentId: "msft",
          provider: "yahoo",
          providerKey: "MSFT",
          instrumentType: "EQUITY",
        },
        {
          instrumentId: "aapl",
          provider: "yahoo",
          providerKey: "AAPL",
          instrumentType: "EQUITY",
        },
        {
          instrumentId: "aapl-dup",
          provider: "yahoo",
          providerKey: "AAPL",
          instrumentType: "EQUITY",
        },
      ],
      new Set(["MSFT"])
    );

    expect(gaps).toEqual(["AAPL"]);
  });
});
