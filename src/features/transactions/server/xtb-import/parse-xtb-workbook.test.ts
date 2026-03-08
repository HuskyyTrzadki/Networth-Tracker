// @vitest-environment node

import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { multiplyDecimals, parseDecimalString } from "@/lib/decimal";

import { parseXtbWorkbookBuffer } from "./parse-xtb-workbook";

const buildWorkbookBuffer = (
  fileName: string,
  dataRows: readonly (readonly string[])[],
  includeClosedPositionsSheet = false
) => {
  const cashRows: string[][] = [
    ["Account number", "51420076"],
    ["Cash Operations"],
    ["Date from (UTC)", "2024-01-01 00:00:00"],
    ["Date to (UTC)", "2026-03-06 21:08:31"],
    ["Type", "Instrument", "Time", "Amount", "ID", "Comment"],
    ...dataRows.map((row) => [...row]),
  ];

  const workbook = XLSX.utils.book_new();
  if (includeClosedPositionsSheet) {
    const closedPositionsSheet = XLSX.utils.aoa_to_sheet([
      ["Account", "51420076"],
      ["Closed Positions"],
      ["Date from (UTC)", "2024-01-01 00:00:00"],
      ["Date to (UTC)", "2026-03-06 21:08:31"],
      ["Instrument", "Category", "Ticker", "Type", "Volume"],
      ["CD Projekt", "STOCK", "CDR.PL", "BUY", "1"],
    ]);
    XLSX.utils.book_append_sheet(workbook, closedPositionsSheet, "Closed Positions");
  }

  const cashOperationsSheet = XLSX.utils.aoa_to_sheet(cashRows);
  XLSX.utils.book_append_sheet(workbook, cashOperationsSheet, "Cash Operations");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return {
    name: fileName,
    buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  };
};

