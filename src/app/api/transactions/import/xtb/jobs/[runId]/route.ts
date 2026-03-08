import { NextResponse } from "next/server";

import { getXtbImportJob } from "@/features/transactions/server/xtb-import-jobs";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    runId: string;
  }>;
}>;

export async function GET(request: Request, { params }: Props) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby śledzić import XTB.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const { runId } = await params;

  try {
    const run = await getXtbImportJob(auth.supabase, auth.user.id, runId);
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
      fallbackMessage: "Nie udało się odczytać statusu importu XTB.",
      fallbackCode: "XTB_IMPORT_JOB_READ_FAILED",
    });
  }
}
