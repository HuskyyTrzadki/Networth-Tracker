import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createXtbImportJob,
} from "@/features/transactions/server/xtb-import-jobs";
import { xtbImportReadyRowSchema } from "@/features/transactions/server/xtb-import/shared";

const createJobSchema = z.object({
  portfolioId: z.string().uuid(),
  rows: z.array(xtbImportReadyRowSchema).min(1),
});

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby zaimportować historię z XTB.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = createJobSchema.safeParse(parsedBody.body ?? {});
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const { data: portfolio, error: portfolioError } = await auth.supabase
    .from("portfolios")
    .select("id")
    .eq("id", parsed.data.portfolioId)
    .eq("user_id", auth.user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (portfolioError) {
    return apiFromUnknownError({
      error: portfolioError,
      request,
      fallbackCode: "XTB_IMPORT_JOB_PORTFOLIO_READ_FAILED",
    });
  }

  if (!portfolio) {
    return apiError({
      status: 404,
      code: "XTB_IMPORT_PORTFOLIO_NOT_FOUND",
      message: "Wybrany portfel nie istnieje albo nie masz do niego dostępu.",
      request,
    });
  }

  try {
    const result = await createXtbImportJob(
      createAdminClient(),
      auth.user.id,
      parsed.data.portfolioId,
      parsed.data.rows
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się uruchomić importu XTB.",
      fallbackCode: "XTB_IMPORT_JOB_CREATE_FAILED",
    });
  }
}
