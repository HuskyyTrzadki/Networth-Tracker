import { parseAsString } from "nuqs";

export const addTransactionQueryStateParsers = {
  portfolioId: parseAsString,
  portfolio: parseAsString,
} as const;
