import type { SupabaseServerClient } from "../search/search-types";
import { searchInstruments } from "../search-instruments";
import {
  getExchangePriority,
  normalizeExchangeLabel,
} from "../search/search-utils";
import type {
  XtbImportPreviewFile,
  XtbImportPreviewResponse,
  XtbImportPreviewRow,
} from "../../lib/xtb-import-types";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import { buildXtbPreviewValuation } from "./build-xtb-preview-valuation";
import { parseXtbWorkbookFile } from "./parse-xtb-workbook";

const logPreviewEvent = (
  event: string,
  details: Readonly<Record<string, number | string>>
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.info(`[xtb-import][preview] ${event}`, details);
};

const normalizeSearchText = (value: string | null | undefined) =>
  (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const normalizeCompanyName = (value: string | null | undefined) =>
  normalizeSearchText(value)
    .replace(/SPOLKAAKCYJNA$/g, "")
    .replace(/SA$/g, "")
    .replace(/INC$/g, "")
    .replace(/LTD$/g, "")
    .replace(/PLC$/g, "");

const toResolutionCacheKey = (input: Readonly<{
  instrumentLabel: string | null;
  commentTicker: string | null;
  accountCurrency: string;
}>) =>
  `${input.accountCurrency}::${input.commentTicker ?? ""}::${input.instrumentLabel ?? ""}`;

const matchesExactTicker = (
  query: string,
  result: Readonly<{
    symbol: string;
    ticker: string;
    providerKey: string;
  }>
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return false;
  }

  return [result.symbol, result.ticker, result.providerKey]
    .map(normalizeSearchText)
    .some((candidate) => candidate === normalizedQuery);
};

const buildTickerQueries = (commentTicker: string | null) => {
  if (!commentTicker?.trim()) {
    return [];
  }

  const normalized = commentTicker.trim().toUpperCase();
  const variants = [normalized];

  if (normalized.endsWith(".PL")) {
    variants.push(`${normalized.slice(0, -3)}.WA`);
  }

  return variants.filter(
    (value, index, values) => values.findIndex((candidate) => candidate === value) === index
  );
};

const buildPlnTickerQueries = (
  instrumentLabel: string | null,
  accountCurrency: string
) => {
  if (accountCurrency !== "PLN" || !instrumentLabel?.trim()) {
    return [];
  }

  const compact = instrumentLabel
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!compact || compact.length < 2 || compact.length > 5) {
    return [];
  }

  return [`${compact}.PL`, `${compact}.WA`];
};

const buildLabelQueries = (instrumentLabel: string | null) => {
  if (!instrumentLabel?.trim()) {
    return [];
  }

  const trimmed = instrumentLabel.trim();
  const spaced = trimmed.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const compact = trimmed.replace(/[_\-\s]+/g, "");

  return [trimmed, spaced, compact].filter(
    (value, index, values) =>
      value.length > 0 && values.findIndex((candidate) => candidate === value) === index
  );
};

const IMPORT_EXACT_MATCH_EXCHANGE_PRIORITY = new Map<string, number>([
  ["WSE", 0],
  ["NASDAQ", 1],
  ["NYSE", 2],
]);

const IMPORT_PLN_ETF_EXACT_MATCH_EXCHANGE_PRIORITY = new Map<string, number>([
  ["WSE", 0],
  ["LSE", 1],
  ["FRANKFURT", 2],
  ["NASDAQ", 50],
  ["NYSE", 51],
]);

const getImportExactMatchPriority = (
  result: Readonly<{
    exchange?: string;
    instrumentType?: string;
  }>,
  input: Readonly<{
    accountCurrency: string;
  }>
) => {
  const normalizedExchange = normalizeExchangeLabel(result.exchange);
  const priorityMap =
    input.accountCurrency === "PLN" &&
    (result.instrumentType === "ETF" || result.instrumentType === "MUTUALFUND")
      ? IMPORT_PLN_ETF_EXACT_MATCH_EXCHANGE_PRIORITY
      : IMPORT_EXACT_MATCH_EXCHANGE_PRIORITY;

  if (normalizedExchange) {
    return priorityMap.get(normalizedExchange) ?? 100 + getExchangePriority({ exchange: normalizedExchange });
  }

  return Number.POSITIVE_INFINITY;
};

const pickPreferredExactMatch = (
  results: readonly InstrumentSearchResult[],
  predicate: (result: InstrumentSearchResult) => boolean,
  input: Readonly<{
    accountCurrency: string;
  }>
) => {
  const exactMatches = results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => predicate(result));

  if (exactMatches.length === 0) {
    return null;
  }

  exactMatches.sort((left, right) => {
    const priorityDiff =
      getImportExactMatchPriority(left.result, input) -
      getImportExactMatchPriority(right.result, input);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.index - right.index;
  });

  return exactMatches[0]?.result ?? null;
};

const matchesExactLabel = (
  query: string,
  result: Readonly<{
    symbol: string;
    ticker: string;
    providerKey: string;
    name: string;
  }>
) => {
  const normalizedQuery = normalizeCompanyName(query);
  if (!normalizedQuery) {
    return false;
  }

  return [result.name, result.symbol, result.ticker, result.providerKey]
    .map(normalizeCompanyName)
    .some(
      (candidate) =>
        candidate === normalizedQuery ||
        candidate.includes(normalizedQuery) ||
        normalizedQuery.includes(candidate)
    );
};

