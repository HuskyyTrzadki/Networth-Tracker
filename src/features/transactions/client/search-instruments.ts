import type {
  InstrumentSearchMode,
  InstrumentSearchResponse,
  InstrumentSearchResult,
} from "../lib/instrument-search";
import type { InstrumentType } from "../lib/instrument-search";
import { requestJson } from "@/lib/http/client-request";

export type InstrumentSearchClientOptions = Readonly<{
  mode?: InstrumentSearchMode;
  limit?: number;
  types?: readonly InstrumentType[];
}>;

export type InstrumentSearchClient = (
  query: string,
  options?: InstrumentSearchClientOptions,
  signal?: AbortSignal
) => Promise<InstrumentSearchResult[]>;

export const searchInstruments: InstrumentSearchClient = async (
  query,
  options,
  signal
) => {
  const params = new URLSearchParams({ q: query });
  if (options?.mode) {
    params.set("mode", options.mode);
  }
  if (typeof options?.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (options?.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  }

  const { payload } = await requestJson(
    `/api/instruments/search?${params.toString()}`,
    {
      signal,
      fallbackMessage: "Nie udało się pobrać instrumentów.",
    }
  );

  if (
    !payload ||
    typeof payload !== "object" ||
    !("results" in payload) ||
    !Array.isArray((payload as { results?: unknown }).results)
  ) {
    throw new Error("Brak danych z wyszukiwarki instrumentów.");
  }

  return (payload as InstrumentSearchResponse).results;
};
