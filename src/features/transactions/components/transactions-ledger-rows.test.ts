import { describe, expect, it } from "vitest";

import type { TransactionListItem } from "../server/list-transactions";
import { toLedgerRows } from "./transactions-ledger-rows";

const createItem = (overrides: Partial<TransactionListItem>): TransactionListItem => ({
  id: "tx-1",
  tradeDate: "2026-03-01",
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
    name: "Apple",
    currency: "USD",
    region: "US",
    logoUrl: null,
    instrumentType: "EQUITY",
    customAssetType: null,
  },
  ...overrides,
});

describe("toLedgerRows", () => {
  it("keeps group order and places ASSET leg before CASH leg within a group", () => {
    const rows = toLedgerRows([
      createItem({ id: "tx-cash", groupId: "group-1", legRole: "CASH", legKey: "CASH_SETTLEMENT" }),
      createItem({ id: "tx-asset", groupId: "group-1", legRole: "ASSET", legKey: "ASSET" }),
      createItem({
        id: "tx-2",
        groupId: "group-2",
        legRole: "ASSET",
        legKey: "ASSET",
        instrument: {
          symbol: "MSFT",
          name: "Microsoft",
          currency: "USD",
          region: "US",
          logoUrl: null,
          instrumentType: "EQUITY",
          customAssetType: null,
        },
      }),
    ]);

    expect(rows.map((row) => row.rowKey)).toEqual([
      "group-1:ASSET",
      "group-1:CASH_SETTLEMENT",
      "group-2:ASSET",
    ]);
    expect(rows[0]?.hasGroupDivider).toBe(false);
    expect(rows[1]?.hasGroupDivider).toBe(true);
    expect(rows[2]?.hasGroupDivider).toBe(true);
  });
});
