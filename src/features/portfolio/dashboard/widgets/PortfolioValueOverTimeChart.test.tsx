import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioValueOverTimeChart } from "./PortfolioValueOverTimeChart";
import { loadFullSnapshotHistory } from "../lib/load-full-snapshot-history";

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
      onComparisonChange: (id: "SP500", enabled: boolean) => void;
      onBootstrapRequest: () => void;
    };

    return (
      <div>
        <span data-testid="range">{contentProps.range}</span>
        <button onClick={() => contentProps.onRangeChange("ALL")}>set-all</button>
        <button onClick={() => contentProps.onComparisonChange("SP500", true)}>
          enable-sp500
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
});
