import type { InstrumentSearchResult, InstrumentType } from "../../lib/instrument-search";

import type { SupabaseServerClient } from "./search-types";
import { normalizeLocalInstrument } from "./search-normalize";
import { isAllowedByFilter } from "./search-utils";

export const searchLocalInstruments = async (
  supabase: SupabaseServerClient,
  query: string,
  limit: number,
  types?: readonly InstrumentType[] | null
): Promise<InstrumentSearchResult[]> => {
  // Local search keeps UX fast and uses the global instrument cache.
  const pattern = `%${query}%`;
  const { data, error } = await supabase
    .from("instruments")
    .select(
      "provider, provider_key, symbol, name, currency, exchange, region, logo_url, instrument_type, updated_at"
    )
    .or(`provider_key.ilike.${pattern},name.ilike.${pattern},symbol.ilike.${pattern}`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const normalized = data.map(normalizeLocalInstrument);
  return normalized.filter((item) =>
    isAllowedByFilter(item.instrumentType ?? null, types)
  );
};
