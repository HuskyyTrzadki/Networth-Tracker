import * as XLSX from "xlsx";

import { isValidTradeDate } from "../../lib/trade-date";
import { isSupportedCashCurrency, type CashCurrency } from "../../lib/system-currencies";
import { parseDecimalString } from "@/lib/decimal";
import { badRequestError } from "@/lib/http/app-error";
import { mapXtbSupportedRow, type ParsedWorkbookRow } from "./map-xtb-row";

export type ParsedXtbWorkbookResult = Readonly<{
  fileName: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  dateFromUtc: string | null;
  dateToUtc: string | null;
  parsedRows: readonly ParsedWorkbookRow[];
  skippedRows: readonly {
    previewId: string;
    xtbRowId: string;
    sourceFileName: string;
    sourceType: string;
    tradeDate: string | null;
    amount: string | null;
    instrumentLabel: string | null;
    reason: string;
  }[];
}>;

type ParsedXtbSkippedRow = ParsedXtbWorkbookResult["skippedRows"][number];

const REQUIRED_HEADERS = ["Type", "Instrument", "Time", "Amount", "ID", "Comment"] as const;
const CLOSED_POSITIONS_HEADERS = ["Instrument", "Category", "Ticker"] as const;
const normalizeCell = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const toPreviewId = (fileName: string, xtbRowId: string) =>
  `${fileName}:${xtbRowId}`;

const readWorkbook = (buffer: ArrayBuffer) =>
  XLSX.read(buffer, { type: "array", cellDates: false, raw: false });

const getSheetRows = (workbook: XLSX.WorkBook, sheetName: string | undefined) => {
  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
};

const readCashOperationRows = (workbook: XLSX.WorkBook) => {
  const preferredSheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === "cash operations") ??
    workbook.SheetNames.find((name) => name.trim().toLowerCase().includes("cash")) ??
    workbook.SheetNames[0];

  if (!preferredSheetName) {
    throw badRequestError("Plik XTB nie zawiera arkusza.", {
      code: "XTB_IMPORT_WORKBOOK_EMPTY",
    });
  }

  return getSheetRows(workbook, preferredSheetName);
};

const resolveAccountCurrency = (fileName: string): CashCurrency => {
  const normalizedFileName = fileName.trim().toUpperCase();
  if (normalizedFileName.startsWith("IKE_")) {
    return "PLN";
  }

  const match = normalizedFileName.match(/^([A-Z]{3})_/);
  const currency = match?.[1] ?? null;

  if (!currency || !isSupportedCashCurrency(currency)) {
    throw badRequestError("Nie udało się rozpoznać waluty konta z nazwy pliku XTB.", {
      code: "XTB_IMPORT_CURRENCY_UNSUPPORTED",
      details: { fileName },
    });
  }

  return currency;
};

const findHeaderRowIndex = (rows: ReadonlyArray<readonly (string | number | null)[]>) =>
  rows.findIndex((row) => REQUIRED_HEADERS.every((header, index) => normalizeCell(row[index]) === header));

const buildInstrumentTickerLookup = (workbook: XLSX.WorkBook) => {
  const sheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === "closed positions") ??
    workbook.SheetNames.find((name) => name.trim().toLowerCase().includes("closed"));
  const rows = getSheetRows(workbook, sheetName);
  const headerRowIndex = rows.findIndex((row) =>
    CLOSED_POSITIONS_HEADERS.every(
      (header, index) => normalizeCell(row[index]) === header
    )
  );

  if (headerRowIndex === -1) {
    return new Map<string, string>();
  }

  const countsByInstrument = new Map<string, Map<string, number>>();
  for (const row of rows.slice(headerRowIndex + 1)) {
    const instrument = normalizeCell(row[0]);
    const ticker = normalizeCell(row[2]);
    if (!instrument || !ticker) {
      continue;
    }

    const normalizedInstrument = instrument.toUpperCase();
    const byTicker = countsByInstrument.get(normalizedInstrument) ?? new Map<string, number>();
    byTicker.set(ticker, (byTicker.get(ticker) ?? 0) + 1);
    countsByInstrument.set(normalizedInstrument, byTicker);
  }

  const lookup = new Map<string, string>();
  for (const [instrument, byTicker] of countsByInstrument.entries()) {
    const winner = [...byTicker.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
    if (winner) {
      lookup.set(instrument, winner);
    }
  }

  return lookup;
};

