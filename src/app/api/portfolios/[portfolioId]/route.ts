import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { deletePortfolioById } from "@/features/portfolio/server/delete-portfolio";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedSupabase,
  toErrorMessage,
} from "@/lib/http/route-handler";

type Props = Readonly<{
  params: Promise<{
    portfolioId: string;
  }>;
}>;

export async function DELETE(_request: Request, { params }: Props) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { portfolioId } = await params;
  const normalizedPortfolioId = portfolioId.trim();

  if (normalizedPortfolioId.length === 0) {
    return NextResponse.json({ message: "Brak identyfikatora portfela." }, { status: 400 });
  }

  try {
    const result = await deletePortfolioById(
      authResult.supabase,
      createAdminClient(),
      authResult.user.id,
      normalizedPortfolioId
    );

    revalidatePath("/portfolio");
    revalidatePath(`/portfolio/${result.portfolioId}`);
    revalidatePath("/transactions");
    revalidateTag("portfolio:all", "max");
    revalidateTag(`portfolio:${result.portfolioId}`, "max");
    revalidateTag("transactions:all", "max");
    revalidateTag(`transactions:portfolio:${result.portfolioId}`, "max");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    const status = message.includes("nie istnieje") || message.includes("dostępu") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}
