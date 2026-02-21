import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { deleteTransactionGroupByTransactionId } from "@/features/transactions/server/delete-transaction-group";
import { updateTransactionById } from "@/features/transactions/server/update-transaction";
import { updateTransactionRequestSchema } from "@/features/transactions/server/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
} from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    transactionId: string;
  }>;
}>;

const revalidateTransactionViews = (portfolioId: string) => {
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${portfolioId}`);
  revalidatePath("/transactions");
  revalidatePath("/stocks");
  revalidateTag("portfolio:all", "max");
  revalidateTag(`portfolio:${portfolioId}`, "max");
  revalidateTag("transactions:all", "max");
  revalidateTag(`transactions:portfolio:${portfolioId}`, "max");
};

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
    return NextResponse.json({ message: "Brak identyfikatora transakcji." }, { status: 400 });
  }

  try {
    const result = await deleteTransactionGroupByTransactionId(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedId
    );

    revalidateTransactionViews(result.portfolioId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    const status =
      message.includes("nie istnieje") || message.includes("dostępu") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request, { params }: Props) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const normalizedId = await resolveTransactionId(params);
  if (!normalizedId) {
    return NextResponse.json({ message: "Brak identyfikatora transakcji." }, { status: 400 });
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = updateTransactionRequestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await updateTransactionById(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedId,
      parsed.data
    );

    revalidateTransactionViews(result.portfolioId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    const status =
      message.includes("nie istnieje") || message.includes("dostępu") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}
