import type { TransactionType } from "../lib/add-transaction-form-schema";

export type TransactionIntent =
  | "ASSET_BUY"
  | "ASSET_SELL"
  | "CASH_DEPOSIT"
  | "CASH_WITHDRAWAL";

export const resolveTransactionIntent = (input: Readonly<{
  isCashInstrument: boolean;
  side: TransactionType;
}>): TransactionIntent => {
  if (input.isCashInstrument) {
    return input.side === "BUY" ? "CASH_DEPOSIT" : "CASH_WITHDRAWAL";
  }

  return input.side === "BUY" ? "ASSET_BUY" : "ASSET_SELL";
};

export const isSellIntent = (intent: TransactionIntent) =>
  intent === "ASSET_SELL" || intent === "CASH_WITHDRAWAL";
