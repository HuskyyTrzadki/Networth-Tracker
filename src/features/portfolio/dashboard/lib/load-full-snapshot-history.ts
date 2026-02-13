import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";

type SnapshotRowsApiResponse = Readonly<{
  hasSnapshots: boolean;
  includesFullHistory: boolean;
  rows: readonly SnapshotChartRow[];
}>;

type LoadFullSnapshotHistoryArgs = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
}>;

export const loadFullSnapshotHistory = async ({
  scope,
  portfolioId,
}: LoadFullSnapshotHistoryArgs): Promise<SnapshotRowsApiResponse | null> => {
  const query = new URLSearchParams({ scope });
  if (scope === "PORTFOLIO" && portfolioId) {
    query.set("portfolioId", portfolioId);
  }

  try {
    const response = await fetch(`/api/portfolio-snapshots/rows?${query.toString()}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as SnapshotRowsApiResponse;
    if (!Array.isArray(payload.rows)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