const parseTradeDate = (value: string) => {
  const trimmed = value.trim();
  const isoDate = trimmed.slice(0, 10);
  return isValidTradeDate(isoDate) ? isoDate : null;
};

const parseExecutedAtUtc = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function parseXtbWorkbookBuffer(
  fileName: string,
  buffer: ArrayBuffer
): Promise<ParsedXtbWorkbookResult> {
  const workbook = readWorkbook(buffer);
  const rows = readCashOperationRows(workbook);
  const accountCurrency = resolveAccountCurrency(fileName);
  const instrumentTickerLookup = buildInstrumentTickerLookup(workbook);
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw badRequestError("Ten plik nie wygląda jak eksport XTB Cash Operations.", {
      code: "XTB_IMPORT_HEADERS_MISSING",
      details: { fileName },
    });
  }

  const accountNumber = normalizeCell(rows[0]?.[1]);
  if (!accountNumber) {
    throw badRequestError("Nie udało się odczytać numeru konta z pliku XTB.", {
      code: "XTB_IMPORT_ACCOUNT_NUMBER_MISSING",
      details: { fileName },
    });
  }

  const dateFromUtc = normalizeCell(rows[2]?.[1]) || null;
  const dateToUtc = normalizeCell(rows[3]?.[1]) || null;
  const parsedRows: ParsedWorkbookRow[] = [];
  const skippedRows: ParsedXtbSkippedRow[] = [];

  for (const [sourceOrder, row] of rows.slice(headerRowIndex + 1).entries()) {
    const sourceType = normalizeCell(row[0]);
    const instrumentLabel = normalizeCell(row[1]) || null;
    const tradeDateRaw = normalizeCell(row[2]);
    const amountRaw = normalizeCell(row[3]);
    const xtbRowId = normalizeCell(row[4]);
    const comment = normalizeCell(row[5]) || null;

    if (!sourceType && !tradeDateRaw && !amountRaw && !xtbRowId) {
      continue;
    }

    const previewId = toPreviewId(fileName, xtbRowId || crypto.randomUUID());

    if (sourceType === "Total") {
      continue;
    }

    if (!xtbRowId) {
      skippedRows.push({
        previewId,
        xtbRowId: "",
        sourceFileName: fileName,
        sourceType,
        tradeDate: null,
        amount: amountRaw || null,
        instrumentLabel,
        reason: "Brak identyfikatora wiersza XTB.",
      });
      continue;
    }

    const tradeDate = parseTradeDate(tradeDateRaw);
    if (!tradeDate) {
      skippedRows.push({
        previewId,
        xtbRowId,
        sourceFileName: fileName,
        sourceType,
        tradeDate: tradeDateRaw || null,
        amount: amountRaw || null,
        instrumentLabel,
        reason: "Data wiersza jest poza obsługiwanym zakresem aplikacji.",
      });
      continue;
    }

    const amount = parseDecimalString(amountRaw);
    if (!amount) {
      skippedRows.push({
        previewId,
        xtbRowId,
        sourceFileName: fileName,
        sourceType,
        tradeDate,
        amount: amountRaw || null,
        instrumentLabel,
        reason: "Brak poprawnej kwoty w wierszu XTB.",
      });
      continue;
    }

    const mapped = mapXtbSupportedRow({
      previewId,
      xtbRowId,
      fileName,
      accountCurrency,
      accountNumber,
      sourceType,
      executedAtUtc: parseExecutedAtUtc(tradeDateRaw),
      sourceOrder,
      instrumentLabel,
      tickerHint: instrumentLabel
        ? instrumentTickerLookup.get(instrumentLabel.toUpperCase()) ?? null
        : null,
      tradeDate,
      amount: amount.toString(),
      comment,
    });

    if ("reason" in mapped) {
      skippedRows.push({
        previewId,
        xtbRowId,
        sourceFileName: fileName,
        sourceType,
        tradeDate,
        amount: amount.toString(),
        instrumentLabel,
        reason: mapped.reason,
      });
      continue;
    }

    parsedRows.push(mapped);
  }

  return {
    fileName,
    accountCurrency,
    accountNumber,
    dateFromUtc,
    dateToUtc,
    parsedRows,
    skippedRows,
  };
}

export async function parseXtbWorkbookFile(file: File): Promise<ParsedXtbWorkbookResult> {
  return parseXtbWorkbookBuffer(file.name, await file.arrayBuffer());
}
