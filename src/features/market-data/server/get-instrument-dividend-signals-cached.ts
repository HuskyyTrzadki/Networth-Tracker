import { cacheLife, cacheTag } from "next/cache";

import {
  fetchYahooDividendSignals,
  type YahooDividendSignals,
} from "./providers/yahoo/yahoo-dividend-signals";

const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_MAX_CONCURRENCY = 4;
const MAX_MAX_CONCURRENCY = 5;
const LOG_PREFIX = "[market-data][dividends]";

const EMPTY_DIVIDEND_SIGNALS: InstrumentDividendSignals = {
  pastEvents: [],
  upcomingEvent: null,
};

type DividendSignalWindow = Readonly<{
  pastFromDate: string;
  pastToDate: string;
  futureToDate: string;
  historicalLookbackFromDate: string;
}>;

type DividendSignalWindowWithTimeout = DividendSignalWindow &
  Readonly<{
    timeoutMs: number;
  }>;

export type InstrumentDividendSignals = YahooDividendSignals;

export type InstrumentDividendSignalRequest = Readonly<{
  provider: "yahoo";
  providerKey: string;
}>;

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const clampConcurrency = (value: number) =>
  Math.max(1, Math.min(value, MAX_MAX_CONCURRENCY));

const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  maxConcurrency: number,
  mapper: (item: T) => Promise<R>
) => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    async () => {
      while (true) {
        const current = nextIndex;
        nextIndex += 1;
        if (current >= items.length) {
          break;
        }
        results[current] = await mapper(items[current]);
      }
    }
  );

  await Promise.all(workers);
  return results;
};

const getYahooDividendSignalsCached = async (
  providerKey: string,
  input: DividendSignalWindowWithTimeout
) => {
  "use cache";

  // Dividends move slowly compared to quotes; refresh once per day.
  cacheLife("days");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:dividends`);

  return fetchYahooDividendSignals(providerKey, input);
};

export async function getInstrumentDividendSignalsCached(
  requests: readonly InstrumentDividendSignalRequest[],
  input: DividendSignalWindow &
    Readonly<{
      timeoutMs?: number;
      maxConcurrency?: number;
    }>
): Promise<ReadonlyMap<string, InstrumentDividendSignals>> {
  if (requests.length === 0) {
    return new Map();
  }

  const timeoutMs = Math.max(500, input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const maxConcurrency = clampConcurrency(input.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY);
  const dedupedRequests = Array.from(
    new Map(
      requests
        .filter((request) => request.providerKey.length > 0)
        .map((request) => [`${request.provider}:${request.providerKey}`, request] as const)
    ).values()
  );

  const resultEntries = await mapWithConcurrency(
    dedupedRequests,
    maxConcurrency,
    async (request) => {
      try {
        if (request.provider === "yahoo") {
          const signals = await getYahooDividendSignalsCached(request.providerKey, {
            pastFromDate: input.pastFromDate,
            pastToDate: input.pastToDate,
            futureToDate: input.futureToDate,
            historicalLookbackFromDate: input.historicalLookbackFromDate,
            timeoutMs,
          });
          return [request.providerKey, signals] as const;
        }

        return [request.providerKey, EMPTY_DIVIDEND_SIGNALS] as const;
      } catch (error) {
        // Per-symbol fault tolerance: one ticker failure cannot break entire inbox.
        console.error(`${LOG_PREFIX} fetch-failed`, {
          provider: request.provider,
          providerKey: request.providerKey,
          error: toErrorMessage(error),
        });
        return [request.providerKey, EMPTY_DIVIDEND_SIGNALS] as const;
      }
    }
  );

  return new Map(resultEntries);
}
