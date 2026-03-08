// @vitest-environment node

import { describe, expect, it } from "vitest";

import type { InstrumentSearchResult } from "./instrument-search";
import type { XtbImportPreviewHolding, XtbImportPreviewRow } from "./xtb-import-types";
import {
  applyInstrumentOverrideToRows,
  buildHoldingOverrideGroups,
} from "./xtb-import-holding-overrides";

const resolvedInstrument: InstrumentSearchResult = {
  id: "yahoo:PHYS",
  provider: "yahoo",
  providerKey: "PHYS",
  symbol: "PHYS",
  ticker: "PHYS",
  name: "Sprott Physical Gold Trust",
  currency: "USD",
  exchange: "NYSE MKT",
  instrumentType: "ETF",
  logoUrl: null,
};

const replacementInstrument: InstrumentSearchResult = {
  id: "yahoo:SGLN.L",
  provider: "yahoo",
  providerKey: "SGLN.L",
  symbol: "SGLN.L",
  ticker: "SGLN",
  name: "iShares Physical Gold ETC",
  currency: "GBP",
  exchange: "LSE",
  instrumentType: "ETF",
  logoUrl: null,
};

const makeRow = (
  overrides: Partial<XtbImportPreviewRow>
): XtbImportPreviewRow => ({
  previewId: "row-1",
  xtbRowId: "1",
  sourceFileName: "IKE.xlsx",
  sourceType: "Stock purchase",
  executedAtUtc: "2026-03-01T10:00:00Z",
  sourceOrder: 1,
  kind: "TRADE_BUY",
  status: "READY",
  skipReason: null,
  tradeDate: "2026-03-01",
  accountCurrency: "PLN",
  accountNumber: "51444742",
  amount: "-100",
  instrumentLabel: "Physical Gold",
  comment: null,
  quantity: "1.0000",
  price: "100",
  fee: "0",
  cashflowType: null,
  side: "BUY",
  requiresInstrument: true,
  commentTicker: null,
  instrument: resolvedInstrument,
  ...overrides,
});

describe("buildHoldingOverrideGroups", () => {
  it("groups open positions by broker identity instead of current matched instrument", () => {
    const rows = [
      makeRow({ previewId: "buy-1", quantity: "2.0000" }),
      makeRow({
        previewId: "sell-1",
        xtbRowId: "2",
        sourceOrder: 2,
        kind: "TRADE_SELL",
        side: "SELL",
        quantity: "0.5000",
        amount: "50",
      }),
    ];
    const holdings: XtbImportPreviewHolding[] = [
      {
        instrumentId: resolvedInstrument.id,
        provider: "yahoo",
        providerKey: resolvedInstrument.providerKey,
        symbol: resolvedInstrument.symbol,
        name: resolvedInstrument.name,
        currency: resolvedInstrument.currency,
        exchange: resolvedInstrument.exchange ?? null,
        logoUrl: resolvedInstrument.logoUrl ?? null,
        instrumentType: resolvedInstrument.instrumentType ?? null,
        quantity: "1.5000",
        valueBase: "250.00",
        price: "39.21",
        missingReason: null,
      },
    ];

    expect(buildHoldingOverrideGroups(rows, holdings)).toEqual([
      expect.objectContaining({
        sourceLabel: "Physical Gold",
        quantity: "1.5",
        rowCount: 2,
        instrument: resolvedInstrument,
        valuationHolding: holdings[0],
      }),
    ]);
  });
});

describe("applyInstrumentOverrideToRows", () => {
  it("rewrites every matching broker row when the user changes the holding instrument", () => {
    const rows = [
      makeRow({ previewId: "buy-1", quantity: "2.0000" }),
      makeRow({
        previewId: "buy-2",
        xtbRowId: "2",
        sourceOrder: 2,
        quantity: "0.5000",
      }),
      makeRow({
        previewId: "other",
        xtbRowId: "3",
        instrumentLabel: "PGE",
      }),
    ];

    const group = buildHoldingOverrideGroups(rows, []).find(
      (candidate) => candidate.sourceLabel === "Physical Gold"
    );
    const updated = applyInstrumentOverrideToRows(rows, group!.key, replacementInstrument);

    expect(updated[0]?.instrument).toEqual(replacementInstrument);
    expect(updated[1]?.instrument).toEqual(replacementInstrument);
    expect(updated[2]?.instrument).toEqual(resolvedInstrument);
  });
});
