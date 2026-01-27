export type InstrumentProvider = "yahoo";

export type InstrumentType = "EQUITY" | "ETF" | "CRYPTOCURRENCY";

export type InstrumentSearchMode = "local" | "all" | "auto";

export type InstrumentSearchResult = Readonly<{
  id: string;
  provider: InstrumentProvider;
  providerKey: string;
  symbol: string;
  ticker: string;
  name: string;
  currency: string;
  instrumentType?: InstrumentType;
  exchange?: string;
  region?: string;
  logoUrl?: string | null;
}>;

export type InstrumentSearchResponse = Readonly<{
  query: string;
  results: InstrumentSearchResult[];
}>;
