import { describe, expect, it } from "vitest";

import { canEditTransactionRow } from "./TransactionsRowActions";
import type { TransactionListItem } from "../server/list-transactions";

const createBaseRow = (): TransactionListItem => ({
  id: "tx-1",
  tradeDate: "2026-02-21",
  side: "BUY",
  quantity: "1",
  price: "100",
  fee: "0",
  groupId: "group-1",
  legRole: "ASSET",
  legKey: "ASSET",
  cashflowType: null,
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
    instrumentType: "EQUITY",
    logoUrl: null,
  },
});

describe("canEditTransactionRow", () => {
  it("allows edit for ASSET leg", () => {
    expect(canEditTransactionRow(createBaseRow())).toBe(true);
  });

  it("hides edit for CASH legs", () => {
    expect(
      canEditTransactionRow({
        ...createBaseRow(),
        id: "tx-cash",
        legRole: "CASH",
        legKey: "CASH_SETTLEMENT",
      })
    ).toBe(false);
  });
});
