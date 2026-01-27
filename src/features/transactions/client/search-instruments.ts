import type {
  InstrumentSearchMode,
  InstrumentSearchResponse,
  InstrumentSearchResult,
} from "../lib/instrument-search";

export type InstrumentSearchClientOptions = Readonly<{
  mode?: InstrumentSearchMode;
  limit?: number;
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

  const response = await fetch(
    `/api/instruments/search?${params.toString()}`,
    { signal }
  );

  const data = (await response.json().catch(() => null)) as
    | InstrumentSearchResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się pobrać instrumentów.";
    throw new Error(message);
  }

  if (!data || !("results" in data)) {
    throw new Error("Brak danych z wyszukiwarki instrumentów.");
  }

  return data.results;
};
