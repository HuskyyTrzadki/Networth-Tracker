import { NextResponse } from "next/server";
import { z } from "zod";

import { runBrokerImportJob } from "@/features/transactions/server/broker-import-jobs";
import { requireBrokerImportProvider } from "@/features/transactions/server/broker-import/provider-registry";
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
    provider: string;
    runId: string;
  }>;
}>;

export async function POST(request: Request, { params }: Props) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby uruchomić import brokera.",
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

  const { provider: providerParam, runId } = await params;

  try {
    const provider = requireBrokerImportProvider(providerParam as never);
    const run = await runBrokerImportJob(
      auth.supabase,
      createAdminClient(),
      auth.user.id,
      runId,
      parsedPayload.data
    );

    if (!run || run.provider !== provider.id) {
      return apiError({
        status: 404,
        code: "BROKER_IMPORT_RUN_NOT_FOUND",
        message: "Nie znaleziono importu brokera.",
        request,
      });
    }

    return NextResponse.json(
      { run },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się przetworzyć kolejnej partii importu brokera.",
      fallbackCode: "BROKER_IMPORT_JOB_RUN_FAILED",
    });
  }
}
