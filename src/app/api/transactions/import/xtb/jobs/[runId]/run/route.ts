import { NextResponse } from "next/server";
import { z } from "zod";

import { runXtbImportJob } from "@/features/transactions/server/xtb-import-jobs";
import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

const runPayloadSchema = z
  .object({
    maxRowsPerRun: z.number().int().positive().max(500).optional(),
    timeBudgetMs: z.number().int().positive().max(10_000).optional(),
  })
  .strict();

type Props = Readonly<{
  params: Promise<{
    runId: string;
  }>;
}>;

export async function POST(request: Request, { params }: Props) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby uruchomić import XTB.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsedPayload = runPayloadSchema.safeParse(parsedBody.body ?? {});
  if (!parsedPayload.success) {
    return apiValidationError(parsedPayload.error.issues, { request });
  }

  const { runId } = await params;

  try {
    const run = await runXtbImportJob(
      auth.supabase,
      createAdminClient(),
      auth.user.id,
      runId,
      parsedPayload.data
    );

    if (!run) {
      return apiError({
        status: 404,
        code: "XTB_IMPORT_RUN_NOT_FOUND",
        message: "Nie znaleziono importu XTB.",
        request,
      });
    }

    return NextResponse.json({ run }, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się przetworzyć kolejnej partii importu XTB.",
      fallbackCode: "XTB_IMPORT_JOB_RUN_FAILED",
    });
  }
}
