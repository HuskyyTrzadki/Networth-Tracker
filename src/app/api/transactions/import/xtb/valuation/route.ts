import { NextResponse } from "next/server";
import { z } from "zod";

import { buildXtbPreviewValuation } from "@/features/transactions/server/xtb-import/build-xtb-preview-valuation";
import { xtbImportPreviewRowSchema } from "@/features/transactions/server/xtb-import/shared";
import { apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

const revalueSchema = z.object({
  baseCurrency: z.string().trim().length(3),
  rows: z.array(xtbImportPreviewRowSchema),
});

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby odświeżyć podgląd importu XTB.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = revalueSchema.safeParse(parsedBody.body ?? {});
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  try {
    const valuation = await buildXtbPreviewValuation(
      createAdminClient(),
      parsed.data.rows,
      parsed.data.baseCurrency.toUpperCase()
    );

    return NextResponse.json(valuation);
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się odświeżyć wyceny podglądu XTB.",
      fallbackCode: "XTB_IMPORT_VALUATION_FAILED",
    });
  }
}
