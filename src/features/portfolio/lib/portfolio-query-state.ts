import { parseAsInteger, parseAsString } from "nuqs";

export const portfolioQueryStateParsers = {
  portfolio: parseAsString,
  page: parseAsInteger.withDefault(1),
} as const;
