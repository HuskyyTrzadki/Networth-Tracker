import type { createClient } from "@/lib/supabase/server";

import { touchProfileLastActive } from "@/features/auth/server/profiles";

import type { CreateTransactionRequest } from "./schema";

type SupabaseServerClient = ReturnType<typeof createClient>;

type CreateTransactionResult = Readonly<{
  transactionId: string;
  instrumentId: string;
  deduped: boolean;
}>;

const normalizeRequiredText = (value: string) => value.trim();

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildIdentityKey = (input: Readonly<{
  provider: string;
  providerKey: string | null;
  symbol: string;
  exchange: string | null;
  region: string | null;
}>) => {
  if (input.providerKey) {
    return `${input.provider}:${input.providerKey}`;
  }

  const exchangePart = input.exchange ?? "unknown";
  const regionPart = input.region ?? "global";
  return `${input.provider}:${input.symbol}:${exchangePart}:${regionPart}`;
};

export async function createTransaction(
  supabase: SupabaseServerClient,
  userId: string,
  input: CreateTransactionRequest
): Promise<CreateTransactionResult> {
  // Normalize and cache the instrument per user for stable identity.
  const provider = normalizeRequiredText(input.instrument.provider);
  const providerKey = normalizeOptionalText(input.instrument.providerKey);
  const symbol = normalizeRequiredText(input.instrument.symbol);
  const name = normalizeRequiredText(input.instrument.name);
  const currency = normalizeRequiredText(input.instrument.currency).toUpperCase();
  const exchange = normalizeOptionalText(input.instrument.exchange);
  const region = normalizeOptionalText(input.instrument.region);
  const logoUrl = normalizeOptionalText(input.instrument.logoUrl);
  const identityKey = buildIdentityKey({
    provider,
    providerKey,
    symbol,
    exchange,
    region,
  });

  const now = new Date().toISOString();
  // Persist logo URL (if provided) so lists can render instrument branding later.
  const { data: instrument, error: instrumentError } = await supabase
    .from("instruments")
    .upsert(
      {
        user_id: userId,
        provider,
        provider_key: providerKey,
        identity_key: identityKey,
        symbol,
        name,
        currency,
        exchange,
        region,
        logo_url: logoUrl,
        updated_at: now,
      },
      { onConflict: "user_id,identity_key" }
    )
    .select("id")
    .single();

  if (instrumentError || !instrument) {
    throw new Error(instrumentError?.message ?? "Instrument save failed.");
  }

  // Insert the transaction. If the client retries, we return the existing row.
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      instrument_id: instrument.id,
      // portfolio_id is required and must belong to the user (enforced by RLS).
      portfolio_id: input.portfolioId,
      side: input.type,
      trade_date: input.date,
      quantity: input.quantity,
      price: input.price,
      fee: input.fee ?? "0",
      notes: input.notes?.trim() || null,
      client_request_id: input.clientRequestId,
    })
    .select("id")
    .single();

  if (transactionError) {
    if (transactionError.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("client_request_id", input.clientRequestId)
        .maybeSingle();

      if (existingError || !existing) {
        throw new Error(
          existingError?.message ?? "Missing transaction after duplicate insert."
        );
      }

      // Best-effort profile touch; we do not block the response.
      await touchProfileLastActive(supabase, userId).catch(() => undefined);

      return {
        transactionId: existing.id,
        instrumentId: instrument.id,
        deduped: true,
      };
    }

    throw new Error(transactionError.message);
  }

  // Best-effort profile touch; we do not block the response.
  await touchProfileLastActive(supabase, userId).catch(() => undefined);

  return {
    transactionId: transaction.id,
    instrumentId: instrument.id,
    deduped: false,
  };
}
