"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "../lib/create-portfolio-schema";
import { createPortfolioStrict } from "./create-portfolio";

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

export async function createPortfolioAction(input: CreatePortfolioInput) {
  const parsed = createPortfolioSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Nieprawidłowe dane wejściowe.");
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const result = await createPortfolioStrict(supabase, userId, parsed.data);

  revalidatePath("/portfolio");
  revalidatePath("/transactions");
  revalidateTag("portfolio:all", "max");
  revalidateTag(`portfolio:${result.id}`, "max");
  revalidateTag("transactions:all", "max");

  return result;
}
