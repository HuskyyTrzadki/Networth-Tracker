"use client";

import { Suspense, useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { useQueryStates } from "nuqs";

import { useDebouncedCallback } from "@/features/common/hooks/use-debounced-callback";
import { Input } from "@/features/design-system/components/ui/input";
import { Label } from "@/features/design-system/components/ui/label";
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
import { PortfolioSwitcher } from "@/features/portfolio/components/PortfolioSwitcher";
import { cn } from "@/lib/cn";

import type { TransactionSide, TransactionsSort } from "../server/filters";
import { transactionsQueryStateParsers } from "../lib/transactions-query-state";
import { TransactionsSearchToolbarSkeleton } from "./TransactionsSearchToolbarSkeleton";

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
const searchInputId = "transactions-search-input";
const sortSelectId = "transactions-sort-select";

function TransactionsSearchToolbarInner({
  query,
  type,
  sort,
  portfolios,
  selectedPortfolioId,
}: Props) {
  const [searchValue, setSearchValue] = useState(query ?? "");
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [, setQueryState] = useQueryStates(transactionsQueryStateParsers, {
    history: "push",
    shallow: false,
    scroll: false,
    startTransition,
  });

  const pushWithUpdates = (
    updates: Readonly<{
      type?: TransactionSide | null;
      sort?: TransactionsSort | null;
    }>
  ) => {
    void setQueryState({
      ...updates,
      page: 1,
    });
  };

  const debouncedCommit = useDebouncedCallback((value: string) => {
    const trimmed = value.trim();

    void setQueryState({
      q: trimmed.length > 0 ? trimmed : null,
      page: 1,
    });
  }, searchDebounceMs);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setSearchValue(nextValue);

    debouncedCommit(nextValue);
  };

  useEffect(() => {
    const onFocusSearch = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener("app:focus-search", onFocusSearch);
    return () => window.removeEventListener("app:focus-search", onFocusSearch);
  }, []);

  return (
    <div
      aria-busy={isPending}
      className={cn(
        "flex flex-col gap-3.5 rounded-lg border border-border/75 bg-card/94 px-4 py-3.5 shadow-[var(--surface-shadow)]"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border/60 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground/85">
          Filtry
        </p>
        <div
          aria-atomic
          aria-live="polite"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground"
          role="status"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden />
              Aktualizuję...
            </>
          ) : (
            <span className="sr-only">Filtry zaktualizowane</span>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border/65 bg-background/70 p-2.5">
        <Label className="sr-only" htmlFor="transactions-portfolio-switcher">
          Zakres portfela
        </Label>
        <div id="transactions-portfolio-switcher">
          <PortfolioSwitcher
            disabled={isPending}
            portfolios={portfolios}
            resetPageParam
            selectedId={selectedPortfolioId}
          />
        </div>
      </div>

      <div className="grid w-full gap-3.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-end">
        <div className="space-y-1.5">
          <Label
            className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85"
            htmlFor={searchInputId}
          >
            Szukaj instrumentu
          </Label>
          <Input
            className="h-10 border-input/85 bg-background/92 text-sm"
            id={searchInputId}
            ref={searchInputRef}
            onChange={handleSearchChange}
            placeholder="Ticker lub nazwa (np. AAPL)"
            value={searchValue}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
              Typ operacji
            </legend>
            <div className="h-10 rounded-md border border-input/85 bg-background/84 p-0.5">
              <ToggleGroup
                aria-label="Typ transakcji"
                className="grid h-full grid-cols-3 gap-0.5"
                onValueChange={(value) => {
                  const nextType =
                    value === "BUY" || value === "SELL" ? value : null;
                  pushWithUpdates({ type: nextType });
                }}
                type="single"
                value={type ?? "all"}
              >
                <ToggleGroupItem
                  className="h-full w-full rounded-[6px] px-2 text-sm"
                  disabled={isPending}
                  value="all"
                >
                  Wszystkie
                </ToggleGroupItem>
                <ToggleGroupItem
                  className="h-full w-full rounded-[6px] px-2 text-sm"
                  disabled={isPending}
                  value="BUY"
                >
                  Kupno
                </ToggleGroupItem>
                <ToggleGroupItem
                  className="h-full w-full rounded-[6px] px-2 text-sm"
                  disabled={isPending}
                  value="SELL"
                >
                  Sprzedaż
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85"
              htmlFor={sortSelectId}
            >
              Sortowanie
            </Label>
            <Select
              disabled={isPending}
              onValueChange={(value) => {
                const nextSort = value === "date_asc" ? "date_asc" : null;
                pushWithUpdates({ sort: nextSort });
              }}
              value={sort}
            >
              <SelectTrigger
                className="h-10 min-w-[180px] border-input/85 bg-background/92"
                id={sortSelectId}
              >
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
    </div>
  );
}

export function TransactionsSearchToolbar(props: Props) {
  return (
    <Suspense fallback={<TransactionsSearchToolbarSkeleton />}>
      <TransactionsSearchToolbarInner {...props} />
    </Suspense>
  );
}
