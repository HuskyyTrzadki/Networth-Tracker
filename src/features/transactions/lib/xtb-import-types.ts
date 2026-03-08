import type { CashflowType } from "./cashflow-types";
import type { InstrumentSearchResult } from "./instrument-search";
import type { CashCurrency } from "./system-currencies";

export type XtbImportRowKind =
  | "TRADE_BUY"
  | "TRADE_SELL"
  | "CASH_DEPOSIT"
  | "CASH_WITHDRAWAL"
  | "DIVIDEND"
  | "INTEREST"
  | "TAX";

export type XtbImportStatus = "READY" | "NEEDS_INSTRUMENT" | "SKIPPED";

export type XtbImportPreviewRow = Readonly<{
  previewId: string;
  xtbRowId: string;
  sourceFileName: string;
  sourceType: string;
  executedAtUtc: string | null;
  sourceOrder: number;
  kind: XtbImportRowKind;
  status: XtbImportStatus;
  skipReason: string | null;
  tradeDate: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  amount: string;
  instrumentLabel: string | null;
  comment: string | null;
  quantity: string;
  price: string;
  fee: string;
  cashflowType: CashflowType | null;
  side: "BUY" | "SELL";
  requiresInstrument: boolean;
  commentTicker: string | null;
  instrument: InstrumentSearchResult | null;
}>;

export type XtbImportSkippedRow = Readonly<{
  previewId: string;
  xtbRowId: string;
  sourceFileName: string;
  sourceType: string;
  tradeDate: string | null;
  amount: string | null;
  instrumentLabel: string | null;
  reason: string;
}>;

export type XtbImportPreviewFile = Readonly<{
  fileName: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  dateFromUtc: string | null;
  dateToUtc: string | null;
  parsedRows: number;
  readyRows: number;
  unresolvedRows: number;
  skippedRows: number;
}>;

export type XtbImportPreviewSummary = Readonly<{
  fileCount: number;
  parsedRows: number;
  readyRows: number;
  unresolvedRows: number;
  skippedRows: number;
}>;

export type XtbImportPreviewValuation = Readonly<{
  baseCurrency: string;
  totalValueBase: string | null;
  cashValueBase: string | null;
  holdingsCount: number;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
  holdings: readonly XtbImportPreviewHolding[];
}>;

export type XtbImportPreviewHolding = Readonly<{
  instrumentId: string;
  provider: string;
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  logoUrl: string | null;
  instrumentType: string | null;
  quantity: string;
  valueBase: string | null;
  price: string | null;
  missingReason: "MISSING_QUOTE" | "MISSING_FX" | null;
}>;

export type XtbImportPreviewResponse = Readonly<{
  files: readonly XtbImportPreviewFile[];
  rows: readonly XtbImportPreviewRow[];
  skippedRows: readonly XtbImportSkippedRow[];
  summary: XtbImportPreviewSummary;
  valuation: XtbImportPreviewValuation;
}>;

export type XtbImportRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "blocked";

export type XtbImportRunRowStatus = "pending" | "done" | "failed" | "blocked";

export type XtbImportRunRowIssue = Readonly<{
  id: string;
  rowIndex: number;
  sourceFileName: string;
  xtbRowId: string;
  sourceType: string;
  tradeDate: string;
  status: XtbImportRunRowStatus;
  errorMessage: string | null;
}>;

export type XtbImportRunSummary = Readonly<{
  id: string;
  portfolioId: string;
  status: XtbImportRunStatus;
  totalRows: number;
  completedRows: number;
  dedupedRows: number;
  failedRows: number;
  blockedRows: number;
  message: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
  blockingRows: readonly XtbImportRunRowIssue[];
}>;

export type CreateXtbImportJobResponse = Readonly<{
  run: XtbImportRunSummary;
}>;
