import { describe, expect, it } from "vitest";

import { isSellIntent, resolveTransactionIntent } from "./transaction-intent";

describe("resolveTransactionIntent", () => {
  it("maps asset trades", () => {
    expect(
      resolveTransactionIntent({ isCashInstrument: false, side: "BUY" })
    ).toBe("ASSET_BUY");
    expect(
      resolveTransactionIntent({ isCashInstrument: false, side: "SELL" })
    ).toBe("ASSET_SELL");
  });

  it("maps cash flows", () => {
    expect(
      resolveTransactionIntent({ isCashInstrument: true, side: "BUY" })
    ).toBe("CASH_DEPOSIT");
    expect(
      resolveTransactionIntent({ isCashInstrument: true, side: "SELL" })
    ).toBe("CASH_WITHDRAWAL");
  });
});

describe("isSellIntent", () => {
  it("returns true for sell-like intents", () => {
    expect(isSellIntent("ASSET_SELL")).toBe(true);
    expect(isSellIntent("CASH_WITHDRAWAL")).toBe(true);
  });

  it("returns false for buy-like intents", () => {
    expect(isSellIntent("ASSET_BUY")).toBe(false);
    expect(isSellIntent("CASH_DEPOSIT")).toBe(false);
  });
});
