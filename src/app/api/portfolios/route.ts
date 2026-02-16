import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { createPortfolioStrict } from "@/features/portfolio/server/create-portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createPortfolioSchema } from "@/features/portfolio/lib/create-portfolio-schema";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
} from "@/lib/http/route-handler";

export async function GET() {
  // Route handler: authenticate and return the user's portfolios.
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const portfolios = await listPortfolios(authResult.supabase);
    return NextResponse.json(
      { portfolios },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Data-Source": "supabase-rls",
          "X-Cache-Policy": "private-runtime",
          "X-Cache-Tags": "portfolio:all",
        },
      }
    );
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  // Route handler: validate input, create a portfolio, return JSON.
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }
  const supabase = authResult.supabase;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = createPortfolioSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await createPortfolioStrict(
      supabase,
      authResult.user.id,
      parsed.data
    );

    // Refresh portfolio navigation and aggregate views after creation.
    revalidatePath("/portfolio");
    revalidatePath("/transactions");
    revalidateTag("portfolio:all", "max");
    revalidateTag(`portfolio:${result.id}`, "max");
    revalidateTag("transactions:all", "max");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
