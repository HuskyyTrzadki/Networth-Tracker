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
  requestKey: string;
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
  requestKey: "",
};

export function useInstrumentSearch(query: string, options?: SearchOptions) {
  const minQueryLength = options?.minQueryLength ?? 2;
  const client = options?.searchClient ?? searchInstruments;
  const mode = options?.mode;
  const limit = options?.limit;
  const [state, setState] = useState<SearchState>(initialState);
  const trimmed = query.trim();
  const requestKey = `${trimmed}|${mode ?? ""}|${limit ?? ""}`;
  const shouldSearch = trimmed.length >= minQueryLength;

  useEffect(() => {
    if (!shouldSearch) {
      return;
    }

    const controller = new AbortController();

    Promise.resolve(client(trimmed, { mode, limit }, controller.signal))
      .then((results) => {
        if (controller.signal.aborted) return;
        setState({ results, status: "success", error: null, requestKey });
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
        setState({
          results: [],
          status: "error",
          error: message,
          requestKey,
        });
      });

    return () => controller.abort();
  }, [client, limit, mode, requestKey, shouldSearch, trimmed]);

  const isMatchingRequest = state.requestKey === requestKey;
  const resolvedState: SearchState = shouldSearch
    ? {
        results: isMatchingRequest ? state.results : [],
        status: isMatchingRequest ? state.status : "loading",
        error: isMatchingRequest ? state.error : null,
        requestKey,
      }
    : initialState;

  return {
    results: resolvedState.results,
    status: resolvedState.status,
    error: resolvedState.error,
    isLoading: resolvedState.status === "loading",
  };
}
