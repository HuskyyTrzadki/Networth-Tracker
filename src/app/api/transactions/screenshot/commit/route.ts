import { NextResponse } from "next/server";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";

import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { importScreenshotHoldings } from "@/features/onboarding/server/screenshot-import-service";
import {
  screenshotPortfolioImportSchema,
  type ScreenshotPortfolioImportPayload,
} from "@/features/transactions/lib/screenshot-import-schema";

const IMPORT_NOTE = "[SYSTEM: SCREENSHOT_IMPORT]";

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = screenshotPortfolioImportSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const supabase = authResult.supabase;
  const supabaseAdmin = createAdminClient();
  const user = authResult.user;
  const payload: ScreenshotPortfolioImportPayload = parsed.data;

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", payload.portfolioId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (portfolioError || !portfolio) {
    return apiError({
      status: 404,
      code: "PORTFOLIO_NOT_FOUND",
      message: "Nie znaleźliśmy wskazanego portfela.",
      request,
    });
  }

  try {
    const result = await importScreenshotHoldings({
      supabaseUser: supabase,
      supabaseAdmin,
      userId: user.id,
      portfolioId: payload.portfolioId,
      holdings: payload.holdings,
      notesTag: IMPORT_NOTE,
    });

    if (!result.ok) {
      return apiError({
        status: 400,
        code: "SCREENSHOT_IMPORT_FAILED",
        message: result.message,
        details: {
          missingTickers: result.missingTickers,
        },
        request,
      });
    }

    revalidateTransactionViews(payload.portfolioId, { includeStocks: true });

    return NextResponse.json(
      {
        portfolioId: payload.portfolioId,
        createdHoldings: result.createdHoldings,
      },
      { status: 200 }
    );
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "SCREENSHOT_COMMIT_FAILED",
    });
  }
}
