import { buildCashInstrument } from "@/features/transactions/lib/system-currencies";
import type { BrokerImportPreviewResponse } from "@/features/transactions/lib/broker-import-types";
import { buildXtbImportPreview } from "@/features/transactions/server/xtb-import/preview-xtb-import";
import {
  buildXtbImportNotes,
  buildXtbImportRowDebugLabel,
  buildXtbSettlementOverride,
  resolveUnknownImportErrorMessage,
  toDeterministicImportRequestId,
  xtbImportReadyRowSchema,
  type XtbImportReadyRow,
} from "@/features/transactions/server/xtb-import/shared";
import { sortXtbImportRows } from "@/features/transactions/server/xtb-import/sort-xtb-import-rows";

import type { BrokerImportProviderAdapter } from "../../provider-registry";

const buildSourceSummary = (rows: readonly XtbImportReadyRow[]) => ({
  fileNames: [...new Set(rows.map((row) => row.sourceFileName))],
  accountNumbers: [...new Set(rows.map((row) => row.accountNumber))],
  dateFrom: rows.reduce<string | null>(
    (current, row) =>
      current === null || row.tradeDate < current ? row.tradeDate : current,
    null
  ),
  dateTo: rows.reduce<string | null>(
    (current, row) =>
      current === null || row.tradeDate > current ? row.tradeDate : current,
    null
  ),
});

export const xtbBrokerImportProvider: BrokerImportProviderAdapter = {
  id: "xtb",
  async buildPreview(supabase, files, baseCurrency) {
    const preview = await buildXtbImportPreview(supabase, files, baseCurrency);
    return {
      ...preview,
      provider: "xtb",
      rows: preview.rows.map((row) => ({
        ...row,
        provider: "xtb" as const,
      })),
    } satisfies BrokerImportPreviewResponse;
  },
  parseReadyRow(payload) {
    return xtbImportReadyRowSchema.parse(payload);
  },
  sortReadyRows(rows) {
    return sortXtbImportRows(rows);
  },
  buildImportExecution(portfolioId, row) {
    const clientRequestId = toDeterministicImportRequestId(row);

    if (row.requiresInstrument && !row.instrument) {
      throw new Error(`Brak dopasowanego instrumentu dla wiersza ${row.xtbRowId}.`);
    }

    if (row.requiresInstrument && row.instrument) {
      return {
        request: {
          portfolioId,
          clientRequestId,
          type: row.side,
          date: row.tradeDate,
          quantity: row.quantity,
          price: row.price,
          fee: row.fee,
          notes: buildXtbImportNotes(row),
          consumeCash: true,
          cashCurrency: row.accountCurrency,
          customAnnualRatePct: undefined,
          instrument: {
            provider: row.instrument.provider,
            providerKey: row.instrument.providerKey,
            symbol: row.instrument.symbol,
            name: row.instrument.name,
            currency: row.instrument.currency,
            instrumentType: row.instrument.instrumentType,
            exchange: row.instrument.exchange,
            region: row.instrument.region,
            logoUrl: row.instrument.logoUrl ?? undefined,
          },
        },
        guardMode: "STRICT",
        settlementOverride: buildXtbSettlementOverride(row),
      };
    }

    return {
      request: {
        portfolioId,
        clientRequestId,
        type: row.side,
        date: row.tradeDate,
        quantity: row.quantity,
        price: "1",
        fee: "0",
        notes: buildXtbImportNotes(row),
        consumeCash: false,
        customAnnualRatePct: undefined,
        cashflowType: row.cashflowType ?? undefined,
        instrument: {
          provider: "system" as const,
          providerKey: row.accountCurrency,
          symbol: row.accountCurrency,
          name: buildCashInstrument(row.accountCurrency).name,
          currency: row.accountCurrency,
          instrumentType: "CURRENCY" as const,
        },
      },
      guardMode: "IMPORT",
      settlementOverride: null,
    };
  },
  buildRowDebugLabel(row) {
    return buildXtbImportRowDebugLabel(row);
  },
  buildSourceSummary,
  resolveErrorMessage: resolveUnknownImportErrorMessage,
};
