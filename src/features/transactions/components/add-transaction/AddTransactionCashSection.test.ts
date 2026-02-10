import { describe, expect, it } from "vitest";

import { resolveCashSettlementLabel } from "./AddTransactionCashSection";

describe("resolveCashSettlementLabel", () => {
  it("returns buy label for BUY", () => {
    expect(resolveCashSettlementLabel("BUY")).toBe("Potrąć z gotówki");
  });

  it("returns sell label for SELL", () => {
    expect(resolveCashSettlementLabel("SELL")).toBe("Dodaj do gotówki");
  });
});
