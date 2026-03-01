"use server";

import { cookies } from "next/headers";

import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { openDemoPortfolio } from "./open-demo-portfolio";

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

export async function openDemoPortfolioAction() {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const result = await openDemoPortfolio(supabase, createAdminClient(), userId);

    for (const portfolioId of result.portfolioIds) {
      try {
        revalidateTransactionViews(portfolioId, { includeStocks: true });
      } catch (revalidationError) {
        console.error("Demo portfolio revalidation failed", revalidationError);
      }
    }

    return result;
  } catch (error) {
    console.error("openDemoPortfolioAction failed", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      throw error;
    }

    throw new Error(
      "Nie udało się przygotować portfela demonstracyjnego. Spróbuj ponownie."
    );
  }
}
