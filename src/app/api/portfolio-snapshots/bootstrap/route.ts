import { NextResponse } from "next/server";

import { bootstrapPortfolioSnapshot } from "@/features/portfolio/server/snapshots/bootstrap-portfolio-snapshot";
import {
  parsePortfolioId,
  parseScope,
} from "@/features/portfolio/server/snapshots/rebuild-route-service";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
} from "@/lib/http/route-handler";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export async function POST(request: Request) {
  // User-triggered bootstrap to create the first snapshot point on demand.
  const authResult = await getAuthenticatedSupabase({
    unauthorizedMessage: "Unauthorized.",
  });
  if (!authResult.ok) {
    return authResult.response;
  }
  const supabaseUser = authResult.supabase;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const payload = asRecord(parsedBody.body);

  const scope = parseScope(payload.scope);
  if (!scope) {
    return NextResponse.json({ message: "Invalid scope." }, { status: 400 });
  }
  const portfolioId = parsePortfolioId(payload.portfolioId);

  const supabaseAdmin = createAdminClient();

  try {
    const result = await bootstrapPortfolioSnapshot(
      supabaseUser,
      supabaseAdmin,
      authResult.user.id,
      scope,
      portfolioId
    );

    return NextResponse.json(
      { status: result.status, hasHoldings: result.hasHoldings },
      { status: 200 }
    );
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
