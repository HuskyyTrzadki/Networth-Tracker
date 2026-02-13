import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import {
  getSnapshotRebuildState,
} from "@/features/portfolio/server/snapshots/rebuild-state";
import {
  buildRebuildResponsePayload,
  ensureScopeAccess,
  parseMaxDays,
  parsePortfolioId,
  parseScope,
  parseTimeBudgetMs,
  withRebuildPollingHeaders,
} from "@/features/portfolio/server/snapshots/rebuild-route-service";
import { runSnapshotRebuild } from "@/features/portfolio/server/snapshots/run-snapshot-rebuild";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const logRebuildEvent = (
  event: string,
  details: Readonly<Record<string, string | number | null>>
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.info(`[snapshot-rebuild] ${event}`, details);
};


export async function GET(request: Request) {
  // Route handler: return current rebuild status for selected snapshot scope.
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const portfolioId = parsePortfolioId(url.searchParams.get("portfolioId"));

  if (!scope) {
    return NextResponse.json({ message: "Invalid scope." }, { status: 400 });
  }

  const access = await ensureScopeAccess(
    supabaseUser,
    data.user.id,
    scope,
    portfolioId
  );

  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: 400 });
  }

  const state = await getSnapshotRebuildState(
    supabaseUser,
    data.user.id,
    scope,
    access.portfolioId
  );

  const responsePayload = buildRebuildResponsePayload(state);
  const cacheTags =
    scope === "PORTFOLIO" && access.portfolioId
      ? `portfolio:${access.portfolioId},portfolio:all`
      : "portfolio:all";
  const pollingHeaders = withRebuildPollingHeaders(responsePayload);

  return NextResponse.json(
    responsePayload,
    {
      status: 200,
      headers: {
        ...pollingHeaders,
        "Cache-Control": "private, no-store",
        "X-Data-Source": "snapshot-rebuild-state",
        "X-Cache-Policy": "private-runtime",
        "X-Cache-Tags": cacheTags,
      },
    }
  );
}

export async function POST(request: Request) {
  // Route handler: process rebuild work for selected scope (may include multiple chunks per run).
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        scope?: unknown;
        portfolioId?: unknown;
        maxDaysPerRun?: unknown;
        timeBudgetMs?: unknown;
      }
    | null;

  const scope = parseScope(payload?.scope);
  const portfolioId = parsePortfolioId(payload?.portfolioId);

  if (!scope) {
    return NextResponse.json({ message: "Invalid scope." }, { status: 400 });
  }

  const access = await ensureScopeAccess(
    supabaseUser,
    data.user.id,
    scope,
    portfolioId
  );

  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: 400 });
  }

  try {
    logRebuildEvent("post-start", {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
    });

    const adminClient = createAdminClient();
    const result = await runSnapshotRebuild(adminClient, {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
      maxDaysPerRun: parseMaxDays(payload?.maxDaysPerRun),
      timeBudgetMs: parseTimeBudgetMs(payload?.timeBudgetMs),
    });

    if (result.processedDays > 0) {
      // Rebuild changed snapshot-backed read models; invalidate tagged/private cached views.
      revalidateTag("portfolio:all", "max");
      revalidatePath("/portfolio");

      if (access.portfolioId) {
        revalidateTag(`portfolio:${access.portfolioId}`, "max");
        revalidatePath(`/portfolio/${access.portfolioId}`);
      }
    }

    logRebuildEvent("post-finish", {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
      status: result.state?.status ?? "idle",
      processedDays: result.processedDays,
      dirtyFrom: result.state?.dirtyFrom ?? null,
      processedUntil: result.state?.processedUntil ?? null,
    });

    const responsePayload = {
      ...buildRebuildResponsePayload(result.state),
      processedDays: result.processedDays,
    };

    return NextResponse.json(
      responsePayload,
      { status: 200, headers: withRebuildPollingHeaders(responsePayload) }
    );
  } catch (runError) {
    const message =
      runError instanceof Error ? runError.message : "Snapshot rebuild failed.";
    logRebuildEvent("post-error", {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
      error: message,
    });
    return NextResponse.json({ message }, { status: 400 });
  }
}
