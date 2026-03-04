import { NextResponse } from "next/server";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";

import { createTransaction } from "@/features/transactions/server/create-transaction";
import { createTransactionRequestSchema } from "@/features/transactions/server/schema";
import { apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
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
    return apiValidationError(parsed.error.issues, { request });
  }

  try {
    const result = await createTransaction(
      supabase,
      supabaseAdmin,
      user.id,
      parsed.data
    );

    // Invalidate read models touched by a new transaction.
    revalidateTransactionViews(parsed.data.portfolioId, { includeStocks: true });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "TRANSACTION_CREATE_FAILED",
    });
  }
}
