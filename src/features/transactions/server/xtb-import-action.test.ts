import { describe, expect, it } from "vitest";

import { sortXtbImportRows } from "./xtb-import/sort-xtb-import-rows";

type SortableCommitRow = Readonly<{
  xtbRowId: string;
  sourceFileName: string;
  sourceType: string;
  executedAtUtc: string | null;
  accountNumber: string;
  sourceOrder: number;
  tradeDate: string;
  side: "BUY" | "SELL";
  requiresInstrument: boolean;
}>;

const baseRow = (overrides: Partial<SortableCommitRow>): SortableCommitRow => ({
  xtbRowId: "1",
  sourceFileName: "PLN_1.xlsx",
  sourceType: "Deposit",
  executedAtUtc: "2025-01-13 09:00:00",
  sourceOrder: 0,
  tradeDate: "2025-01-13",
  accountNumber: "51420076",
  side: "BUY",
  requiresInstrument: false,
  ...overrides,
});

describe("sortRowsForCommit", () => {
  it("preserves XTB intraday order before same-day withdrawals", () => {
    const rows = [
      baseRow({
        xtbRowId: "20",
        sourceType: "Withdrawal",
        executedAtUtc: "2025-01-13 12:00:00",
        sourceOrder: 1,
      }),
      baseRow({
        xtbRowId: "10",
        sourceType: "Deposit",
        executedAtUtc: "2025-01-13 08:00:00",
        sourceOrder: 0,
      }),
    ];

    const sorted = sortXtbImportRows(rows);

    expect(sorted.map((row) => row.xtbRowId)).toEqual(["10", "20"]);
  });

  it("falls back to source order when timestamps are identical", () => {
    const rows = [
      baseRow({
        xtbRowId: "2",
        executedAtUtc: "2025-01-13 09:00:00",
        sourceOrder: 1,
      }),
      baseRow({
        xtbRowId: "1",
        executedAtUtc: "2025-01-13 09:00:00",
        sourceOrder: 0,
      }),
    ];

    const sorted = sortXtbImportRows(rows);

    expect(sorted.map((row) => row.sourceOrder)).toEqual([0, 1]);
  });

  it("trusts XTB intraday time for same-day cash rows", () => {
    const rows = [
      baseRow({
        xtbRowId: "1",
        sourceType: "IKE deposit",
        executedAtUtc: "2024-12-19 08:00:00",
        sourceOrder: 0,
        tradeDate: "2024-12-19",
        side: "SELL",
        requiresInstrument: false,
      }),
      baseRow({
        xtbRowId: "2",
        sourceType: "Deposit",
        executedAtUtc: "2024-12-19 15:00:00",
        sourceOrder: 1,
        tradeDate: "2024-12-19",
        side: "BUY",
        requiresInstrument: false,
      }),
    ];

    const sorted = sortXtbImportRows(rows);

    expect(sorted.map((row) => row.xtbRowId)).toEqual(["1", "2"]);
  });

  it("trusts XTB intraday time for same-day trade rows", () => {
    const rows = [
      baseRow({
        xtbRowId: "sell",
        sourceType: "Stock sell",
        executedAtUtc: "2025-01-15 08:00:00",
        sourceOrder: 0,
        tradeDate: "2025-01-15",
        side: "SELL",
        requiresInstrument: true,
      }),
      baseRow({
        xtbRowId: "buy",
        sourceType: "Stock purchase",
        executedAtUtc: "2025-01-15 15:00:00",
        sourceOrder: 1,
        tradeDate: "2025-01-15",
        side: "BUY",
        requiresInstrument: true,
      }),
    ];

    const sorted = sortXtbImportRows(rows);

    expect(sorted.map((row) => row.xtbRowId)).toEqual(["sell", "buy"]);
  });

  it("falls back to tie-break priorities when timestamps are identical", () => {
    const rows = [
      baseRow({
        xtbRowId: "sell",
        sourceType: "Stock sell",
        executedAtUtc: "2025-01-15 09:06:46",
        sourceOrder: 1,
        tradeDate: "2025-01-15",
        side: "SELL",
        requiresInstrument: true,
      }),
      baseRow({
        xtbRowId: "buy",
        sourceType: "Stock purchase",
        executedAtUtc: "2025-01-15 09:06:46",
        sourceOrder: 0,
        tradeDate: "2025-01-15",
        side: "BUY",
        requiresInstrument: true,
      }),
    ];

    const sorted = sortXtbImportRows(rows);

    expect(sorted.map((row) => row.xtbRowId)).toEqual(["buy", "sell"]);
  });
});
