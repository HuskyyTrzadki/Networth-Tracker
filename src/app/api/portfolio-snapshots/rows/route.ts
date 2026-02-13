import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  loadFullSnapshotRows,
  parseSnapshotRowsQuery,
} from "@/features/portfolio/server/snapshots/snapshot-rows-route-service";

export async function GET(request: Request) {
  // Route handler: return snapshot chart rows for authenticated user, used by lazy ALL history fetch.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedQuery = parseSnapshotRowsQuery(url.searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json(
      { message: parsedQuery.message },
      { status: parsedQuery.status }
    );
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
    const message =
      loadError instanceof Error ? loadError.message : "Failed to load snapshot rows.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
