import { describe, expect, it } from "vitest";

import { buildSettlementLegs } from "./settlement";

describe("buildSettlementLegs", () => {
  it("creates a SELL cash leg for BUY trades", () => {
    const legs = buildSettlementLegs({
      type: "BUY",
      quantity: "1",
      price: "100",
      fee: "1",
      assetCurrency: "USD",
      cashCurrency: "USD",
    });

    expect(legs).toHaveLength(1);
    expect(legs[0]).toMatchObject({
      side: "SELL",
      quantity: "101",
      cashflowType: "TRADE_SETTLEMENT",
      legKey: "CASH_SETTLEMENT",
    });
  });

  it("handles fee bigger than proceeds without error", () => {
    const legs = buildSettlementLegs({
      type: "SELL",
      quantity: "1",
      price: "10",
      fee: "25",
      assetCurrency: "USD",
      cashCurrency: "USD",
    });

    expect(legs).toHaveLength(1);
    expect(legs[0]).toMatchObject({
      side: "SELL",
      quantity: "15",
      cashflowType: "TRADE_SETTLEMENT",
    });
  });

  it("applies FX when cash currency differs", () => {
    const legs = buildSettlementLegs({
      type: "BUY",
      quantity: "2",
      price: "10",
      fee: "0",
      assetCurrency: "USD",
      cashCurrency: "PLN",
      fx: { rate: "4", asOf: "2026-02-01T10:00:00Z", provider: "yahoo" },
    });

    expect(legs[0]).toMatchObject({
      side: "SELL",
      quantity: "80",
      cashflowType: "TRADE_SETTLEMENT",
    });
    expect(legs[0].settlementFx).toBeDefined();
  });

  it("adds a separate FX fee leg", () => {
    const legs = buildSettlementLegs({
      type: "BUY",
      quantity: "1",
      price: "100",
      fee: "0",
      assetCurrency: "USD",
      cashCurrency: "USD",
      fxFee: "2",
    });

    expect(legs).toHaveLength(2);
    expect(legs[1]).toMatchObject({
      side: "SELL",
      quantity: "2",
      cashflowType: "FEE",
      legKey: "CASH_FX_FEE",
    });
  });
});
