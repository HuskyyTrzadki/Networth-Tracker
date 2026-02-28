"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

import {
  addStockToWatchlist,
  removeStockFromWatchlist,
} from "./stock-watchlist";
import {
  stockWatchlistUpsertSchema,
  type StockWatchlistUpsertInput,
} from "./stock-watchlist-schema";

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

export async function addStockWatchlistAction(input: StockWatchlistUpsertInput) {
  const parsed = stockWatchlistUpsertSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Nieprawidłowe dane wejściowe.");
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const result = await addStockToWatchlist(supabase, userId, parsed.data);
  revalidatePath("/stocks");
  return result;
}

export async function removeStockWatchlistAction(providerKey: string) {
  const normalizedProviderKey = providerKey.trim();
  if (!normalizedProviderKey) {
    throw new Error("Parametr providerKey jest wymagany.");
  }

  const { supabase } = await getAuthenticatedContext();
  await removeStockFromWatchlist(supabase, normalizedProviderKey);
  revalidatePath("/stocks");
}
