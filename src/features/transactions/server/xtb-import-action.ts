"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { buildCashInstrument } from "../lib/system-currencies";
import { createTransaction } from "./create-transaction";
import { revalidateTransactionViews } from "./revalidate-transaction-views";
import { buildXtbSettlementOverride, xtbImportInstrumentSchema } from "./xtb-import/shared";
import { sortXtbImportRows } from "./xtb-import/sort-xtb-import-rows";

const rowSchema = z.object({
  provider: z.literal("xtb"),
  previewId: z.string().min(1),
  xtbRowId: z.string().min(1),
  sourceFileName: z.string().min(1),
  sourceType: z.string().min(1),
  executedAtUtc: z.string().nullable(),
  sourceOrder: z.number().int().nonnegative(),
  kind: z.enum([
    "TRADE_BUY",
    "TRADE_SELL",
    "CASH_DEPOSIT",
    "CASH_WITHDRAWAL",
    "DIVIDEND",
    "INTEREST",
    "TAX",
  ]),
  status: z.literal("READY"),
  tradeDate: z.string().min(1),
  accountCurrency: z.enum(["USD", "EUR", "PLN", "GBP", "CHF"]),
  accountNumber: z.string().trim().min(1),
  amount: z.string().trim().min(1),
  instrumentLabel: z.string().nullable(),
  comment: z.string().nullable(),
  quantity: z.string().trim().min(1),
  price: z.string().trim().min(1),
  fee: z.string().trim().min(1),
  cashflowType: z
    .enum(["DEPOSIT", "WITHDRAWAL", "DIVIDEND", "INTEREST", "FEE", "TAX", "TRADE_SETTLEMENT"])
    .nullable(),
  side: z.enum(["BUY", "SELL"]),
  requiresInstrument: z.boolean(),
  commentTicker: z.string().nullable(),
  instrument: xtbImportInstrumentSchema.nullable(),
});

const commitInputSchema = z.object({
  portfolioId: z.string().uuid(),
  rows: z.array(rowSchema).min(1),
});

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error ? error.message : fallbackMessage;

const toDeterministicUuid = (seed: string) => {
  const digest = createHash("sha256").update(seed).digest("hex");
  const chars = digest.slice(0, 32).split("");
  chars[12] = "4";
  const variant = parseInt(chars[16], 16);
  chars[16] = ((variant & 0x3) | 0x8).toString(16);
  const hex = chars.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

const buildNotes = (row: z.infer<typeof rowSchema>) =>
  [
    `Import XTB: ${row.sourceType}`,
    row.instrumentLabel ? `instrument ${row.instrumentLabel}` : null,
    `plik ${row.sourceFileName}`,
    `wiersz ${row.xtbRowId}`,
  ]
    .filter(Boolean)
    .join(" • ");

const buildRowDebugLabel = (row: z.infer<typeof rowSchema>) =>
  `${row.sourceType} • ${row.sourceFileName} • wiersz ${row.xtbRowId}`;

export async function commitXtbImportAction(
  input: z.infer<typeof commitInputSchema>
) {
  const parsed = commitInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Nieprawidłowe dane importu XTB.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;
  if (error || !user) {
    throw new Error("Zaloguj się, aby zaimportować historię z XTB.");
  }

  const rows = sortXtbImportRows(parsed.data.rows);

  const supabaseAdmin = createAdminClient();
  let createdCount = 0;
  let dedupedCount = 0;

  for (const row of rows) {
    const clientRequestId = toDeterministicUuid(
      [
        "xtb",
        row.accountNumber,
        row.accountCurrency,
        row.xtbRowId,
        row.kind,
      ].join(":")
    );

    const request =
      row.requiresInstrument && row.instrument
        ? {
            portfolioId: parsed.data.portfolioId,
            clientRequestId,
            type: row.side,
            date: row.tradeDate,
            quantity: row.quantity,
            price: row.price,
            fee: row.fee,
            notes: buildNotes(row),
            consumeCash: true,
            cashCurrency: row.accountCurrency,
            customAnnualRatePct: undefined,
            instrument: {
              id: row.instrument.id,
              provider: row.instrument.provider,
              providerKey: row.instrument.providerKey,
              symbol: row.instrument.symbol,
              ticker: row.instrument.ticker,
              name: row.instrument.name,
              currency: row.instrument.currency,
              instrumentType: row.instrument.instrumentType,
              exchange: row.instrument.exchange,
              region: row.instrument.region,
              logoUrl: row.instrument.logoUrl ?? undefined,
            },
          }
        : {
            portfolioId: parsed.data.portfolioId,
            clientRequestId,
            type: row.side,
            date: row.tradeDate,
            quantity: row.quantity,
            price: "1",
            fee: "0",
            notes: buildNotes(row),
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
          };

    if (row.requiresInstrument && !row.instrument) {
      throw new Error(`Brak dopasowanego instrumentu dla wiersza ${row.xtbRowId}.`);
    }

    const result = await createTransaction(supabase, supabaseAdmin, user.id, request, {
      guardMode: "IMPORT",
      settlementOverride: buildXtbSettlementOverride(row),
    }).catch((caughtError: unknown) => {
      const resolvedMessage = resolveErrorMessage(
        caughtError,
        `Nie udało się zapisać wiersza ${row.xtbRowId} z importu XTB.`
      );
      throw new Error(
        `${buildRowDebugLabel(row)}: ${resolvedMessage}`
      );
    });

    if (result.deduped) {
      dedupedCount += 1;
    } else {
      createdCount += 1;
    }
  }

  revalidateTransactionViews(parsed.data.portfolioId, { includeStocks: true });

  return {
    portfolioId: parsed.data.portfolioId,
    createdCount,
    dedupedCount,
  };
}
