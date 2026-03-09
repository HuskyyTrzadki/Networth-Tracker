import { NextResponse } from "next/server";
import { z } from "zod";

import { createBrokerImportJob } from "@/features/transactions/server/broker-import-jobs";
import { requireBrokerImportProvider } from "@/features/transactions/server/broker-import/provider-registry";
import { brokerImportReadyRowSchema } from "@/features/transactions/server/broker-import/shared";
import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

const createJobSchema = z.object({
  portfolioId: z.string().uuid(),
  rows: z.array(brokerImportReadyRowSchema).min(1),
});

type Props = Readonly<{
  params: Promise<{
    provider: string;
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

  const parsed = createJobSchema.safeParse(parsedBody.body ?? {});
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const { provider: providerParam } = await params;

  try {
    const provider = requireBrokerImportProvider(providerParam as never);
    if (parsed.data.rows.some((row) => row.provider !== provider.id)) {
      return apiValidationError([{ message: "Payload importu ma innego providera niż ścieżka API.", path: ["rows"], code: "custom" }], {
        request,
        message: "Provider importu nie zgadza się z payloadem.",
      });
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
        fallbackCode: "BROKER_IMPORT_JOB_PORTFOLIO_READ_FAILED",
      });
    }

    if (!portfolio) {
      return apiError({
        status: 404,
        code: "BROKER_IMPORT_PORTFOLIO_NOT_FOUND",
        message: "Wybrany portfel nie istnieje albo nie masz do niego dostępu.",
        request,
      });
    }

    const result = await createBrokerImportJob(
      createAdminClient(),
      auth.user.id,
      provider.id,
      parsed.data.portfolioId,
      parsed.data.rows
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się uruchomić importu brokera.",
      fallbackCode: "BROKER_IMPORT_JOB_CREATE_FAILED",
    });
  }
}
