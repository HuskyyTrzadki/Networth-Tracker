import type { CashflowType } from "./cashflow-types";
import type { InstrumentSearchResult } from "./instrument-search";
import type { BrokerImportProviderId } from "./broker-import-providers";
import type { CashCurrency } from "./system-currencies";

export type BrokerImportRowKind =
  | "TRADE_BUY"
  | "TRADE_SELL"
  | "CASH_DEPOSIT"
  | "CASH_WITHDRAWAL"
  | "DIVIDEND"
  | "INTEREST"
  | "TAX";

export type BrokerImportStatus = "READY" | "NEEDS_INSTRUMENT" | "SKIPPED";

export type BrokerImportPreviewRow = Readonly<{
  provider: BrokerImportProviderId;
  previewId: string;
  xtbRowId: string;
  sourceFileName: string;
  sourceType: string;
  executedAtUtc: string | null;
  sourceOrder: number;
  kind: BrokerImportRowKind;
  status: BrokerImportStatus;
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

export type BrokerImportSkippedRow = Readonly<{
  previewId: string;
  xtbRowId: string;
  sourceFileName: string;
  sourceType: string;
  tradeDate: string | null;
  amount: string | null;
  instrumentLabel: string | null;
  reason: string;
}>;

export type BrokerImportPreviewFile = Readonly<{
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

export type BrokerImportPreviewSummary = Readonly<{
  fileCount: number;
  parsedRows: number;
  readyRows: number;
  unresolvedRows: number;
  skippedRows: number;
}>;

export type BrokerImportPreviewValuation = Readonly<{
  baseCurrency: string;
  totalValueBase: string | null;
  cashValueBase: string | null;
  holdingsCount: number;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
  holdings: readonly BrokerImportPreviewHolding[];
}>;

export type BrokerImportPreviewHolding = Readonly<{
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

export type BrokerImportPreviewResponse = Readonly<{
  provider: BrokerImportProviderId;
  files: readonly BrokerImportPreviewFile[];
  rows: readonly BrokerImportPreviewRow[];
  skippedRows: readonly BrokerImportSkippedRow[];
  summary: BrokerImportPreviewSummary;
  valuation: BrokerImportPreviewValuation;
}>;

export type BrokerImportRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "blocked";

export type BrokerImportRunRowStatus = "pending" | "done" | "failed" | "blocked";

export type BrokerImportRunRowIssue = Readonly<{
  id: string;
  rowIndex: number;
  sourceFileName: string;
  xtbRowId: string;
  sourceType: string;
  tradeDate: string;
  status: BrokerImportRunRowStatus;
  errorMessage: string | null;
}>;

export type BrokerImportRunSummary = Readonly<{
  id: string;
  provider: BrokerImportProviderId;
  portfolioId: string;
  status: BrokerImportRunStatus;
  totalRows: number;
  completedRows: number;
  dedupedRows: number;
  failedRows: number;
  blockedRows: number;
  message: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
  blockingRows: readonly BrokerImportRunRowIssue[];
}>;

export type CreateBrokerImportJobResponse = Readonly<{
  run: BrokerImportRunSummary;
}>;
