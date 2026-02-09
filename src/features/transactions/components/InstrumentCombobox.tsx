"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { useDebouncedCallback } from "@/features/common/hooks/use-debounced-callback";
import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/features/design-system/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";

import type { InstrumentSearchClient } from "../client/search-instruments";
import type { InstrumentSearchResult, InstrumentType } from "../lib/instrument-search";
import { useInstrumentSearch } from "../lib/use-instrument-search";
import { InstrumentLogoImage } from "./InstrumentLogoImage";

type Props = Readonly<{
  value: InstrumentSearchResult | null;
  onChange: (next: InstrumentSearchResult) => void;
  searchClient?: InstrumentSearchClient;
  allowedTypes?: readonly InstrumentType[];
}>;

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 280;
const LOCAL_LIMIT = 3;
const ALL_RESULTS_LIMIT = 50;

export function InstrumentCombobox({
  value,
  onChange,
  searchClient,
  allowedTypes,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const debouncedCommit = useDebouncedCallback(
    (nextValue: string) => setDebouncedQuery(nextValue),
    DEBOUNCE_MS
  );

  const { results, isLoading, error } = useInstrumentSearch(debouncedQuery, {
    minQueryLength: MIN_QUERY_LENGTH,
    searchClient,
    mode: showAll ? "all" : "auto",
    limit: showAll ? ALL_RESULTS_LIMIT : LOCAL_LIMIT,
    types: allowedTypes,
  });

  const trimmedQuery = query.trim();
  const hasMinQuery = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const emptyMessage =
    !hasMinQuery
      ? "Wpisz min. 2 znaki."
      : isLoading
        ? "Szukam instrumentów…"
        : error
          ? "Nie udało się pobrać wyników."
          : "Brak wyników.";

  const showMoreAction =
    !showAll &&
    !isLoading &&
    !error &&
    hasMinQuery &&
    results.length > 0;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
          setDebouncedQuery("");
          debouncedCommit.cancel();
          setShowAll(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "h-14 w-full justify-between gap-3 px-4",
            !value && "text-muted-foreground"
          )}
          role="combobox"
          variant="outline"
        >
          <span className="flex min-w-0 items-center gap-3">
            {value ? (
              <>
                <span className="font-mono text-base font-semibold tabular-nums sm:text-lg">
                  {value.ticker}
                </span>
                <span className="truncate text-base text-foreground sm:text-lg">
                  {value.name}
                </span>
              </>
            ) : (
              <span className="text-base">
                Wybierz instrument…
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {value ? (
              <span className="font-mono text-sm text-muted-foreground">
                {value.currency}
              </span>
            ) : null}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-[var(--radix-popover-trigger-width)] w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            className="h-11 text-base"
            placeholder="Szukaj (np. Apple, BTC, XTB)"
            value={query}
            onValueChange={(nextValue) => {
              setShowAll(false);
              setQuery(nextValue);
              if (nextValue.trim().length < MIN_QUERY_LENGTH) {
                debouncedCommit.cancel();
                setDebouncedQuery(nextValue);
                return;
              }
              debouncedCommit(nextValue);
            }}
          />
          <CommandList className="max-h-[360px]">
            {!isLoading ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
            <CommandGroup>
              {results.map((option) => {
                return (
                  <CommandItem
                    key={option.id}
                    className="min-h-11 w-full py-2"
                    onSelect={() => {
                      onChange(option);
                      setQuery("");
                      setShowAll(false);
                      setOpen(false);
                    }}
                    value={`${option.ticker} ${option.name} ${option.symbol}`}
                  >
                    <Check
                      aria-hidden
                      className={cn(
                        "mr-2 size-4",
                        option.id === value?.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                      <div className="flex items-center gap-2">
                        <InstrumentLogoImage
                          className="size-4"
                          fallbackText={option.ticker}
                          size={16}
                          src={option.logoUrl}
                        />
                        <span className="font-mono text-sm font-semibold tabular-nums">
                          {option.ticker}
                        </span>
                      </div>
                      <span className="truncate text-sm text-muted-foreground">
                        {option.name}
                      </span>
                      {option.exchange ? (
                        <Badge
                          className="max-w-[140px] truncate bg-muted text-[10px] text-muted-foreground"
                          title={option.exchange}
                        >
                          {option.exchange}
                        </Badge>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div
                      className="flex min-h-11 items-center gap-3 px-3 py-2"
                      key={`loading-${index}`}
                    >
                      <div className="size-6 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
                        <div className="h-2 w-36 animate-pulse rounded-full bg-muted" />
                      </div>
                      <div className="h-3 w-10 animate-pulse rounded-full bg-muted" />
                    </div>
                  ))
                : null}
              {showMoreAction ? (
                <CommandItem
                  onSelect={() => setShowAll(true)}
                  value="Pokaż więcej"
                >
                  <span className="text-sm text-muted-foreground">
                    Pokaż więcej wyników
                  </span>
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
