import { NextResponse } from "next/server";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";

import { deleteTransactionGroupByTransactionId } from "@/features/transactions/server/delete-transaction-group";
import { updateTransactionById } from "@/features/transactions/server/update-transaction";
import { updateTransactionRequestSchema } from "@/features/transactions/server/schema";
import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    transactionId: string;
  }>;
}>;

const resolveTransactionId = async (params: Props["params"]) => {
  const { transactionId } = await params;
  const normalizedId = transactionId.trim();
  if (normalizedId.length === 0) {
    return null;
  }

  return normalizedId;
};

export async function DELETE(_request: Request, { params }: Props) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const normalizedId = await resolveTransactionId(params);
  if (!normalizedId) {
    return apiError({
      status: 400,
      code: "TRANSACTION_ID_REQUIRED",
      message: "Brak identyfikatora transakcji.",
    });
  }

  try {
    const result = await deleteTransactionGroupByTransactionId(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedId
    );

    revalidateTransactionViews(result.portfolioId, { includeStocks: true });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      fallbackCode: "TRANSACTION_DELETE_FAILED",
    });
  }
}

export async function PUT(request: Request, { params }: Props) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const normalizedId = await resolveTransactionId(params);
  if (!normalizedId) {
    return apiError({
      status: 400,
      code: "TRANSACTION_ID_REQUIRED",
      message: "Brak identyfikatora transakcji.",
    });
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = updateTransactionRequestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  try {
    const result = await updateTransactionById(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedId,
      parsed.data
    );

    revalidateTransactionViews(result.portfolioId, { includeStocks: true });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "TRANSACTION_UPDATE_FAILED",
    });
  }
}
