import type { XtbImportPreviewRow } from "../../lib/xtb-import-types";

type SortableXtbImportRow = Pick<
  XtbImportPreviewRow,
  | "xtbRowId"
  | "sourceFileName"
  | "executedAtUtc"
  | "accountNumber"
  | "sourceOrder"
  | "tradeDate"
  | "side"
  | "requiresInstrument"
>;

const compareNullableText = (left: string | null, right: string | null) => {
  if (left === right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left.localeCompare(right);
};

const getTieBreakPriority = (
  row: Readonly<{
    side?: "BUY" | "SELL";
    requiresInstrument?: boolean;
  }>
) => {
  if (row.side === "BUY") {
    return row.requiresInstrument ? 1 : 0;
  }

  if (row.side === "SELL") {
    return row.requiresInstrument ? 2 : 3;
  }

  return 4;
};

export const sortXtbImportRows = <TRow extends SortableXtbImportRow>(rows: readonly TRow[]) =>
  [...rows].sort((left, right) => {
    const dateDiff = left.tradeDate.localeCompare(right.tradeDate);
    if (dateDiff !== 0) {
      return dateDiff;
    }

    const executedAtDiff = compareNullableText(left.executedAtUtc, right.executedAtUtc);
    if (executedAtDiff !== 0) {
      return executedAtDiff;
    }

    const priorityDiff = getTieBreakPriority(left) - getTieBreakPriority(right);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const fileDiff = left.sourceFileName.localeCompare(right.sourceFileName);
    if (fileDiff !== 0) {
      return fileDiff;
    }

    const accountDiff = left.accountNumber.localeCompare(right.accountNumber);
    if (accountDiff !== 0) {
      return accountDiff;
    }

    const orderDiff = left.sourceOrder - right.sourceOrder;
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return left.xtbRowId.localeCompare(right.xtbRowId);
  });
