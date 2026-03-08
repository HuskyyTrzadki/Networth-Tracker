import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";

import type { InstrumentSearchResult } from "./instrument-search";
import type {
  XtbImportPreviewHolding,
  XtbImportPreviewRow,
} from "./xtb-import-types";

export type XtbImportHoldingOverrideGroup = Readonly<{
  key: string;
  accountNumber: string;
  accountCurrency: string;
  sourceLabel: string;
  sourceTickerHint: string | null;
  quantity: string;
  rowCount: number;
  instrument: InstrumentSearchResult | null;
  valuationHolding: XtbImportPreviewHolding | null;
  needsInstrument: boolean;
}>;

const normalizeLabel = (value: string | null | undefined) => value?.trim() ?? "";

const buildGroupKey = (row: Readonly<{
  accountNumber: string;
  accountCurrency: string;
  instrumentLabel: string | null;
  commentTicker: string | null;
}>) =>
  [
    row.accountNumber,
    row.accountCurrency,
    normalizeLabel(row.instrumentLabel),
    row.commentTicker?.trim() ?? "",
  ].join("::");

const formatQuantity = (value: ReturnType<typeof decimalZero>) =>
  value
    .toFixed(4)
    .replace(/\.?0+$/u, "");

export const buildHoldingOverrideGroups = (
  rows: readonly XtbImportPreviewRow[],
  holdings: readonly XtbImportPreviewHolding[]
): XtbImportHoldingOverrideGroup[] => {
  const holdingByInstrumentId = new Map(
    holdings.map((holding) => [holding.instrumentId, holding] as const)
  );
  const grouped = new Map<
    string,
    {
      sampleRow: XtbImportPreviewRow;
      quantity: ReturnType<typeof decimalZero>;
      rowCount: number;
      instrument: InstrumentSearchResult | null;
      needsInstrument: boolean;
    }
  >();

  for (const row of rows) {
    if (!row.requiresInstrument) {
      continue;
    }

    const groupKey = buildGroupKey(row);
    const quantity = parseDecimalString(row.quantity) ?? decimalZero();
    const signedQuantity = row.side === "SELL" ? quantity.times(-1) : quantity;
    const existing = grouped.get(groupKey);

    if (!existing) {
      grouped.set(groupKey, {
        sampleRow: row,
        quantity: signedQuantity,
        rowCount: 1,
        instrument: row.instrument,
        needsInstrument: row.status === "NEEDS_INSTRUMENT",
      });
      continue;
    }

    grouped.set(groupKey, {
      sampleRow: existing.sampleRow,
      quantity: addDecimals(existing.quantity, signedQuantity),
      rowCount: existing.rowCount + 1,
      instrument: row.instrument ?? existing.instrument,
      needsInstrument: existing.needsInstrument || row.status === "NEEDS_INSTRUMENT",
    });
  }

  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      key,
      accountNumber: value.sampleRow.accountNumber,
      accountCurrency: value.sampleRow.accountCurrency,
      sourceLabel:
        value.sampleRow.instrumentLabel?.trim() ||
        value.sampleRow.commentTicker?.trim() ||
        "Nieznany instrument",
      sourceTickerHint: value.sampleRow.commentTicker?.trim() || null,
      quantity: formatQuantity(value.quantity),
      rowCount: value.rowCount,
      instrument: value.instrument,
      valuationHolding: value.instrument
        ? holdingByInstrumentId.get(value.instrument.id) ?? null
        : null,
      needsInstrument: value.needsInstrument,
    }))
    .filter((group) => {
      const quantity = parseDecimalString(group.quantity);
      return quantity ? quantity.gt(0) : false;
    })
    .sort((left, right) => {
      const leftValue = parseDecimalString(left.valuationHolding?.valueBase);
      const rightValue = parseDecimalString(right.valuationHolding?.valueBase);

      if (leftValue && rightValue && !leftValue.eq(rightValue)) {
        return rightValue.cmp(leftValue);
      }

      if (left.needsInstrument !== right.needsInstrument) {
        return left.needsInstrument ? -1 : 1;
      }

      return left.sourceLabel.localeCompare(right.sourceLabel, "pl");
    });
};

export const applyInstrumentOverrideToRows = (
  rows: readonly XtbImportPreviewRow[],
  groupKey: string,
  instrument: InstrumentSearchResult
) =>
  rows.map((row) =>
    buildGroupKey(row) === groupKey
      ? { ...row, instrument, status: "READY" as const }
      : row
  );

export const __test__ = {
  buildGroupKey,
};
