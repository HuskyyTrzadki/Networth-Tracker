import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { deleteTransactionGroupByTransactionId } from "@/features/transactions/server/delete-transaction-group";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedSupabase,
  toErrorMessage,
} from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    transactionId: string;
  }>;
}>;

export async function DELETE(_request: Request, { params }: Props) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { transactionId } = await params;
  const normalizedId = transactionId.trim();
  if (normalizedId.length === 0) {
    return NextResponse.json({ message: "Brak identyfikatora transakcji." }, { status: 400 });
  }

  try {
    const result = await deleteTransactionGroupByTransactionId(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedId
    );

    revalidatePath("/portfolio");
    revalidatePath(`/portfolio/${result.portfolioId}`);
    revalidatePath("/transactions");
    revalidatePath("/stocks");
    revalidateTag("portfolio:all", "max");
    revalidateTag(`portfolio:${result.portfolioId}`, "max");
    revalidateTag("transactions:all", "max");
    revalidateTag(`transactions:portfolio:${result.portfolioId}`, "max");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    const status =
      message.includes("nie istnieje") || message.includes("dostępu") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}
