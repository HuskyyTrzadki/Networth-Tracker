"use server";

import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { createTransaction } from "./create-transaction";
import { deleteTransactionGroupByTransactionId } from "./delete-transaction-group";
import { revalidateTransactionViews } from "./revalidate-transaction-views";
import {
  createTransactionRequestSchema,
  updateTransactionRequestSchema,
  type CreateTransactionRequest,
  type UpdateTransactionRequest,
} from "./schema";
import { updateTransactionById } from "./update-transaction";

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

const normalizeTransactionId = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Brak identyfikatora transakcji.");
  }
  return normalized;
};

export async function createTransactionAction(input: CreateTransactionRequest) {
  const parsed = createTransactionRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Nieprawidłowe dane wejściowe.");
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const result = await createTransaction(
    supabase,
    createAdminClient(),
    userId,
    parsed.data
  );

  revalidateTransactionViews(parsed.data.portfolioId, { includeStocks: true });
  return result;
}

export async function updateTransactionAction(
  transactionId: string,
  input: UpdateTransactionRequest
) {
  const normalizedTransactionId = normalizeTransactionId(transactionId);
  const parsed = updateTransactionRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Nieprawidłowe dane wejściowe.");
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const result = await updateTransactionById(
    supabase,
    createAdminClient(),
    userId,
    normalizedTransactionId,
    parsed.data
  );

  revalidateTransactionViews(result.portfolioId, { includeStocks: true });
  return result;
}

export async function deleteTransactionAction(transactionId: string) {
  const normalizedTransactionId = normalizeTransactionId(transactionId);
  const { supabase, userId } = await getAuthenticatedContext();
  const result = await deleteTransactionGroupByTransactionId(
    supabase,
    createAdminClient(),
    userId,
    normalizedTransactionId
  );

  revalidateTransactionViews(result.portfolioId, { includeStocks: true });
  return result;
}
