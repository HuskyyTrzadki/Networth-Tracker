import { NextResponse } from "next/server";

import { getBrokerImportJob } from "@/features/transactions/server/broker-import-jobs";
import { requireBrokerImportProvider } from "@/features/transactions/server/broker-import/provider-registry";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    provider: string;
    runId: string;
  }>;
}>;

export async function GET(request: Request, { params }: Props) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby odczytać status importu brokera.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const { provider: providerParam, runId } = await params;

  try {
    const provider = requireBrokerImportProvider(providerParam as never);
    const run = await getBrokerImportJob(auth.supabase, auth.user.id, runId);

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
      fallbackMessage: "Nie udało się odczytać statusu importu brokera.",
      fallbackCode: "BROKER_IMPORT_JOB_READ_FAILED",
    });
  }
}
