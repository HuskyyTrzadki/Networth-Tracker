"use client";

import { useEffect, useState } from "react";

import {
  searchInstruments,
  type InstrumentSearchClient,
  type InstrumentSearchClientOptions,
} from "../client/search-instruments";
import type { InstrumentSearchResult } from "./instrument-search";

type SearchState = Readonly<{
  results: InstrumentSearchResult[];
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}>;

type SearchOptions = Readonly<{
  minQueryLength?: number;
  searchClient?: InstrumentSearchClient;
  mode?: InstrumentSearchClientOptions["mode"];
  limit?: number;
}>;

const initialState: SearchState = {
  results: [],
  status: "idle",
  error: null,
};

export function useInstrumentSearch(query: string, options?: SearchOptions) {
  const minQueryLength = options?.minQueryLength ?? 2;
  const client = options?.searchClient ?? searchInstruments;
  const mode = options?.mode;
  const limit = options?.limit;
  const [state, setState] = useState<SearchState>(initialState);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < minQueryLength) {
      setState(initialState);
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading", error: null }));

    Promise.resolve(client(trimmed, { mode, limit }, controller.signal))
      .then((results) => {
        if (controller.signal.aborted) return;
        setState({ results, status: "success", error: null });
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać instrumentów.";
        setState((current) => ({
          ...current,
          status: "error",
          error: message,
        }));
      });

    return () => controller.abort();
  }, [client, limit, minQueryLength, mode, query]);

  return {
    results: state.results,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading",
  };
}
