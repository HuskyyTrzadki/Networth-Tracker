import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  apiFromUnknownError,
  apiValidationError,
} from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";
import { getTransactionDialogBalances } from "@/features/transactions/server/get-transaction-dialog-balances";

const requestSchema = z.object({
  portfolioId: z.string().uuid(),
});

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = requestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const supabase = authResult.supabase;
  const portfolioId = parsed.data.portfolioId;

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId)
    .single();

  if (portfolioError || !portfolio) {
    return apiError({
      status: 404,
      code: "PORTFOLIO_NOT_FOUND",
      message: "Portfolio not found.",
      request,
    });
  }

  try {
    const balances = await getTransactionDialogBalances(supabase, portfolioId);
    return NextResponse.json(balances, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "TRANSACTION_DIALOG_BALANCES_FAILED",
      fallbackMessage: "Nie udało się pobrać stanu portfela.",
    });
  }
}
