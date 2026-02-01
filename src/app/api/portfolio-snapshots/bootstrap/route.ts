import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { bootstrapPortfolioSnapshot } from "@/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SnapshotScope } from "@/features/portfolio/server/snapshots/types";

const parseScope = (value: unknown): SnapshotScope | null => {
  if (value === "ALL" || value === "PORTFOLIO") return value;
  return null;
};

export async function POST(request: Request) {
  // User-triggered bootstrap to create the first snapshot point on demand.
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);
  const { data, error } = await supabaseUser.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { scope?: unknown; portfolioId?: unknown }
    | null;

  const scope = parseScope(payload?.scope);
  if (!scope) {
    return NextResponse.json({ message: "Invalid scope." }, { status: 400 });
  }

  const portfolioIdRaw = payload?.portfolioId;
  const portfolioId =
    typeof portfolioIdRaw === "string" && portfolioIdRaw.trim().length > 0
      ? portfolioIdRaw
      : null;

  const supabaseAdmin = createAdminClient();

  try {
    const result = await bootstrapPortfolioSnapshot(
      supabaseUser,
      supabaseAdmin,
      data.user.id,
      scope,
      portfolioId
    );

    return NextResponse.json(
      { status: result.status, hasHoldings: result.hasHoldings },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bootstrap snapshot failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