describe("parseXtbWorkbookFile", () => {
  it("maps supported XTB cash-operations rows and silently ignores workbook summary rows", async () => {
    const file = buildWorkbookBuffer(
      "PLN_51420076_2024-01-01_2026-03-06.xlsx",
      [
        ["Stock purchase", "CD Projekt", "2026-03-04 08:43:04", "-175.2", "1159792760", "OPEN BUY 0.5108 @ 343.00"],
        ["Deposit", "", "2026-02-19 09:46:38", "200", "1143324912", "Adyen BLIK deposit"],
        ["Withdrawal", "", "2026-02-20 09:46:38", "-50", "1143324913", "Withdrawal from 51420076"],
        ["IKE deposit", "", "2026-02-19 09:46:53", "-200", "1143325137", "Transfer out operation on account with id 51420076"],
        ["Transfer", "", "2026-02-19 10:00:00", "-300", "1143325200", "Currency conversion, PLN to USD from TA: 51420076 to: 51446806, Exchange rate:0.238032"],
        ["Transfer", "", "2026-02-19 10:01:00", "71.41", "1143325201", "Currency conversion, USD to PLN from TA: 51446806 to: 51420076, Exchange rate:4.200000"],
        ["IKE return partial", "", "2026-02-19 10:02:00", "100", "1143325202", "Transfer operation on account with id 51420076"],
        ["Dividend", "Syntetik", "2026-02-02 10:59:58", "10.75", "1118684953", "SNT.PL PLN 10.7500/ SHR"],
        ["Withholding tax", "Syntetik", "2026-02-02 10:59:58", "-2.04", "1118638858", "SNT.PL PLN WHT 19%"],
        ["Free funds interest", "", "2026-01-07 12:30:29", "0.01", "1078374095", "Free-funds Interest 2025-12"],
        ["Free funds interest tax", "", "2026-01-07 12:25:18", "-0.01", "1078300445", "Free-funds Interest Tax 2025-12"],
        ["Total", "", "", "0.64", "", ""],
      ],
      true
    );

    const result = await parseXtbWorkbookBuffer(file.name, file.buffer);

    expect(result.accountCurrency).toBe("PLN");
    expect(result.accountNumber).toBe("51420076");
    expect(result.parsedRows).toHaveLength(11);
    expect(result.parsedRows.map((row) => row.kind)).toEqual([
      "TRADE_BUY",
      "CASH_DEPOSIT",
      "CASH_WITHDRAWAL",
      "CASH_WITHDRAWAL",
      "CASH_WITHDRAWAL",
      "CASH_DEPOSIT",
      "CASH_DEPOSIT",
      "DIVIDEND",
      "TAX",
      "INTEREST",
      "TAX",
    ]);
    expect(result.parsedRows[0]?.commentTicker).toBe("CDR.PL");
    expect(result.skippedRows).toHaveLength(0);
  });

  it("adjusts stored trade price so settlement matches rounded XTB amount", async () => {
    const file = buildWorkbookBuffer("PLN_51420076_2024-01-01_2026-03-06.xlsx", [
      ["Stock purchase", "Creotech", "2026-03-04 08:42:19", "-149.99", "1159791688", "OPEN BUY 0.2431 @ 617.00"],
    ]);

    const result = await parseXtbWorkbookBuffer(file.name, file.buffer);
    const trade = result.parsedRows[0];

    expect(trade?.kind).toBe("TRADE_BUY");
    const quantity = parseDecimalString(trade?.quantity ?? "");
    const price = parseDecimalString(trade?.price ?? "");
    const amount = parseDecimalString(trade?.amount ?? "")?.abs();
    const difference = multiplyDecimals(quantity!, price!).minus(amount!);

    expect(quantity && price && amount).toBeTruthy();
    expect(difference.abs().lt(0.01)).toBe(true);
    expect(trade?.fee).toBe("0");
  });

  it("does not treat cross-currency settlement spread as a gigantic trade fee", async () => {
    const file = buildWorkbookBuffer("PLN_51420076_2024-01-01_2026-03-06.xlsx", [
      ["Stock purchase", "Alphabet", "2025-04-09 19:36:14", "-499.68", "777157575", "OPEN BUY 0.8155 @ 157.58"],
    ]);

    const result = await parseXtbWorkbookBuffer(file.name, file.buffer);
    const trade = result.parsedRows[0];

    expect(trade?.kind).toBe("TRADE_BUY");
    expect(trade?.price).toBe("157.58");
    expect(trade?.fee).toBe("0");
  });

  it("maps IKE transfer-like rows from the amount sign", async () => {
    const file = buildWorkbookBuffer("PLN_51420076_2024-01-01_2026-03-06.xlsx", [
      ["Deposit", "", "2024-12-19 15:15:56", "93000", "682177311", "Pekao deposit"],
      ["IKE deposit", "", "2024-12-19 15:37:58", "-23472", "682222213", "Transfer out operation on account with id 51420076"],
      ["Transfer", "", "2024-12-19 16:52:45", "-4128.86", "682311968", "Currency conversion, PLN to USD from TA: 51420076 to: 51446806, Exchange rate:0.242275"],
      ["Transfer", "", "2024-12-19 17:54:17", "-4000", "682361212", "Currency conversion, PLN to USD from TA: 51420076 to: 51446806, Exchange rate:0.242215"],
      ["IKE return partial", "", "2024-12-19 09:00:00", "-120", "1002", "Transfer out"],
    ]);

    const result = await parseXtbWorkbookBuffer(file.name, file.buffer);

    expect(result.parsedRows.map((row) => row.kind)).toEqual([
      "CASH_DEPOSIT",
      "CASH_WITHDRAWAL",
      "CASH_WITHDRAWAL",
      "CASH_WITHDRAWAL",
      "CASH_WITHDRAWAL",
    ]);
    expect(result.parsedRows.map((row) => row.side)).toEqual([
      "BUY",
      "SELL",
      "SELL",
      "SELL",
      "SELL",
    ]);
  });

  it("treats IKE-prefixed XTB filenames as PLN accounts", async () => {
    const file = buildWorkbookBuffer("IKE_51444742_2006-01-01_2026-03-06.xlsx", [
      ["Deposit", "", "2026-02-19 09:46:38", "200", "1143324912", "Adyen BLIK deposit"],
    ]);

    const result = await parseXtbWorkbookBuffer(file.name, file.buffer);

    expect(result.accountCurrency).toBe("PLN");
    expect(result.parsedRows[0]?.accountCurrency).toBe("PLN");
  });
});
