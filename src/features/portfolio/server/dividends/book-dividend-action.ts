"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  bookDividendPayout,
  DividendAlreadyBookedError,
} from "./book-dividend";

const bookDividendInputSchema = z.object({
  portfolioId: z.string().uuid(),
  providerKey: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  eventDate: z.string().trim().min(1),
  payoutCurrency: z.string().trim().length(3),
  netAmount: z.string().trim().min(1),
  dividendEventKey: z.string().trim().min(1),
});

type BookDividendInput = z.infer<typeof bookDividendInputSchema>;

const getAuthenticatedContext = async () => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  return { supabase, userId: user.id };
};

export async function bookDividendAction(input: BookDividendInput) {
  const parsed = bookDividendInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Nieprawidłowe dane wejściowe.");
  }

  const { supabase, userId } = await getAuthenticatedContext();

  try {
    const result = await bookDividendPayout({
      supabaseUser: supabase,
      supabaseAdmin: createAdminClient(),
      userId,
      portfolioId: parsed.data.portfolioId,
      providerKey: parsed.data.providerKey,
      symbol: parsed.data.symbol,
      eventDate: parsed.data.eventDate,
      payoutCurrency: parsed.data.payoutCurrency,
      netAmount: parsed.data.netAmount,
      dividendEventKey: parsed.data.dividendEventKey,
    });

    revalidateTransactionViews(parsed.data.portfolioId);
    return result;
  } catch (error) {
    if (error instanceof DividendAlreadyBookedError) {
      throw error;
    }
    throw error;
  }
}
