import type { SupabaseClient } from "@supabase/supabase-js";

import type { SnapshotScope } from "./types";
import { getPortfolioSnapshotRows } from "./get-portfolio-snapshot-rows";

type ParsedSnapshotRowsQuery =
  | Readonly<{
      ok: true;
      scope: SnapshotScope;
      portfolioId: string | null;
    }>
  | Readonly<{
      ok: false;
      message: string;
      status: number;
    }>;

export const parseSnapshotRowsQuery = (
  searchParams: URLSearchParams
): ParsedSnapshotRowsQuery => {
  const rawScope = searchParams.get("scope");
  if (rawScope !== "ALL" && rawScope !== "PORTFOLIO") {
    return {
      ok: false,
      message: "Invalid scope. Expected ALL or PORTFOLIO.",
      status: 400,
    };
  }

  if (rawScope === "ALL") {
    return {
      ok: true,
      scope: "ALL",
      portfolioId: null,
    };
  }

  const rawPortfolioId = searchParams.get("portfolioId");
  const portfolioId = rawPortfolioId?.trim() ?? "";
  if (!portfolioId) {
    return {
      ok: false,
      message: "Missing portfolioId for PORTFOLIO scope.",
      status: 400,
    };
  }

  return {
    ok: true,
    scope: "PORTFOLIO",
    portfolioId,
  };
};

type LoadSnapshotRowsArgs = Readonly<{
  supabase: SupabaseClient;
  scope: SnapshotScope;
  portfolioId: string | null;
}>;

export const loadFullSnapshotRows = async ({
  supabase,
  scope,
  portfolioId,
}: LoadSnapshotRowsArgs) =>
  getPortfolioSnapshotRows(supabase, scope, portfolioId);
