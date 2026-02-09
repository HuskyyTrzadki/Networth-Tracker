import type { InstrumentSearchResult } from "../../lib/instrument-search";

// Merge local + Yahoo results, keeping local entries as the source of truth.
export const mergeInstrumentResults = (
  localResults: InstrumentSearchResult[],
  yahooResults: InstrumentSearchResult[],
  limit: number
) => {
  const byKey = new Map<string, InstrumentSearchResult>();

  const buildKey = (item: InstrumentSearchResult) =>
    `${item.provider}:${item.providerKey}`.toLowerCase();

  localResults.forEach((item) => {
    byKey.set(buildKey(item), item);
  });

  yahooResults.forEach((item) => {
    const key = buildKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      return;
    }

    if (!existing.instrumentType && item.instrumentType) {
      byKey.set(key, { ...existing, instrumentType: item.instrumentType });
    }
  });

  return Array.from(byKey.values()).slice(0, limit);
};
