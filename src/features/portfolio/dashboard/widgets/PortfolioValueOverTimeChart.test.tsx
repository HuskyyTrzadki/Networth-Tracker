import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioValueOverTimeChart } from "./PortfolioValueOverTimeChart";
import { loadFullSnapshotHistory } from "../lib/load-full-snapshot-history";
import { buildPortfolioValueOverTimeViewModel } from "../lib/portfolio-value-over-time-view-model";

const refreshSpy = vi.fn();
let latestContentProps: Record<string, unknown> | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshSpy,
  }),
}));

vi.mock("../lib/load-full-snapshot-history", () => ({
  loadFullSnapshotHistory: vi.fn(),
}));

vi.mock("../lib/portfolio-value-over-time-view-model", () => ({
  buildPortfolioValueOverTimeViewModel: vi.fn(() => ({
    isRangeDisabled: () => false,
    comparisonOptions: [],
    hasValuePoints: true,
    selectedPeriodAbsoluteChange: null,
    selectedPeriodChangePercent: null,
    comparisonChartData: [],
    investedCapitalSeries: [],
    hasPerformanceData: true,
    nominalPeriodReturn: null,
    selectedPeriodPerformanceAbsoluteChange: null,
    cumulativeChartData: [],
    activeComparisonLines: [],
    getRequiredBenchmarkDates: () => ["2026-01-10"],
  })),
}));

vi.mock("./PortfolioValueOverTimeChartContent", () => ({
  PortfolioValueOverTimeChartContent: (props: Record<string, unknown>) => {
    latestContentProps = props;
    const contentProps = props as {
      range: string;
      onRangeChange: (range: "ALL") => void;
      onComparisonChange: (id: "SP500" | "WIG20", enabled: boolean) => void;
      onBootstrapRequest: () => void;
    };

    return (
      <div>
        <span data-testid="range">{contentProps.range}</span>
        <button onClick={() => contentProps.onRangeChange("ALL")}>set-all</button>
        <button onClick={() => contentProps.onComparisonChange("SP500", true)}>
          enable-sp500
        </button>
        <button onClick={() => contentProps.onComparisonChange("WIG20", true)}>
          enable-wig20
        </button>
        <button onClick={() => contentProps.onBootstrapRequest()}>bootstrap</button>
      </div>
    );
  },
}));

const rows = [
  {
    bucketDate: "2026-01-09",
    totalValuePln: 100,
    totalValueUsd: 20,
    totalValueEur: 25,
    netExternalCashflowPln: 0,
    netExternalCashflowUsd: 0,
    netExternalCashflowEur: 0,
    netImplicitTransferPln: 0,
    netImplicitTransferUsd: 0,
    netImplicitTransferEur: 0,
    isPartialPln: false,
    isPartialUsd: false,
    isPartialEur: false,
  },
  {
    bucketDate: "2026-01-10",
    totalValuePln: 110,
    totalValueUsd: 22,
    totalValueEur: 27,
    netExternalCashflowPln: 0,
    netExternalCashflowUsd: 0,
    netExternalCashflowEur: 0,
    netImplicitTransferPln: 0,
    netImplicitTransferUsd: 0,
    netImplicitTransferEur: 0,
    isPartialPln: false,
    isPartialUsd: false,
    isPartialEur: false,
  },
] as const;

const rebuild = {
  status: "idle",
  dirtyFrom: null,
  fromDate: null,
  toDate: null,
  processedUntil: null,
  progressPercent: null,
  message: null,
  isBusy: false,
} as const;

const liveTotalsByCurrency = {
  PLN: {
    totalValue: 120,
    isPartial: false,
    missingQuotes: 0,
    missingFx: 0,
    asOf: "2026-01-10T00:00:00.000Z",
  },
  USD: {
    totalValue: 30,
    isPartial: false,
    missingQuotes: 0,
    missingFx: 0,
    asOf: "2026-01-10T00:00:00.000Z",
  },
  EUR: {
    totalValue: 28,
    isPartial: false,
    missingQuotes: 0,
    missingFx: 0,
    asOf: "2026-01-10T00:00:00.000Z",
  },
} as const;

const getLatestViewModelInput = () => {
  const latestCall = vi.mocked(buildPortfolioValueOverTimeViewModel).mock.calls.at(-1);
  return latestCall?.[0] ?? null;
};

type BenchmarkSeriesResponseResolver = (
  value: { ok: boolean; json: () => Promise<unknown> }
) => void;

describe("PortfolioValueOverTimeChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestContentProps = null;

    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          benchmarkId: "SP500",
          points: [],
        }),
      })
    );
    vi.mocked(loadFullSnapshotHistory).mockResolvedValue({
      hasSnapshots: true,
      includesFullHistory: true,
      rows,
    });
  });

  it("hydrates range from localStorage", async () => {
    localStorage.setItem("portfolio:chart-range:ALL:all", "1M");

    render(
      <PortfolioValueOverTimeChart
        scope="ALL"
        portfolioId={null}
        hasHoldings
        hasSnapshots
        initialIncludesFullHistory={false}
        rows={rows}
        todayBucketDate="2026-01-10"
        liveTotalsByCurrency={liveTotalsByCurrency}
        polishCpiSeries={[]}
        benchmarkSeries={{ SP500: [], WIG20: [], MWIG40: [] }}
        rebuild={rebuild}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("range")).toHaveTextContent("1M");
    });
  });

  it("loads full history when ALL range is selected", async () => {
    render(
      <PortfolioValueOverTimeChart
        scope="PORTFOLIO"
        portfolioId="p1"
        hasHoldings
        hasSnapshots
        initialIncludesFullHistory={false}
        rows={rows}
        todayBucketDate="2026-01-10"
        liveTotalsByCurrency={liveTotalsByCurrency}
        polishCpiSeries={[]}
        benchmarkSeries={{ SP500: [], WIG20: [], MWIG40: [] }}
        rebuild={rebuild}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "set-all" }));

    await waitFor(() => {
      expect(vi.mocked(loadFullSnapshotHistory)).toHaveBeenCalledWith({
        scope: "PORTFOLIO",
        portfolioId: "p1",
      });
    });
  });

  it("fetches benchmark series when comparison is enabled", async () => {
    render(
      <PortfolioValueOverTimeChart
        scope="ALL"
        portfolioId={null}
        hasHoldings
        hasSnapshots
        initialIncludesFullHistory={false}
        rows={rows}
        todayBucketDate="2026-01-10"
        liveTotalsByCurrency={liveTotalsByCurrency}
        polishCpiSeries={[]}
        benchmarkSeries={{ SP500: [], WIG20: [], MWIG40: [] }}
        rebuild={rebuild}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "enable-sp500" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/benchmarks/series",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(latestContentProps).not.toBeNull();
  });

  it("merges overlapping benchmark responses without dropping earlier overlays", async () => {
    const resolvers: Partial<
      Record<"SP500" | "WIG20", BenchmarkSeriesResponseResolver>
    > = {};

    vi.stubGlobal(
      "fetch",
      vi.fn((input: string, init?: RequestInit) => {
        if (input !== "/api/benchmarks/series") {
          return Promise.reject(new Error(`Unexpected fetch: ${input}`));
        }

        const body = JSON.parse(String(init?.body ?? "{}")) as { benchmarkId?: string };

        if (body.benchmarkId === "SP500") {
          return new Promise((resolve) => {
            resolvers.SP500 = resolve as BenchmarkSeriesResponseResolver;
          });
        }

        if (body.benchmarkId === "WIG20") {
          return new Promise((resolve) => {
            resolvers.WIG20 = resolve as BenchmarkSeriesResponseResolver;
          });
        }

        return Promise.reject(new Error(`Unexpected benchmark: ${body.benchmarkId}`));
      })
    );

    render(
      <PortfolioValueOverTimeChart
        scope="ALL"
        portfolioId={null}
        hasHoldings
        hasSnapshots
        initialIncludesFullHistory={false}
        rows={rows}
        todayBucketDate="2026-01-10"
        liveTotalsByCurrency={liveTotalsByCurrency}
        polishCpiSeries={[]}
        benchmarkSeries={{ SP500: [], WIG20: [], MWIG40: [] }}
        rebuild={rebuild}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "enable-sp500" }));
    fireEvent.click(screen.getByRole("button", { name: "enable-wig20" }));

    const resolveWig20 = resolvers.WIG20;
    expect(resolveWig20).toBeDefined();
    if (!resolveWig20) {
      throw new Error("WIG20 resolver was not registered");
    }

    resolveWig20({
      ok: true,
      json: async () => ({
        benchmarkId: "WIG20",
        points: [
          { date: "2026-01-09", PLN: 100, USD: 25, EUR: 24 },
          { date: "2026-01-10", PLN: 101, USD: 25.25, EUR: 24.2 },
        ],
      }),
    });

    await waitFor(() => {
      expect(getLatestViewModelInput()).toMatchObject({
        benchmarkSeriesState: {
          WIG20: [
            { date: "2026-01-09", PLN: 100, USD: 25, EUR: 24 },
            { date: "2026-01-10", PLN: 101, USD: 25.25, EUR: 24.2 },
          ],
        },
      });
    });

    const resolveSp500 = resolvers.SP500;
    expect(resolveSp500).toBeDefined();
    if (!resolveSp500) {
      throw new Error("SP500 resolver was not registered");
    }

    resolveSp500({
      ok: true,
      json: async () => ({
        benchmarkId: "SP500",
        points: [
          { date: "2026-01-09", PLN: 200, USD: 50, EUR: 48 },
          { date: "2026-01-10", PLN: 202, USD: 50.5, EUR: 48.5 },
        ],
      }),
    });

    await waitFor(() => {
      expect(getLatestViewModelInput()).toMatchObject({
        benchmarkSeriesState: {
          SP500: [
            { date: "2026-01-09", PLN: 200, USD: 50, EUR: 48 },
            { date: "2026-01-10", PLN: 202, USD: 50.5, EUR: 48.5 },
          ],
          WIG20: [
            { date: "2026-01-09", PLN: 100, USD: 25, EUR: 24 },
            { date: "2026-01-10", PLN: 101, USD: 25.25, EUR: 24.2 },
          ],
        },
      });
    });
  });
});
