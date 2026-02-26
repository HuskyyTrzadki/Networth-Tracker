"use client";

import { useEffect, useRef } from "react";

import {
  searchInstruments as defaultSearchInstruments,
  type InstrumentSearchClient,
} from "@/features/transactions/client/search-instruments";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";
import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";

import type { HoldingRow } from "./ScreenshotHoldingsTable";
import type { ScreenshotImportStep } from "./screenshot-import-types";
import { normalizeTicker, resolveInstrumentMatch } from "./screenshot-import-utils";

type Options = Readonly<{
  step: ScreenshotImportStep;
  rows: HoldingRow[];
  searchClient?: InstrumentSearchClient;
  onRowsResolved: (
    next: HoldingRow[] | ((current: HoldingRow[]) => HoldingRow[])
  ) => void;
}>;

export function useScreenshotImportAutoResolve({
  step,
  rows,
  searchClient,
  onRowsResolved,
}: Options) {
  const autoResolveCacheRef = useRef(
    new Map<string, InstrumentSearchResult | null>()
  );
  const autoResolveInFlightRef = useRef(new Set<string>());

  useEffect(() => {
    if (step !== "review") return;
    const searchClientToUse = searchClient ?? defaultSearchInstruments;

    const tickersToResolve = new Set<string>();
    rows.forEach((row) => {
      const normalized = normalizeTicker(row.ticker);
      if (!normalized) return;
      if (isSupportedCashCurrency(normalized)) return;
      if (row.instrument) return;
      if (autoResolveCacheRef.current.has(normalized)) return;
      if (autoResolveInFlightRef.current.has(normalized)) return;
      tickersToResolve.add(normalized);
    });

    if (tickersToResolve.size === 0) return;

    let isActive = true;
    const controller = new AbortController();

    const resolveTickers = async () => {
      const resolvedEntries = await Promise.all(
        Array.from(tickersToResolve).map(async (ticker) => {
          autoResolveInFlightRef.current.add(ticker);
          try {
            const match = await resolveInstrumentMatch(
              ticker,
              searchClientToUse,
              controller.signal
            );
            return [ticker, match] as const;
          } catch {
            return [ticker, null] as const;
          } finally {
            autoResolveInFlightRef.current.delete(ticker);
          }
        })
      );

      if (!isActive) return;

      resolvedEntries.forEach(([ticker, match]) => {
        autoResolveCacheRef.current.set(ticker, match);
      });

      onRowsResolved((current) =>
        current.map((row) => {
          const normalized = normalizeTicker(row.ticker);
          if (!normalized) return row;
          if (isSupportedCashCurrency(normalized)) return row;
          if (row.instrument) return row;
          const match = autoResolveCacheRef.current.get(normalized);
          if (!match) return row;
          return { ...row, instrument: match, ticker: match.ticker };
        })
      );
    };

    resolveTickers();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [rows, searchClient, step, onRowsResolved]);
}
