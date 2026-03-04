import type {
  InstrumentSearchMode,
  InstrumentSearchResponse,
  InstrumentSearchResult,
} from "../lib/instrument-search";
import type { InstrumentType } from "../lib/instrument-search";
import { toClientError } from "@/lib/http/client-error";

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

  const response = await fetch(
    `/api/instruments/search?${params.toString()}`,
    { signal }
  );

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się pobrać instrumentów.",
      response.status
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("results" in data) ||
    !Array.isArray((data as { results?: unknown }).results)
  ) {
    throw new Error("Brak danych z wyszukiwarki instrumentów.");
  }

  return (data as InstrumentSearchResponse).results;
};
