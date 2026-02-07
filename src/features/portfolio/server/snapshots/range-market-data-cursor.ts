import { decimalOne, divideDecimals, parseDecimalString } from "@/lib/decimal";

import type { FxDailyRow, InstrumentDailyRow } from "./range-market-data";

type InstrumentCursorPoint = Readonly<{
  currency: string;
  asOf: string;
  fetchedAt: string;
  close: string;
}>;

type FxCursorPoint = Readonly<{
  rate: string;
  asOf: string;
  fetchedAt: string;
  source: "direct" | "inverted";
}>;

const buildPairKey = (from: string, to: string) => `${from}:${to}`;

const normalizeRequiredNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

export function createInstrumentSeriesCursor(
  seriesByKey: ReadonlyMap<string, readonly InstrumentDailyRow[]>
) {
  const indices = new Map<string, number>();

  return {
    advanceTo(day: string) {
      seriesByKey.forEach((rows, key) => {
        let index = indices.get(key) ?? -1;
        while (index + 1 < rows.length && rows[index + 1].price_date <= day) {
          index += 1;
        }
        indices.set(key, index);
      });
    },
    get(providerKey: string): InstrumentCursorPoint | null {
      const rows = seriesByKey.get(providerKey);
      if (!rows) return null;

      const index = indices.get(providerKey) ?? -1;
      if (index < 0 || index >= rows.length) return null;

      const row = rows[index];
      return {
        currency: row.currency,
        asOf: row.as_of,
        fetchedAt: row.fetched_at,
        close: normalizeRequiredNumeric(row.close),
      };
    },
  };
}

export function createFxSeriesCursor(
  seriesByPair: ReadonlyMap<string, readonly FxDailyRow[]>
) {
  const indices = new Map<string, number>();

  return {
    advanceTo(day: string) {
      seriesByPair.forEach((rows, key) => {
        let index = indices.get(key) ?? -1;
        while (index + 1 < rows.length && rows[index + 1].rate_date <= day) {
          index += 1;
        }
        indices.set(key, index);
      });
    },
    get(from: string, to: string): FxCursorPoint | null {
      const directKey = buildPairKey(from, to);
      const directRows = seriesByPair.get(directKey);
      const directIndex = indices.get(directKey) ?? -1;
      if (directRows && directIndex >= 0 && directIndex < directRows.length) {
        const row = directRows[directIndex];
        return {
          rate: normalizeRequiredNumeric(row.rate),
          asOf: row.as_of,
          fetchedAt: row.fetched_at,
          source: "direct",
        };
      }

      const inverseKey = buildPairKey(to, from);
      const inverseRows = seriesByPair.get(inverseKey);
      const inverseIndex = indices.get(inverseKey) ?? -1;
      if (!inverseRows || inverseIndex < 0 || inverseIndex >= inverseRows.length) {
        return null;
      }

      const inverseRow = inverseRows[inverseIndex];
      const inverseRate = parseDecimalString(inverseRow.rate);
      if (!inverseRate) {
        return null;
      }

      return {
        rate: divideDecimals(decimalOne(), inverseRate).toString(),
        asOf: inverseRow.as_of,
        fetchedAt: inverseRow.fetched_at,
        source: "inverted",
      };
    },
  };
}

