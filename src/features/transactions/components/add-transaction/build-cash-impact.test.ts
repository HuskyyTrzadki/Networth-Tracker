import { describe, expect, it } from "vitest";

import { buildCashImpact } from "./build-cash-impact";

describe("buildCashImpact", () => {
  it("returns negative cash delta for BUY", () => {
    const result = buildCashImpact({
      type: "BUY",
      quantity: "2",
      price: "100",
      fee: "1",
      fxFee: "0",
      assetCurrency: "USD",
      cashCurrency: "USD",
    });

    expect(result?.delta).toBe("-201");
  });

  it("returns positive cash delta for SELL", () => {
    const result = buildCashImpact({
      type: "SELL",
      quantity: "2",
      price: "100",
      fee: "1",
      fxFee: "0",
      assetCurrency: "USD",
      cashCurrency: "USD",
    });

    expect(result?.delta).toBe("199");
  });

  it("applies FX conversion and fxFee", () => {
    const result = buildCashImpact({
      type: "BUY",
      quantity: "1",
      price: "10",
      fee: "0",
      fxFee: "2",
      assetCurrency: "USD",
      cashCurrency: "PLN",
      fxRate: "4",
    });

    expect(result?.delta).toBe("-42");
  });

  it("returns null for FX mismatch without fxRate", () => {
    const result = buildCashImpact({
      type: "BUY",
      quantity: "1",
      price: "10",
      fee: "0",
      fxFee: "0",
      assetCurrency: "USD",
      cashCurrency: "PLN",
    });

    expect(result).toBeNull();
  });
});
