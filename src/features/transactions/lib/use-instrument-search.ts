"use client";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";

import {
  searchInstruments,
  type InstrumentSearchClient,
  type InstrumentSearchClientOptions,
} from "../client/search-instruments";
import type { InstrumentSearchResult } from "./instrument-search";
import type { InstrumentType } from "./instrument-search";

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
  types?: readonly InstrumentType[];
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
  const types = options?.types;
  const trimmed = query.trim();
  const requestKey = `${trimmed}|${mode ?? ""}|${limit ?? ""}|${
    types?.join(",") ?? ""
  }`;
  const shouldSearch = trimmed.length >= minQueryLength;
  const resource = useKeyedAsyncResource<InstrumentSearchResult[]>({
    requestKey: shouldSearch ? requestKey : null,
    load: (signal) =>
      Promise.resolve(client(trimmed, { mode, limit, types }, signal)),
    getErrorMessage: (error) =>
      error instanceof Error ? error.message : "Nie udało się pobrać instrumentów.",
  });

  const resolvedState: SearchState = shouldSearch
    ? {
        results: resource.data ?? [],
        status:
          resource.status === "idle" || resource.status === "loading"
            ? "loading"
            : resource.status,
        error: resource.errorMessage,
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
