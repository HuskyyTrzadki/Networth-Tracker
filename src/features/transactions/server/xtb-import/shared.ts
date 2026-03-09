import { createHash } from "node:crypto";
import { divideDecimals, multiplyDecimals, parseDecimalString } from "@/lib/decimal";
import {
  brokerImportInstrumentSchema,
  brokerImportPreviewRowSchema,
  brokerImportReadyRowSchema,
  type BrokerImportPreviewRowInput,
  type BrokerImportReadyRow,
} from "../broker-import/shared";

export const xtbImportInstrumentSchema = brokerImportInstrumentSchema;
export const xtbImportReadyRowSchema = brokerImportReadyRowSchema;
export const xtbImportPreviewRowSchema = brokerImportPreviewRowSchema;

export type XtbImportReadyRow = BrokerImportReadyRow;
export type XtbImportPreviewRowInput = BrokerImportPreviewRowInput;

export type XtbImportSettlementOverride = Readonly<{
  cashQuantity: string;
  fx?: Readonly<{
    rate: string;
    asOf: string;
    provider: string;
  }> | null;
}>;

export const buildXtbSettlementOverride = (
  row: XtbImportReadyRow
): XtbImportSettlementOverride | null => {
  if (!row.requiresInstrument || !row.instrument) {
    return null;
  }

  const cashQuantity = parseDecimalString(row.amount)?.abs();
  if (!cashQuantity || cashQuantity.lte(0)) {
    return null;
  }

  const assetCurrency = row.instrument.currency.trim().toUpperCase();
  if (assetCurrency === row.accountCurrency) {
    return {
      cashQuantity: cashQuantity.toString(),
    };
  }

  const quantity = parseDecimalString(row.quantity);
  const price = parseDecimalString(row.price);
  if (!quantity || !price || quantity.lte(0) || price.lt(0)) {
    return {
      cashQuantity: cashQuantity.toString(),
    };
  }

  const gross = multiplyDecimals(quantity, price);
  if (gross.lte(0)) {
    return {
      cashQuantity: cashQuantity.toString(),
    };
  }

  return {
    cashQuantity: cashQuantity.toString(),
    fx: {
      rate: divideDecimals(cashQuantity, gross).toString(),
      asOf: row.tradeDate,
      provider: "xtb",
    },
  };
};

export const buildXtbImportNotes = (row: XtbImportReadyRow) =>
  [
    `Import XTB: ${row.sourceType}`,
    row.instrumentLabel ? `instrument ${row.instrumentLabel}` : null,
    `plik ${row.sourceFileName}`,
    `wiersz ${row.xtbRowId}`,
  ]
    .filter(Boolean)
    .join(" • ");

export const buildXtbImportRowDebugLabel = (row: XtbImportReadyRow) =>
  `${row.sourceType} • ${row.sourceFileName} • wiersz ${row.xtbRowId}`;

export const toDeterministicImportRequestId = (row: XtbImportReadyRow) => {
  const digest = createHash("sha256")
    .update(
      [
        "xtb",
        row.accountNumber,
        row.accountCurrency,
        row.xtbRowId,
        row.kind,
      ].join(":")
    )
    .digest("hex");
  const chars = digest.slice(0, 32).split("");
  chars[12] = "4";
  const variant = parseInt(chars[16], 16);
  chars[16] = ((variant & 0x3) | 0x8).toString(16);
  const hex = chars.join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

export const resolveUnknownImportErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => (error instanceof Error ? error.message : fallbackMessage);
