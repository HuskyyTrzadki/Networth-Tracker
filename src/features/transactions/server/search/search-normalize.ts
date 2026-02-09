import type { InstrumentProvider, InstrumentSearchResult, InstrumentType } from "../../lib/instrument-search";

import type { YahooQuote, YahooSearchQuote } from "./search-types";
import { YAHOO_PROVIDER } from "./search-types";
import {
  buildInstrumentId,
  getDisplayTicker,
  isAllowedInstrumentType,
} from "./search-utils";

const normalizeName = (input: Readonly<{
  shortname?: string;
  longname?: string;
  fallback: string;
}>) => input.shortname ?? input.longname ?? input.fallback;

const normalizeExchange = (input: Readonly<{
  exchange?: string;
  exchDisp?: string;
  fullExchangeName?: string;
}>) => input.exchDisp ?? input.fullExchangeName ?? input.exchange;

export const normalizeLocalInstrument = (
  row: Readonly<{
    provider: string;
    provider_key: string | null;
    symbol: string;
    name: string;
    currency: string;
    exchange: string | null;
    region: string | null;
    logo_url: string | null;
    instrument_type: InstrumentType | null;
  }>
): InstrumentSearchResult => {
  const providerKey = row.provider_key ?? row.symbol;
  const provider = row.provider as InstrumentProvider;

  return {
    id: buildInstrumentId({ provider, providerKey }),
    provider,
    providerKey,
    symbol: row.symbol,
    ticker: getDisplayTicker(row.symbol, null),
    name: row.name,
    currency: row.currency.toUpperCase(),
    instrumentType: row.instrument_type ?? undefined,
    exchange: row.exchange ?? undefined,
    region: row.region ?? undefined,
    logoUrl: row.logo_url ?? null,
  };
};

export const normalizeYahooInstrument = (
  quote: YahooSearchQuote,
  quoteBySymbol: Record<string, YahooQuote | undefined>
): InstrumentSearchResult | null => {
  const symbol = quote.symbol?.trim();
  if (!symbol) return null;

  const quoteDetails = quoteBySymbol[symbol];
  const currency = quoteDetails?.currency?.trim().toUpperCase() ?? "";
  if (!currency) return null;
  if (!isAllowedInstrumentType(quote.quoteType)) {
    return null;
  }

  const name = normalizeName({
    shortname: quote.shortname ?? quoteDetails?.shortName,
    longname: quote.longname ?? quoteDetails?.longName ?? quoteDetails?.displayName,
    fallback: symbol,
  });

  return {
    id: buildInstrumentId({ provider: YAHOO_PROVIDER, providerKey: symbol }),
    provider: YAHOO_PROVIDER,
    providerKey: symbol,
    symbol,
    ticker: getDisplayTicker(symbol, quote.quoteType),
    name,
    currency,
    instrumentType: quote.quoteType,
    exchange: normalizeExchange({
      exchDisp: quote.exchDisp,
      exchange: quote.exchange ?? quoteDetails?.exchange,
      fullExchangeName: quoteDetails?.fullExchangeName,
    }),
    region: quoteDetails?.region?.toUpperCase(),
    logoUrl:
      quoteDetails?.logoUrl ??
      quoteDetails?.companyLogoUrl ??
      quoteDetails?.coinImageUrl ??
      null,
  };
};
