import { describe, expect, it } from "vitest";

import { buildDashboardBenchmarkSeries } from "./benchmark-series-builder";
import type { BenchmarkId } from "../dashboard/lib/benchmark-config";

const BENCHMARK_PROVIDER_KEYS: Readonly<Record<BenchmarkId, string>> = {
  SP500: "VOO",
  WIG20: "ETFBW20TR.WA",
  MWIG40: "ETFBM40TR.WA",
};

describe("buildDashboardBenchmarkSeries", () => {
  it("converts benchmark values using inverse FX fallback when direct pair is missing", () => {
    const output = buildDashboardBenchmarkSeries({
      bucketDates: ["2026-01-10"],
      requestedBenchmarkIds: ["SP500"],
      benchmarkProviderKeys: BENCHMARK_PROVIDER_KEYS,
      instrumentSeriesByProviderKey: new Map([
        [
          "VOO",
          [
            {
              date: "2026-01-10",
              currency: "USD",
              close: "10",
            },
          ],
        ],
      ]),
      fxSeriesByPair: new Map([
        [
          "PLN:USD",
          [
            {
              date: "2026-01-10",
              rate: "0.25",
            },
          ],
        ],
      ]),
    });

    expect(output.SP500).toHaveLength(1);
    expect(output.SP500[0]).toMatchObject({
      date: "2026-01-10",
      USD: 10,
      PLN: 40,
    });
  });
});
