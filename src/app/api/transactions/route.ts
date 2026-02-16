import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { createTransaction } from "@/features/transactions/server/create-transaction";
import { createTransactionRequestSchema } from "@/features/transactions/server/schema";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
} from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Route handler: validate input, call the feature service, return JSON.
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const supabase = authResult.supabase;
  const user = authResult.user;
  const supabaseAdmin = createAdminClient();
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = createTransactionRequestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await createTransaction(
      supabase,
      supabaseAdmin,
      user.id,
      parsed.data
    );

    // Invalidate read models touched by a new transaction.
    revalidatePath("/portfolio");
    revalidatePath(`/portfolio/${parsed.data.portfolioId}`);
    revalidatePath("/transactions");
    revalidatePath("/stocks");
    revalidateTag("portfolio:all", "max");
    revalidateTag(`portfolio:${parsed.data.portfolioId}`, "max");
    revalidateTag("transactions:all", "max");
    revalidateTag(`transactions:portfolio:${parsed.data.portfolioId}`, "max");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
