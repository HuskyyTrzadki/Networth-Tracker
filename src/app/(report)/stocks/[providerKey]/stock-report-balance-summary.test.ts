import { describe, expect, it } from "vitest";

import { buildBalanceNarrative } from "./stock-report-balance-summary";

describe("buildBalanceNarrative", () => {
  it("returns low risk when cash fully covers debt", () => {
    const result = buildBalanceNarrative({
      assetsTotal: 200,
      liquidAssets: 80,
      debt: 60,
      equity: 120,
      debtToEquity: 0.5,
      debtToAssets: 0.3,
      netDebt: -20,
    });

    expect(result.risk).toBe("Niskie");
    expect(result.summary).toContain("Gotowka pokrywa caly dlug");
  });

  it("returns elevated risk for high leverage", () => {
    const result = buildBalanceNarrative({
      assetsTotal: 200,
      liquidAssets: 10,
      debt: 100,
      equity: 50,
      debtToEquity: 2,
      debtToAssets: 0.5,
      netDebt: 90,
    });

    expect(result.risk).toBe("Podwyzszone");
  });

  it("returns moderate risk for balanced leverage", () => {
    const result = buildBalanceNarrative({
      assetsTotal: 200,
      liquidAssets: 40,
      debt: 70,
      equity: 120,
      debtToEquity: 0.58,
      debtToAssets: 0.35,
      netDebt: 30,
    });

    expect(result.risk).toBe("Umiarkowane");
  });
});

