import { NextResponse } from "next/server";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  apiError,
  apiFromUnknownError,
  apiValidationError,
} from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";
import { createPortfolioStrict } from "@/features/portfolio/server/create-portfolio";
import { bootstrapPortfolioSnapshot } from "@/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot";
import { importScreenshotHoldings } from "@/features/onboarding/server/screenshot-import-service";
import {
  screenshotImportCommitSchema,
  type ScreenshotImportCommitPayload,
} from "@/features/onboarding/lib/screenshot-import-schema";

const BOOTSTRAP_NOTE = "[SYSTEM: ONBOARDING_BOOTSTRAP]";

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = screenshotImportCommitSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const supabase = authResult.supabase;
  const supabaseAdmin = createAdminClient();
  const user = authResult.user;
  const payload: ScreenshotImportCommitPayload = parsed.data;
  try {
    const portfolio = await createPortfolioStrict(supabase, user.id, {
      name: payload.portfolio.name,
      baseCurrency: payload.portfolio.baseCurrency,
      isTaxAdvantaged: false,
    });
    const importResult = await importScreenshotHoldings({
      supabaseUser: supabase,
      supabaseAdmin,
      userId: user.id,
      portfolioId: portfolio.id,
      holdings: payload.holdings,
      notesTag: BOOTSTRAP_NOTE,
    });

    if (!importResult.ok) {
      return apiError({
        status: 400,
        code: "SCREENSHOT_IMPORT_FAILED",
        message: importResult.message,
        details: {
          missingTickers: importResult.missingTickers,
        },
        request,
      });
    }

    await Promise.all([
      bootstrapPortfolioSnapshot(
        supabase,
        supabaseAdmin,
        user.id,
        "PORTFOLIO",
        portfolio.id
      ),
      bootstrapPortfolioSnapshot(
        supabase,
        supabaseAdmin,
        user.id,
        "ALL",
        null
      ),
    ]);

    revalidateTransactionViews(portfolio.id);

    return NextResponse.json(
      {
        portfolioId: portfolio.id,
        createdHoldings: importResult.createdHoldings,
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