const pickResolvedInstrument = async (
  supabase: SupabaseServerClient,
  input: Readonly<{
    instrumentLabel: string | null;
    commentTicker: string | null;
    accountCurrency: string;
  }>
) => {
  const tickerQueries = [
    ...buildTickerQueries(input.commentTicker),
    ...buildPlnTickerQueries(input.instrumentLabel, input.accountCurrency),
  ].filter(
    (value, index, values) => values.findIndex((candidate) => candidate === value) === index
  );

  for (const tickerQuery of tickerQueries) {
    const response = await searchInstruments(supabase, {
      query: tickerQuery,
      limit: 5,
      mode: "all",
    });

    const exactTickerMatch = pickPreferredExactMatch(response.results, (result) =>
      matchesExactTicker(tickerQuery, result)
    , input);
    if (exactTickerMatch) {
      return exactTickerMatch;
    }
  }

  const labelInput = input.instrumentLabel?.trim() || null;
  if (labelInput) {
    for (const labelQuery of buildLabelQueries(labelInput)) {
      const response = await searchInstruments(supabase, {
        query: labelQuery,
        limit: 5,
        mode: "all",
      });

      const exactLabelMatch = pickPreferredExactMatch(response.results, (result) =>
        matchesExactLabel(labelInput, result)
      , input);
      if (exactLabelMatch) {
        return exactLabelMatch;
      }
    }
  }

  return null;
};

export async function buildXtbImportPreview(
  supabase: SupabaseServerClient,
  files: readonly File[],
  baseCurrency: string
): Promise<XtbImportPreviewResponse> {
  const previewStartedAt = performance.now();
  const parsedFiles = await Promise.all(files.map((file) => parseXtbWorkbookFile(file)));
  const parsedAt = performance.now();
  const resolutionCache = new Map<string, Awaited<ReturnType<typeof pickResolvedInstrument>>>();

  const uniqueInstrumentInputs = parsedFiles
    .flatMap((file) => file.parsedRows)
    .filter((row) => row.requiresInstrument)
    .map((row) => ({
      instrumentLabel: row.instrumentLabel,
      commentTicker: row.commentTicker,
      accountCurrency: row.accountCurrency,
    }))
    .filter((value, index, values) => {
      const key = toResolutionCacheKey(value);
      return values.findIndex((candidate) => toResolutionCacheKey(candidate) === key) === index;
    });

  const resolvedEntries = await Promise.all(
    uniqueInstrumentInputs.map(async (input) => [
      toResolutionCacheKey(input),
      await pickResolvedInstrument(supabase, input),
    ] as const)
  );
  resolvedEntries.forEach(([key, value]) => resolutionCache.set(key, value));
  const resolvedAt = performance.now();

  const rows: XtbImportPreviewRow[] = [];
  const fileSummaries: XtbImportPreviewFile[] = [];
  const skippedRows = parsedFiles.flatMap((file) => file.skippedRows);

  for (const parsedFile of parsedFiles) {
    let readyRows = 0;
    let unresolvedRows = 0;

    for (const row of parsedFile.parsedRows) {
      const resolvedInstrument = row.requiresInstrument
        ? resolutionCache.get(
            toResolutionCacheKey({
              instrumentLabel: row.instrumentLabel,
              commentTicker: row.commentTicker,
              accountCurrency: row.accountCurrency,
            })
          ) ?? null
        : null;

      const status = row.requiresInstrument
        ? resolvedInstrument
          ? "READY"
          : "NEEDS_INSTRUMENT"
        : "READY";

      if (status === "READY") {
        readyRows += 1;
      } else {
        unresolvedRows += 1;
      }

      rows.push({
        provider: "xtb",
        previewId: row.previewId,
        xtbRowId: row.xtbRowId,
        sourceFileName: row.sourceFileName,
        sourceType: row.sourceType,
        executedAtUtc: row.executedAtUtc,
        sourceOrder: row.sourceOrder,
        kind: row.kind,
        status,
        skipReason: null,
        tradeDate: row.tradeDate,
        accountCurrency: row.accountCurrency,
        accountNumber: row.accountNumber,
        amount: row.amount,
        instrumentLabel: row.instrumentLabel,
        comment: row.comment,
        quantity: row.quantity,
        price: row.price,
        fee: row.fee,
        cashflowType: row.cashflowType,
        side: row.side,
        requiresInstrument: row.requiresInstrument,
        commentTicker: row.commentTicker,
        instrument: resolvedInstrument,
      });
    }

    fileSummaries.push({
      fileName: parsedFile.fileName,
      accountCurrency: parsedFile.accountCurrency,
      accountNumber: parsedFile.accountNumber,
      dateFromUtc: parsedFile.dateFromUtc,
      dateToUtc: parsedFile.dateToUtc,
      parsedRows: parsedFile.parsedRows.length,
      readyRows,
      unresolvedRows,
      skippedRows: parsedFile.skippedRows.length,
    });
  }

  const valuation = await buildXtbPreviewValuation(supabase, rows, baseCurrency);
  const valuedAt = performance.now();

  logPreviewEvent("finished", {
    fileCount: files.length,
    parsedRows: rows.length,
    unresolvedRows: rows.filter((row) => row.status === "NEEDS_INSTRUMENT").length,
    parseMs: Math.round(parsedAt - previewStartedAt),
    resolveMs: Math.round(resolvedAt - parsedAt),
    valuationMs: Math.round(valuedAt - resolvedAt),
    totalMs: Math.round(valuedAt - previewStartedAt),
  });

  return {
    provider: "xtb",
    files: fileSummaries,
    rows,
    skippedRows,
    summary: {
      fileCount: fileSummaries.length,
      parsedRows: rows.length,
      readyRows: rows.filter((row) => row.status === "READY").length,
      unresolvedRows: rows.filter((row) => row.status === "NEEDS_INSTRUMENT").length,
      skippedRows: skippedRows.length,
    },
    valuation,
  };
}

export const __test__ = {
  buildLabelQueries,
  buildPlnTickerQueries,
  pickPreferredExactMatch,
};
