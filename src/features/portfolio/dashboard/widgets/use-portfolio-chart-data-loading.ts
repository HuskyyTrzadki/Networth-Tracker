"use client";

import { useRouter } from "next/navigation";

import { loadFullSnapshotHistory } from "../lib/load-full-snapshot-history";
import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";
import type {
  BenchmarkId,
  DashboardBenchmarkSeries,
} from "../lib/benchmark-config";

type BootstrapPayload = Readonly<{ scope: SnapshotScope; portfolioId?: string | null }>;
type Updater<T> = T | ((current: T) => T);

type Input = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
  includesFullHistory: boolean;
  snapshotRows: readonly SnapshotChartRow[];
  shouldBootstrap: boolean;
  bootstrapPending: boolean;
  isAllHistoryLoading: boolean;
  loadedBenchmarkDatesById: Record<BenchmarkId, readonly string[]>;
  setBootstrapPending: (pending: boolean) => void;
  setBootstrapped: (bootstrapped: boolean) => void;
  setIsAllHistoryLoading: (isLoading: boolean) => void;
  setFullHistoryRows: (rows: readonly SnapshotChartRow[] | null) => void;
  setLoadingBenchmarkIds: (ids: Updater<readonly BenchmarkId[]>) => void;
  setLoadedBenchmarkDates: (
    dates: Updater<Record<BenchmarkId, readonly string[]>>
  ) => void;
  setBenchmarkSeriesOverrides: (
    overrides: Updater<Partial<DashboardBenchmarkSeries>>
  ) => void;
}>;

const bootstrapSnapshots = async (payload: BootstrapPayload) => {
  await fetch("/api/portfolio-snapshots/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export function usePortfolioChartDataLoading({
  scope,
  portfolioId,
  includesFullHistory,
  snapshotRows,
  shouldBootstrap,
  bootstrapPending,
  isAllHistoryLoading,
  loadedBenchmarkDatesById,
  setBootstrapPending,
  setBootstrapped,
  setIsAllHistoryLoading,
  setFullHistoryRows,
  setLoadingBenchmarkIds,
  setLoadedBenchmarkDates,
  setBenchmarkSeriesOverrides,
}: Input) {
  const router = useRouter();

  const ensureBenchmarkSeriesLoaded = async (
    benchmarkId: BenchmarkId,
    requiredDates: readonly string[]
  ) => {
    if (requiredDates.length === 0) return;

    const loadedDates = new Set(loadedBenchmarkDatesById[benchmarkId]);
    const hasAllRequiredDates = requiredDates.every((date) => loadedDates.has(date));
    if (hasAllRequiredDates) return;

    setLoadingBenchmarkIds((current) =>
      current.includes(benchmarkId) ? current : [...current, benchmarkId]
    );

    const response = await fetch("/api/benchmarks/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        benchmarkId,
        bucketDates: requiredDates,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setLoadingBenchmarkIds((current) => current.filter((id) => id !== benchmarkId));
      return;
    }

    const payload = (await response.json()) as {
      benchmarkId?: BenchmarkId;
      points?: DashboardBenchmarkSeries["SP500"];
    };

    if (payload.benchmarkId !== benchmarkId || !payload.points) {
      setLoadingBenchmarkIds((current) => current.filter((id) => id !== benchmarkId));
      return;
    }

    setBenchmarkSeriesOverrides((current) => ({
      ...current,
      [benchmarkId]: payload.points,
    }));
    setLoadedBenchmarkDates((current) => ({
      ...current,
      [benchmarkId]: Array.from(
        new Set([...(current[benchmarkId] ?? []), ...requiredDates])
      ),
    }));
    setLoadingBenchmarkIds((current) => current.filter((id) => id !== benchmarkId));
  };

  const ensureAllHistoryLoaded = async (): Promise<readonly SnapshotChartRow[] | null> => {
    if (includesFullHistory || isAllHistoryLoading) {
      return includesFullHistory ? snapshotRows : null;
    }

    setIsAllHistoryLoading(true);
    const payload = await loadFullSnapshotHistory({
      scope,
      portfolioId,
    });

    if (!payload) {
      setIsAllHistoryLoading(false);
      return null;
    }

    if (payload.includesFullHistory) {
      setFullHistoryRows(payload.rows);
    }

    setIsAllHistoryLoading(false);
    return payload.rows;
  };

  const handleBootstrapRequest = async () => {
    if (!shouldBootstrap || bootstrapPending) return;

    setBootstrapPending(true);
    const payload = scope === "PORTFOLIO" ? { scope, portfolioId } : { scope };
    const success = await bootstrapSnapshots(payload)
      .then(() => true)
      .catch(() => false);

    setBootstrapPending(false);
    if (!success) return;

    setBootstrapped(true);
    router.refresh();
  };

  return {
    ensureBenchmarkSeriesLoaded,
    ensureAllHistoryLoaded,
    handleBootstrapRequest,
  };
}
