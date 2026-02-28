import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

export const transactionSideValues = ["BUY", "SELL"] as const;
export const transactionSortValues = ["date_desc", "date_asc"] as const;

export const transactionsQueryStateParsers = {
  q: parseAsString,
  type: parseAsStringLiteral(transactionSideValues),
  sort: parseAsStringLiteral(transactionSortValues).withDefault("date_desc"),
  portfolio: parseAsString,
  page: parseAsInteger.withDefault(1),
} as const;
