import Link from "next/link";

import { Button } from "@/features/design-system/components/ui/button";

import type { TransactionsFilters } from "../server/filters";

type Props = Readonly<{
  filters: TransactionsFilters;
  hasNextPage: boolean;
}>;

const buildTransactionsUrl = (filters: TransactionsFilters, page: number) => {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (filters.sort !== "date_desc") {
    params.set("sort", filters.sort);
  }

  if (filters.portfolioId) {
    params.set("portfolio", filters.portfolioId);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `/transactions?${queryString}` : "/transactions";
};

export function TransactionsPagination({ filters, hasNextPage }: Props) {
  const showPagination = filters.page > 1 || hasNextPage;

  if (!showPagination) {
    return null;
  }

  const previousPage = Math.max(1, filters.page - 1);
  const nextPage = filters.page + 1;
  const prevDisabled = filters.page <= 1;
  const nextDisabled = !hasNextPage;

  return (
    <div className="mt-4 flex items-center justify-between">
      {prevDisabled ? (
        <Button disabled size="sm" type="button" variant="outline">
          Poprzednia
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link href={buildTransactionsUrl(filters, previousPage)}>
            Poprzednia
          </Link>
        </Button>
      )}

      {nextDisabled ? (
        <Button disabled size="sm" type="button" variant="outline">
          Następna
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link href={buildTransactionsUrl(filters, nextPage)}>
            Następna
          </Link>
        </Button>
      )}
    </div>
  );
}
