import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createPortfolioStrict } from "@/features/portfolio/server/create-portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createPortfolioSchema } from "@/features/portfolio/lib/create-portfolio-schema";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Route handler: authenticate and return the user's portfolios.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolios = await listPortfolios(supabase);
    return NextResponse.json({ portfolios }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  // Route handler: validate input, create a portfolio, return JSON.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createPortfolioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await createPortfolioStrict(
      supabase,
      data.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
