import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import {
  getSnapshotRebuildState,
} from "@/features/portfolio/server/snapshots/rebuild-state";
import type { SnapshotRebuildPostPayload } from "@/features/portfolio/lib/snapshot-rebuild-contract";
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
import {
  apiError,
  apiFromUnknownError,
  apiValidationError,
} from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

const logRebuildEvent = (
  event: string,
  details: Readonly<Record<string, string | number | null>>
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.info(`[snapshot-rebuild] ${event}`, details);
};

const rebuildRequestSchema = z
  .object({
    scope: z.unknown().optional(),
    portfolioId: z.unknown().optional(),
    maxDaysPerRun: z.unknown().optional(),
    timeBudgetMs: z.unknown().optional(),
  })
  .strict();


export async function GET(request: Request) {
  // Route handler: return current rebuild status for selected snapshot scope.
  const authResult = await getAuthenticatedSupabase({
    unauthorizedMessage: "Unauthorized.",
  });
  if (!authResult.ok) {
    return authResult.response;
  }
  const supabaseUser = authResult.supabase;
  const user = authResult.user;

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const portfolioId = parsePortfolioId(url.searchParams.get("portfolioId"));

  if (!scope) {
    return apiError({
      status: 400,
      code: "INVALID_SCOPE",
      message: "Invalid scope.",
    });
  }

  const access = await ensureScopeAccess(
    supabaseUser,
    user.id,
    scope,
    portfolioId
  );

  if (!access.ok) {
    return apiError({
      status: 400,
      code: "INVALID_SCOPE_ACCESS",
      message: access.message,
    });
  }

  const state = await getSnapshotRebuildState(
    supabaseUser,
    user.id,
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
  const authResult = await getAuthenticatedSupabase({
    unauthorizedMessage: "Unauthorized.",
  });
  if (!authResult.ok) {
    return authResult.response;
  }
  const supabaseUser = authResult.supabase;
  const user = authResult.user;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsedPayload = rebuildRequestSchema.safeParse(parsedBody.body ?? {});
  if (!parsedPayload.success) {
    return apiValidationError(parsedPayload.error.issues, { request });
  }
  const payload = parsedPayload.data;

  const scope = parseScope(payload?.scope);
  const portfolioId = parsePortfolioId(payload?.portfolioId);

  if (!scope) {
    return apiError({
      status: 400,
      code: "INVALID_SCOPE",
      message: "Invalid scope.",
    });
  }

  const access = await ensureScopeAccess(
    supabaseUser,
    user.id,
    scope,
    portfolioId
  );

  if (!access.ok) {
    return apiError({
      status: 400,
      code: "INVALID_SCOPE_ACCESS",
      message: access.message,
    });
  }

  try {
    logRebuildEvent("post-start", {
      userId: user.id,
      scope,
      portfolioId: access.portfolioId,
    });

    const adminClient = createAdminClient();
    const result = await runSnapshotRebuild(adminClient, {
      userId: user.id,
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
      userId: user.id,
      scope,
      portfolioId: access.portfolioId,
      status: result.state?.status ?? "idle",
      processedDays: result.processedDays,
      dirtyFrom: result.state?.dirtyFrom ?? null,
      processedUntil: result.state?.processedUntil ?? null,
    });

    const responsePayload: SnapshotRebuildPostPayload = {
      ...buildRebuildResponsePayload(result.state),
      processedDays: result.processedDays,
    };

    return NextResponse.json(
      responsePayload,
      { status: 200, headers: withRebuildPollingHeaders(responsePayload) }
    );
  } catch (runError) {
    const message = runError instanceof Error ? runError.message : "Unknown error";
    logRebuildEvent("post-error", {
      userId: user.id,
      scope,
      portfolioId: access.portfolioId,
      error: message,
    });
    return apiFromUnknownError({
      error: runError,
      request,
      fallbackCode: "SNAPSHOT_REBUILD_RUN_FAILED",
    });
  }
}
