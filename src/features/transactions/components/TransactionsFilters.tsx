"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition, type ChangeEvent } from "react";

import { Input } from "@/features/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { cn } from "@/lib/cn";

import type { TransactionSide, TransactionsSort } from "../server/filters";

type Props = Readonly<{
  query: string | null;
  type: TransactionSide | null;
  sort: TransactionsSort;
}>;

const searchDebounceMs = 300;

const buildTransactionsUrl = (params: URLSearchParams) => {
  const queryString = params.toString();
  return queryString.length > 0 ? `/transactions?${queryString}` : "/transactions";
};

export function TransactionsFilters({ query, type, sort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query ?? "");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

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

  const handleSearchCommit = (value: string) => {
    const trimmed = value.trim();
    pushWithUpdates({ q: trimmed.length > 0 ? trimmed : null });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setSearchValue(nextValue);

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      handleSearchCommit(nextValue);
    }, searchDebounceMs);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3",
        "sm:flex-row sm:items-center sm:gap-4"
      )}
    >
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
        <Select
          disabled={isPending}
          onValueChange={(value) =>
            pushWithUpdates({ type: value === "all" ? null : value })
          }
          value={type ?? "all"}
        >
          <SelectTrigger className="h-10 min-w-[160px]">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="BUY">Kupno</SelectItem>
            <SelectItem value="SELL">Sprzedaż</SelectItem>
          </SelectContent>
        </Select>

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
  );
}
