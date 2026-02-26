"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import { cn } from "@/lib/cn";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";
import { multiplyDecimals, parseDecimalString } from "@/lib/decimal";
import { formatNumericInputWithCursor } from "@/features/transactions/lib/format-numeric-input";
import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";
import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";
import { InstrumentCombobox } from "@/features/transactions/components/InstrumentCombobox";

export type HoldingRow = Readonly<{
  id: string;
  ticker: string;
  quantity: string;
  instrument: InstrumentSearchResult | null;
}>;

export function ScreenshotHoldingsTable({
  rows,
  missingTickers,
  pricesByInstrumentId,
  onChange,
  searchClient,
}: Readonly<{
  rows: HoldingRow[];
  missingTickers: readonly string[];
  pricesByInstrumentId: Readonly<
    Record<string, Readonly<{ price: string | null; currency: string }>>
  >;
  onChange: (next: HoldingRow[]) => void;
  searchClient?: InstrumentSearchClient;
}>) {
  const formatPrice = (price: string | null, currency: string) => {
    if (!price) return "—";
    const formatter = getCurrencyFormatter(currency);
    if (!formatter) return `${price} ${currency}`;
    return formatCurrencyString(price, formatter) ?? `${price} ${currency}`;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/70">
      <div className="grid grid-cols-[120px_minmax(0,560px)_120px_110px_140px_44px] items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>Ticker</span>
        <span>Instrument</span>
        <span className="text-right">Cena</span>
        <span className="text-right">Ilość</span>
        <span className="text-right">Wartość</span>
        <span />
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((row) => {
          const normalizedTicker = row.ticker.trim().toUpperCase();
          const isMissing = missingTickers.includes(normalizedTicker);
          const isCash = isSupportedCashCurrency(normalizedTicker);
          const missingTicker = !normalizedTicker || isMissing;
          const priceInfo = row.instrument
            ? pricesByInstrumentId[row.instrument.id]
            : null;
          const priceDecimal = parseDecimalString(priceInfo?.price ?? null);
          const quantityDecimal = parseDecimalString(row.quantity);
          const rowValueFormatter = getCurrencyFormatter(priceInfo?.currency ?? "");
          const rowValue =
            priceDecimal &&
            quantityDecimal &&
            rowValueFormatter
              ? formatCurrencyString(
                  multiplyDecimals(quantityDecimal, priceDecimal).toString(),
                  rowValueFormatter
                )
              : null;

          return (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-[120px_minmax(0,560px)_120px_110px_140px_44px] items-center gap-3 px-4 py-2.5",
                missingTicker ? "bg-amber-50/50" : "bg-background"
              )}
            >
              <Input
                value={row.ticker}
                className={cn(
                  "h-10 rounded-md font-mono tabular-nums",
                  missingTicker ? "border-amber-300 bg-amber-50" : ""
                )}
                onChange={(event) => {
                  const next = event.target.value.toUpperCase();
                  onChange(
                    rows.map((item) =>
                      item.id === row.id ? { ...item, ticker: next, instrument: null } : item
                    )
                  );
                }}
              />
              <div className="flex h-10 items-center">
                {isCash ? (
                  <span className="flex h-10 items-center text-xs text-muted-foreground">
                    Pozycja gotówkowa
                  </span>
                ) : (
                  <div className="w-full max-w-[560px]">
                    <InstrumentCombobox
                      value={row.instrument}
                      onChange={(next) => {
                        onChange(
                          rows.map((item) =>
                            item.id === row.id
                              ? { ...item, ticker: next.ticker, instrument: next }
                              : item
                          )
                        );
                      }}
                      searchClient={searchClient}
                      emptyLabel="Wyszukaj instrument"
                      queryPlaceholder="Szukaj instrumentu"
                      triggerClassName="h-10 rounded-md text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="flex h-10 items-center justify-end text-right text-sm text-muted-foreground">
                {isCash
                  ? "—"
                  : formatPrice(priceInfo?.price ?? null, priceInfo?.currency ?? "")}
              </div>
              <Input
                value={row.quantity}
                className={cn(
                  "h-10 rounded-md font-mono tabular-nums text-right",
                  row.quantity.trim().length === 0 ? "border-amber-300 bg-amber-50" : ""
                )}
                inputMode="decimal"
                onChange={(event) => {
                  const next = formatNumericInputWithCursor(
                    event.target.value,
                    event.target.selectionStart
                  );
                  onChange(
                    rows.map((item) =>
                      item.id === row.id ? { ...item, quantity: next.value } : item
                    )
                  );
                  if (next.cursor !== null) {
                    requestAnimationFrame(() => {
                      event.target.setSelectionRange(next.cursor, next.cursor);
                    });
                  }
                }}
              />
              <div className="flex h-10 items-center justify-end text-right text-sm font-medium text-foreground">
                {isCash ? "—" : (rowValue ?? "—")}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
                aria-label="Usuń pozycję"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
