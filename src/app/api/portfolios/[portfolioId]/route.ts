import { NextResponse } from "next/server";

import { deletePortfolioById } from "@/features/portfolio/server/delete-portfolio";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
} from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    portfolioId: string;
  }>;
}>;

export async function DELETE(_request: Request, { params }: Props) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { portfolioId } = await params;
  const normalizedPortfolioId = portfolioId.trim();

  if (normalizedPortfolioId.length === 0) {
    return apiError({
      status: 400,
      code: "PORTFOLIO_ID_REQUIRED",
      message: "Brak identyfikatora portfela.",
    });
  }

  try {
    const result = await deletePortfolioById(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedPortfolioId
    );

    revalidateTransactionViews(result.portfolioId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      fallbackCode: "PORTFOLIO_DELETE_FAILED",
    });
  }
}
