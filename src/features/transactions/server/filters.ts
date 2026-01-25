export type TransactionSide = "BUY" | "SELL";

export type TransactionsSort = "date_desc" | "date_asc";

export type TransactionsFilters = Readonly<{
  query: string | null;
  type: TransactionSide | null;
  sort: TransactionsSort;
  page: number;
  pageSize: number;
}>;

const DEFAULT_PAGE_SIZE = 20;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function parseTransactionsFilters(
  searchParams: Readonly<Record<string, string | string[] | undefined>>
): TransactionsFilters {
  const queryRaw = getFirstParam(searchParams.q)?.trim();
  const typeRaw = getFirstParam(searchParams.type)?.toUpperCase();
  const sortRaw = getFirstParam(searchParams.sort);
  const pageRaw = Number.parseInt(getFirstParam(searchParams.page) ?? "1", 10);

  return {
    query: queryRaw && queryRaw.length > 0 ? queryRaw : null,
    type: typeRaw === "BUY" || typeRaw === "SELL" ? typeRaw : null,
    sort: sortRaw === "date_asc" ? "date_asc" : "date_desc",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}
