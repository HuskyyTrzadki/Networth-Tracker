import type { createClient } from "@/lib/supabase/server";
import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";
import { upsertInstrumentAndGetId } from "@/features/transactions/server/create-transaction-context";
import { runPostWriteSideEffects } from "@/features/transactions/server/create-transaction-write";
import { isValidTradeDate } from "@/features/transactions/lib/trade-date";
import { parseDecimalInput } from "@/features/transactions/lib/parse-decimal";

import { buildDividendEventKey } from "./dividend-utils";

type SupabaseServerClient = ReturnType<typeof createClient>;

export class DividendAlreadyBookedError extends Error {
  constructor() {
    super("Ta dywidenda jest już zaksięgowana.");
  }
}

const normalizeDecimalInput = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(",", ".");

const normalizeCurrency = (value: string) => value.trim().toUpperCase();

const ensurePortfolioExists = async (
  supabaseUser: SupabaseServerClient,
  portfolioId: string
) => {
  const { data, error } = await supabaseUser
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Portfolio not found.");
  }
};

const ensureNotBookedYet = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  portfolioId: string;
  eventKey: string;
}>) => {
  const { data, error } = await input.supabaseUser
    .from("transactions")
    .select("id")
    .eq("portfolio_id", input.portfolioId)
    .eq("leg_role", "ASSET")
    .eq("cashflow_type", "DIVIDEND")
    .eq("dividend_event_key", input.eventKey)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length > 0) {
    throw new DividendAlreadyBookedError();
  }
};

export async function bookDividendPayout(input: Readonly<{
  supabaseUser: SupabaseServerClient;
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  portfolioId: string;
  providerKey: string;
  symbol: string;
  eventDate: string;
  payoutCurrency: string;
  netAmount: string;
  dividendEventKey: string;
}>): Promise<Readonly<{ transactionId: string }>> {
  if (!isValidTradeDate(input.eventDate)) {
    throw new Error("Nieprawidłowa data wypłaty dywidendy.");
  }

  const normalizedCurrency = normalizeCurrency(input.payoutCurrency);
  if (!isSupportedCashCurrency(normalizedCurrency)) {
    throw new Error(`Waluta ${normalizedCurrency} nie jest obsługiwana dla księgowania.`);
  }

  const parsedNetAmount = parseDecimalInput(input.netAmount);
  if (parsedNetAmount === null || parsedNetAmount <= 0) {
    throw new Error("Wartość netto musi być większa od 0.");
  }

  const canonicalEventKey = buildDividendEventKey(input.providerKey, input.eventDate);
  if (canonicalEventKey !== input.dividendEventKey) {
    throw new Error("Nieprawidłowy klucz zdarzenia dywidendy.");
  }

  await ensurePortfolioExists(input.supabaseUser, input.portfolioId);
  await ensureNotBookedYet({
    supabaseUser: input.supabaseUser,
    portfolioId: input.portfolioId,
    eventKey: canonicalEventKey,
  });

  const updatedAt = new Date().toISOString();
  const cashInstrumentId = await upsertInstrumentAndGetId(
    input.supabaseAdmin,
    {
      provider: "system",
      provider_key: normalizedCurrency,
      symbol: normalizedCurrency,
      name: `Gotówka ${normalizedCurrency}`,
      currency: normalizedCurrency,
      exchange: null,
      region: null,
      logo_url: null,
      instrument_type: "CURRENCY",
      updated_at: updatedAt,
    },
    "Instrument save failed."
  );

  const groupId = crypto.randomUUID();
  const clientRequestId = crypto.randomUUID();
  const netAmount = normalizeDecimalInput(input.netAmount);
  const parsedNet = Number(netAmount);

  const notes =
    `Dywidenda: ${input.symbol} (${input.providerKey}), data zdarzenia ${input.eventDate}.`;

  const { data: inserted, error: insertError } = await input.supabaseUser
    .from("transactions")
    .insert({
      user_id: input.userId,
      portfolio_id: input.portfolioId,
      instrument_id: cashInstrumentId,
      custom_instrument_id: null,
      side: "BUY",
      trade_date: input.eventDate,
      quantity: parsedNet,
      price: 1,
      fee: 0,
      notes,
      client_request_id: clientRequestId,
      group_id: groupId,
      leg_role: "ASSET",
      leg_key: "ASSET",
      cashflow_type: "DIVIDEND",
      dividend_event_key: canonicalEventKey,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      throw new DividendAlreadyBookedError();
    }
    throw new Error(insertError.message);
  }

  if (!inserted) {
    throw new Error("Nie udało się zapisać dywidendy.");
  }

  await runPostWriteSideEffects({
    supabaseUser: input.supabaseUser,
    supabaseAdmin: input.supabaseAdmin,
    userId: input.userId,
    portfolioId: input.portfolioId,
    tradeDate: input.eventDate,
  });

  return {
    transactionId: inserted.id,
  };
}
