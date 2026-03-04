import { NextResponse } from "next/server";

import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";
import {
  loadFullSnapshotRows,
  parseSnapshotRowsQuery,
} from "@/features/portfolio/server/snapshots/snapshot-rows-route-service";

export async function GET(request: Request) {
  // Route handler: return snapshot chart rows for authenticated user, used by lazy ALL history fetch.
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }
  const supabase = authResult.supabase;

  const url = new URL(request.url);
  const parsedQuery = parseSnapshotRowsQuery(url.searchParams);
  if (!parsedQuery.ok) {
    return apiError({
      status: parsedQuery.status,
      code: "VALIDATION_ERROR",
      message: parsedQuery.message,
      request,
    });
  }

  try {
    const rows = await loadFullSnapshotRows({
      supabase,
      scope: parsedQuery.scope,
      portfolioId: parsedQuery.portfolioId,
    });

    return NextResponse.json(rows, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Data-Source": "portfolio-snapshots",
        "X-Cache-Policy": "private-runtime",
        "X-Cache-Tags":
          parsedQuery.scope === "PORTFOLIO"
            ? `portfolio:${parsedQuery.portfolioId}`
            : "portfolio:all",
      },
    });
  } catch (loadError) {
    return apiFromUnknownError({
      error: loadError,
      request,
      fallbackCode: "SNAPSHOT_ROWS_LOAD_FAILED",
      fallbackMessage: "Failed to load snapshot rows.",
    });
  }
}
