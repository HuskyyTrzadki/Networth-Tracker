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

  const segmentedItemClass = cn(
    "min-w-0 h-full w-full rounded-[6px] border px-1.5 text-[13px]",
    "data-[state=off]:border-border/55 data-[state=off]:bg-background/65",
    "data-[state=off]:text-foreground/88 hover:data-[state=off]:border-border/80",
    "hover:data-[state=off]:bg-background/92"
  );

  return (
    <div
      aria-busy={isPending}
      className={cn("flex flex-col gap-3.5 rounded-xl border border-border/65 bg-card/92 px-4 py-4")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/82">
            Zakres i wyszukiwanie
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Zawężaj dziennik tylko wtedy, kiedy naprawdę tego potrzebujesz.
          </p>
        </div>
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

      <div className="grid w-full gap-3.5">
        <div className="grid gap-3.5 xl:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.45fr)] xl:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
              Portfel
            </Label>
            <PortfolioSwitcher
              disabled={isPending}
              portfolios={portfolios}
              resetPageParam
              selectedId={selectedPortfolioId}
              showLabel={false}
            />
          </div>

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
        </div>

        <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] xl:items-end">
          <fieldset className="min-w-0 space-y-1.5">
            <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
              Typ operacji
            </legend>
            <div className="h-10 rounded-md bg-background/84 p-0.5">
              <ToggleGroup
                aria-label="Typ transakcji"
                className="grid h-full w-full grid-cols-3 gap-0.5"
                onValueChange={(value) => {
                  const nextType =
                    value === "BUY" || value === "SELL" ? value : null;
                  pushWithUpdates({ type: nextType });
                }}
                type="single"
                value={type ?? "all"}
              >
                <ToggleGroupItem
                  className={segmentedItemClass}
                  disabled={isPending}
                  value="all"
                >
                  Wszystkie
                </ToggleGroupItem>
                <ToggleGroupItem
                  className={segmentedItemClass}
                  disabled={isPending}
                  value="BUY"
                >
                  Kupno
                </ToggleGroupItem>
                <ToggleGroupItem
                  className={segmentedItemClass}
                  disabled={isPending}
                  value="SELL"
                >
                  Sprzedaż
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </fieldset>

          <div className="min-w-0 space-y-1.5">
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
                className="h-10 w-full min-w-0 border-input/85 bg-background/92"
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
