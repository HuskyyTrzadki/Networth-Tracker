"use client";

import debounce from "lodash.debounce";
import { Bitcoin, CandlestickChart, Check, ChevronsUpDown, Layers2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
}>;

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 280;
const LOCAL_LIMIT = 3;
const ALL_RESULTS_LIMIT = 50;

type TypeIcon = typeof CandlestickChart;

const instrumentTypeMeta: Record<InstrumentType, { label: string; icon: TypeIcon }> = {
  EQUITY: { label: "Akcje", icon: CandlestickChart },
  ETF: { label: "ETF", icon: Layers2 },
  CRYPTOCURRENCY: { label: "Krypto", icon: Bitcoin },
  MUTUALFUND: { label: "Fundusze", icon: Layers2 },
  CURRENCY: { label: "Waluty", icon: CandlestickChart },
  INDEX: { label: "Indeksy", icon: CandlestickChart },
  OPTION: { label: "Opcje", icon: CandlestickChart },
  FUTURE: { label: "Futures", icon: CandlestickChart },
  MONEYMARKET: { label: "Money Market", icon: CandlestickChart },
  ECNQUOTE: { label: "ECN", icon: CandlestickChart },
  ALTSYMBOL: { label: "Alt", icon: CandlestickChart },
};

const filterableTypes = ["EQUITY", "ETF", "CRYPTOCURRENCY"] as const;
type FilterableType = (typeof filterableTypes)[number];

const typeFilters: Array<{ value: "all" | FilterableType; label: string }> = [
  { value: "all", label: "Wszystko" },
  { value: "EQUITY", label: instrumentTypeMeta.EQUITY.label },
  { value: "ETF", label: instrumentTypeMeta.ETF.label },
  { value: "CRYPTOCURRENCY", label: instrumentTypeMeta.CRYPTOCURRENCY.label },
];

export function InstrumentCombobox({ value, onChange, searchClient }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [activeType, setActiveType] = useState<"all" | FilterableType>("all");

  const debouncedCommit = useMemo(
    () => debounce((nextValue: string) => setDebouncedQuery(nextValue), DEBOUNCE_MS),
    []
  );

  useEffect(() => () => debouncedCommit.cancel(), [debouncedCommit]);

  const { results, isLoading, error } = useInstrumentSearch(debouncedQuery, {
    minQueryLength: MIN_QUERY_LENGTH,
    searchClient,
    mode: showAll ? "all" : "auto",
    limit: showAll ? ALL_RESULTS_LIMIT : LOCAL_LIMIT,
  });

  const trimmedQuery = query.trim();
  const hasMinQuery = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const typeCounts = results.reduce<Record<FilterableType, number>>(
    (acc, option) => {
      const type = option.instrumentType ?? "EQUITY";
      if (filterableTypes.includes(type as FilterableType)) {
        acc[type as FilterableType] += 1;
      }
      return acc;
    },
    { EQUITY: 0, ETF: 0, CRYPTOCURRENCY: 0 }
  );

  const filteredResults =
    activeType === "all"
      ? results
      : results.filter(
          (option) => (option.instrumentType ?? "EQUITY") === activeType
        );

  const emptyMessage =
    !hasMinQuery
      ? "Wpisz min. 2 znaki."
      : isLoading
        ? "Szukam instrumentów…"
        : error
          ? "Nie udało się pobrać wyników."
          : results.length > 0 && filteredResults.length === 0
            ? "Brak wyników dla wybranego filtra."
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
          setActiveType("all");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between gap-3 px-3",
            !value && "text-muted-foreground"
          )}
          role="combobox"
          variant="outline"
        >
          <span className="flex min-w-0 items-center gap-3">
            {value ? (
              <>
                <span className="font-mono text-sm tabular-nums">
                  {value.ticker}
                </span>
                <span className="truncate text-sm text-foreground">
                  {value.name}
                </span>
              </>
            ) : (
              <span className="text-sm">
                Wybierz instrument…
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {value ? (
              <span className="font-mono text-xs text-muted-foreground">
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
          {hasMinQuery ? (
            <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
              {typeFilters.map((filter) => {
                const isActive = activeType === filter.value;
                const count =
                  filter.value === "all"
                    ? results.length
                    : typeCounts[filter.value];
                const isDisabled = filter.value !== "all" && count === 0;
                return (
                  <Button
                    className="h-7 gap-1.5 px-2.5 text-[11px]"
                    disabled={isDisabled}
                    key={filter.value}
                    onClick={() => setActiveType(filter.value)}
                    size="sm"
                    variant={isActive ? "secondary" : "outline"}
                  >
                    {filter.label}
                    <span className="text-[10px] text-muted-foreground">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : null}
          <CommandList>
            {!isLoading ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
            <CommandGroup>
              {filteredResults.map((option) => {
                return (
                  <CommandItem
                    key={option.id}
                    className="w-full"
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
                      className="flex items-center gap-3 px-3 py-2"
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
