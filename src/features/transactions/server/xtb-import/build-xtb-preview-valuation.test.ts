import { describe, expect, it } from "vitest";

import { buildXtbPreviewValuation } from "./build-xtb-preview-valuation";
import type { XtbImportPreviewRow } from "../../lib/xtb-import-types";

const baseTradeRow = (
  overrides: Partial<XtbImportPreviewRow>
): XtbImportPreviewRow => ({
  previewId: "preview-1",
  xtbRowId: "row-1",
  sourceFileName: "PLN_1.xlsx",
  sourceType: "Stock purchase",
  executedAtUtc: "2025-01-10 10:00:00",
  sourceOrder: 0,
  kind: "TRADE_BUY",
  status: "READY",
  skipReason: null,
  tradeDate: "2025-01-10",
  accountCurrency: "PLN",
  accountNumber: "51420076",
  amount: "-300",
  instrumentLabel: "CD Projekt",
  comment: null,
  quantity: "3",
  price: "100",
  fee: "0",
  cashflowType: null,
  side: "BUY",
  requiresInstrument: true,
  commentTicker: "CDR.WA",
  instrument: {
    id: "yahoo:CDR.WA",
    provider: "yahoo",
    providerKey: "CDR.WA",
    symbol: "CDR.WA",
    ticker: "CDR.WA",
    name: "CD Projekt",
    currency: "PLN",
    instrumentType: "EQUITY",
    exchange: "WSE",
    region: "PL",
    logoUrl: null,
  },
  ...overrides,
});

describe("buildXtbPreviewValuation", () => {
  it("builds a deterministic holdings summary without live valuation", async () => {
    const result = await buildXtbPreviewValuation({} as never, [
      {
        ...baseTradeRow({ amount: "-300", quantity: "3", side: "BUY" }),
      },
      {
        ...baseTradeRow({
          previewId: "preview-2",
          xtbRowId: "row-2",
          sourceType: "Stock sell",
          kind: "TRADE_SELL",
          amount: "100",
          quantity: "1",
          side: "SELL",
        }),
      },
      {
        ...baseTradeRow({
          previewId: "preview-3",
          xtbRowId: "row-3",
          sourceType: "Deposit",
          kind: "CASH_DEPOSIT",
          amount: "150",
          quantity: "150",
          price: "1",
          requiresInstrument: false,
          instrument: null,
          instrumentLabel: null,
          commentTicker: null,
          cashflowType: "DEPOSIT",
          side: "BUY",
        }),
      },
    ], "PLN");

    expect(result.totalValueBase).toBeNull();
    expect(result.holdingsCount).toBe(1);
    expect(result.cashValueBase).toBe("-50");
    expect(result.holdings).toEqual([
      expect.objectContaining({
        symbol: "CDR.WA",
        quantity: "2",
        valueBase: null,
        price: null,
      }),
    ]);
  });
});
