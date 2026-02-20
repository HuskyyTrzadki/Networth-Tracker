import { describe, expect, it } from "vitest";

import { buildAllocationData } from "./allocation-utils";

const baseSummary = {
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: null,
  holdings: [],
} as const;

describe("buildAllocationData", () => {
  it("builds slices for valued holdings", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "600",
          weight: 0.6,
          missingReason: null,
        },
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "BBB",
          name: "BBB",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "300",
          weight: 0.3,
          missingReason: null,
        },
      ],
    };

    const result = buildAllocationData(summary);

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.label)).toEqual(["AAA", "BBB"]);
  });

  it("uses custom holding name instead of CUSTOM label", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "custom:flat",
          provider: "custom",
          symbol: "CUSTOM",
          name: "Mieszkanie Mokotow",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "600",
          weight: 0.6,
          missingReason: null,
        },
      ],
    };

    const result = buildAllocationData(summary);

    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe("Mieszkanie Mokotow");
  });

  it("groups remainder holdings into Pozostałe", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "400",
          weight: 0.4,
          missingReason: null,
        },
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "BBB",
          name: "BBB",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "250",
          weight: 0.25,
          missingReason: null,
        },
        {
          instrumentId: "c",
          provider: "yahoo",
          symbol: "CCC",
          name: "CCC",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "150",
          weight: 0.15,
          missingReason: null,
        },
        {
          instrumentId: "d",
          provider: "yahoo",
          symbol: "DDD",
          name: "DDD",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "100",
          weight: 0.1,
          missingReason: null,
        },
        {
          instrumentId: "e",
          provider: "yahoo",
          symbol: "EEE",
          name: "EEE",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "70",
          weight: 0.07,
          missingReason: null,
        },
        {
          instrumentId: "f",
          provider: "yahoo",
          symbol: "FFF",
          name: "FFF",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "30",
          weight: 0.03,
          missingReason: null,
        },
      ],
    };

    const result = buildAllocationData(summary);
    const otherRow = result.find((row) => row.label === "Pozostałe");

    expect(result).toHaveLength(5);
    expect(otherRow?.valueBase).toBe("100");
    expect(otherRow?.share).toBeCloseTo(0.1, 4);
  });

  it("merges slices below 4 percent into Pozostałe", () => {
    const summary = {
      ...baseSummary,
      holdings: [
        {
          instrumentId: "a",
          provider: "yahoo",
          symbol: "AAA",
          name: "AAA",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "680",
          weight: 0.68,
          missingReason: null,
        },
        {
          instrumentId: "b",
          provider: "yahoo",
          symbol: "BBB",
          name: "BBB",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "250",
          weight: 0.25,
          missingReason: null,
        },
        {
          instrumentId: "c",
          provider: "yahoo",
          symbol: "CCC",
          name: "CCC",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "40",
          weight: 0.04,
          missingReason: null,
        },
        {
          instrumentId: "d",
          provider: "yahoo",
          symbol: "DDD",
          name: "DDD",
          exchange: null,
          currency: "PLN",
          logoUrl: null,
          instrumentType: null,
          quantity: "1",
          price: "100",
          valueBase: "30",
          weight: 0.03,
          missingReason: null,
        },
      ],
    };

    const result = buildAllocationData(summary);
    const otherRow = result.find((row) => row.label === "Pozostałe");

    expect(result.map((row) => row.label)).toEqual(["AAA", "BBB", "CCC", "Pozostałe"]);
    expect(otherRow?.valueBase).toBe("30");
    expect(otherRow?.share).toBeCloseTo(0.03, 4);
  });
});
