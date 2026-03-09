// @vitest-environment node

import { describe, expect, it } from "vitest";

import { buildXtbSettlementOverride } from "./shared";

describe("buildXtbSettlementOverride", () => {
  it("uses broker cash amount as exact settlement for cross-currency trades", () => {
    const result = buildXtbSettlementOverride({
      provider: "xtb",
      previewId: "preview-1",
      xtbRowId: "777157575",
      sourceFileName: "PLN_51420076_2006-01-01_2026-03-06.xlsx",
      sourceType: "Stock purchase",
      executedAtUtc: "2025-04-09 19:36:14",
      sourceOrder: 0,
      kind: "TRADE_BUY",
      status: "READY",
      tradeDate: "2025-04-09",
      accountCurrency: "PLN",
      accountNumber: "51420076",
      amount: "-499.68",
      instrumentLabel: "Alphabet",
      comment: "OPEN BUY 0.8155 @ 157.58",
      quantity: "0.8155",
      price: "157.58",
      fee: "0",
      cashflowType: null,
      side: "BUY",
      requiresInstrument: true,
      commentTicker: "GOOGL",
      instrument: {
        id: "yahoo:GOOGL",
        provider: "yahoo",
        providerKey: "GOOGL",
        symbol: "GOOGL",
        ticker: "GOOGL",
        name: "Alphabet",
        currency: "USD",
        instrumentType: "EQUITY",
        exchange: "NASDAQ",
        region: "US",
        logoUrl: null,
      },
    });

    expect(result).toEqual({
      cashQuantity: "499.68",
      fx: {
        rate: "3.88836393",
        asOf: "2025-04-09",
        provider: "xtb",
      },
    });
  });
});
