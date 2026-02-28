"use server";

import { cookies } from "next/headers";

import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { deletePortfolioById } from "./delete-portfolio";

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

const normalizePortfolioId = (portfolioId: string) => {
  const normalized = portfolioId.trim();
  if (!normalized) {
    throw new Error("Brak identyfikatora portfela.");
  }
  return normalized;
};

export async function deletePortfolioAction(portfolioId: string) {
  const normalizedPortfolioId = normalizePortfolioId(portfolioId);
  const { supabase, userId } = await getAuthenticatedContext();
  const result = await deletePortfolioById(
    supabase,
    createAdminClient(),
    userId,
    normalizedPortfolioId
  );

  revalidateTransactionViews(result.portfolioId);
  return result;
}
