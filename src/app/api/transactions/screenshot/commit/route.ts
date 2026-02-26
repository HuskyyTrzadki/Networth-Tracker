import { NextResponse } from "next/server";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";

import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
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
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
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
    return NextResponse.json(
      { message: "Nie znaleźliśmy wskazanego portfela." },
      { status: 404 }
    );
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
      return NextResponse.json(
        {
          message: result.message,
          missingTickers: result.missingTickers,
        },
        { status: 400 }
      );
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
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
