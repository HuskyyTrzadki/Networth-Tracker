import type { createClient } from "@/lib/supabase/server";

import type {
  InstrumentProvider,
  InstrumentSearchMode,
  InstrumentType,
} from "../../lib/instrument-search";

export type SupabaseServerClient = ReturnType<typeof createClient>;

export type SearchParams = Readonly<{
  query: string;
  limit: number;
  timeoutMs: number;
  mode: InstrumentSearchMode;
  types: InstrumentType[];
}>;

export type YahooSearchQuote = Readonly<{
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType?: string;
  isYahooFinance?: boolean;
  score?: number;
}>;

export type YahooQuote = Readonly<{
  symbol: string;
  currency?: string;
  region?: string;
  shortName?: string;
  longName?: string;
  displayName?: string;
  exchange?: string;
  fullExchangeName?: string;
  logoUrl?: string;
  companyLogoUrl?: string;
  coinImageUrl?: string;
}>;

export const YAHOO_PROVIDER: InstrumentProvider = "yahoo";

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;
export const DEFAULT_TIMEOUT_MS = 5000;
export const MIN_QUERY_LENGTH = 2;

export const ALLOWED_QUOTE_TYPES = new Set<InstrumentType>([
  "EQUITY",
  "ETF",
  "CRYPTOCURRENCY",
  "MUTUALFUND",
  "CURRENCY",
  "INDEX",
  "OPTION",
  "FUTURE",
  "MONEYMARKET",
  "ECNQUOTE",
  "ALTSYMBOL",
]);
