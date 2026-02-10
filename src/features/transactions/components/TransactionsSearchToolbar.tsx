"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";

import { useDebouncedCallback } from "@/features/common/hooks/use-debounced-callback";
import { Input } from "@/features/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import { PortfolioSwitcher } from "@/features/portfolio";
import { cn } from "@/lib/cn";

import type { TransactionSide, TransactionsSort } from "../server/filters";

type Props = Readonly<{
  query: string | null;
  type: TransactionSide | null;
  sort: TransactionsSort;
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[];
  selectedPortfolioId: string | null;
}>;

const searchDebounceMs = 300;

const buildTransactionsUrl = (params: URLSearchParams) => {
  const queryString = params.toString();
  return queryString.length > 0 ? `/transactions?${queryString}` : "/transactions";
};

export function TransactionsSearchToolbar({
  query,
  type,
  sort,
  portfolios,
  selectedPortfolioId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query ?? "");
  const [isPending, startTransition] = useTransition();
  const searchParamsString = searchParams?.toString() ?? "";

  const pushWithUpdates = (updates: Readonly<Record<string, string | null>>) => {
    const params = new URLSearchParams(searchParams?.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    params.set("page", "1");

    startTransition(() => {
      router.push(buildTransactionsUrl(params), { scroll: false });
    });
  };

  const debouncedCommit = useDebouncedCallback((value: string) => {
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParamsString);
    if (trimmed.length > 0) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(buildTransactionsUrl(params), { scroll: false });
    });
  }, searchDebounceMs);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setSearchValue(nextValue);

    debouncedCommit(nextValue);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/85 bg-card px-4 py-3 shadow-[var(--shadow)]"
      )}
    >
      <div className="w-full">
        <PortfolioSwitcher
          disabled={isPending}
          portfolios={portfolios}
          resetPageParam
          selectedId={selectedPortfolioId}
        />
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            aria-label="Szukaj instrumentu"
            className="h-10"
            onChange={handleSearchChange}
            placeholder="Szukaj instrumentu..."
            value={searchValue}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-input bg-muted/50 p-1">
            <ToggleGroup
              aria-label="Typ transakcji"
              className="grid grid-cols-3 gap-1"
              onValueChange={(value) =>
                pushWithUpdates({ type: value === "all" ? null : value })
              }
              type="single"
              value={type ?? "all"}
            >
              <ToggleGroupItem
                className="h-9 w-full rounded-md px-2 text-sm"
                disabled={isPending}
                value="all"
              >
                Wszystkie
              </ToggleGroupItem>
              <ToggleGroupItem
                className="h-9 w-full rounded-md px-2 text-sm"
                disabled={isPending}
                value="BUY"
              >
                Kupno
              </ToggleGroupItem>
              <ToggleGroupItem
                className="h-9 w-full rounded-md px-2 text-sm"
                disabled={isPending}
                value="SELL"
              >
                Sprzedaż
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Select
            disabled={isPending}
            onValueChange={(value) =>
              pushWithUpdates({ sort: value === "date_desc" ? null : value })
            }
            value={sort}
          >
            <SelectTrigger className="h-10 min-w-[180px]">
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Data: Najnowsze</SelectItem>
              <SelectItem value="date_asc">Data: Najstarsze</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
