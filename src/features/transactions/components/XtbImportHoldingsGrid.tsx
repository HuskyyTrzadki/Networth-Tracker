"use client";

import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";

import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
import {
  applyInstrumentOverrideToRows,
  buildHoldingOverrideGroups,
} from "@/features/transactions/lib/xtb-import-holding-overrides";
import type { XtbImportPreviewHolding, XtbImportPreviewRow } from "../lib/xtb-import-types";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";
import { InstrumentCombobox } from "./InstrumentCombobox";

const formatMoney = (value: string | null, currency: string) => {
  if (!value) {
    return "Brak wyceny";
  }

  const formatter = getCurrencyFormatter(currency);
  if (!formatter) {
    return `${value} ${currency}`;
  }

  return formatCurrencyString(value, formatter) ?? `${value} ${currency}`;
};

type Props = Readonly<{
  baseCurrency: string;
  holdings: readonly XtbImportPreviewHolding[];
  rows: readonly XtbImportPreviewRow[];
  onRowsChange: (next: XtbImportPreviewRow[]) => void;
  searchClient?: InstrumentSearchClient;
}>;

export function XtbImportHoldingsGrid({
  baseCurrency,
  holdings,
  rows,
  onRowsChange,
  searchClient,
}: Props) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const groups = useMemo(() => buildHoldingOverrideGroups(rows, holdings), [holdings, rows]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h5 className="text-sm font-semibold text-foreground">Otwarte pozycje po imporcie</h5>
        <p className="text-xs text-muted-foreground">
          To najszybsza kontrola: sprawdź, czy nazwy i liczba sztuk zgadzają się z XTB. Jeśli XTB podał zbyt ogólną nazwę, użyj „Zmień”, aby przepisać wszystkie pasujące wiersze na właściwy instrument.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const displayInstrument = group.instrument;
          const holding = group.valuationHolding;
          const visual = resolveInstrumentVisual({
            symbol: displayInstrument?.symbol ?? group.sourceTickerHint ?? group.sourceLabel,
            ticker: displayInstrument?.ticker ?? group.sourceTickerHint,
            name: displayInstrument?.name ?? group.sourceLabel,
            provider: displayInstrument?.provider ?? null,
            instrumentType: displayInstrument?.instrumentType ?? null,
          });
          const isEditing = editingKey === group.key;

          return (
            <div
              key={group.key}
              className="rounded-xl border border-border/70 bg-muted/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <InstrumentLogoImage
                    src={holding?.logoUrl ?? displayInstrument?.logoUrl ?? null}
                    ticker={visual.logoTicker}
                    isCash={visual.isCash}
                    customAssetType={visual.customAssetType}
                    size={40}
                    alt={displayInstrument?.name ?? group.sourceLabel}
                    fallbackText={visual.label}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {displayInstrument?.name ?? group.sourceLabel}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      XTB: {group.sourceLabel}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {displayInstrument?.symbol ?? group.sourceTickerHint ?? "Brak dopasowania"}
                      {displayInstrument?.exchange ? ` • ${displayInstrument.exchange}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                    {group.quantity} szt.
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg px-3"
                    onClick={() =>
                      setEditingKey((current) => (current === group.key ? null : group.key))
                    }
                  >
                    <PencilLine className="size-3.5" aria-hidden />
                    Zmień
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {formatMoney(holding?.valueBase ?? null, baseCurrency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cena: {formatMoney(holding?.price ?? null, holding?.currency ?? baseCurrency)}
                </p>
              </div>

              {group.needsInstrument ? (
                <p className="mt-3 text-xs text-amber-700">
                  Ta pozycja nadal wymaga dopasowania instrumentu przed importem.
                </p>
              ) : holding?.missingReason ? (
                <p className="mt-3 text-xs text-amber-700">
                  {holding.missingReason === "MISSING_QUOTE"
                    ? "Brakuje aktualnej ceny dla tej pozycji."
                    : "Brakuje kursu FX do wyceny tej pozycji."}
                </p>
              ) : null}

              {isEditing ? (
                <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground">
                    Zmienimy instrument dla {group.rowCount} wierszy XTB z etykietą „{group.sourceLabel}”.
                  </p>
                  <InstrumentCombobox
                    value={displayInstrument}
                    onChange={(next) => {
                      onRowsChange(applyInstrumentOverrideToRows(rows, group.key, next));
                      setEditingKey(null);
                    }}
                    searchClient={searchClient}
                    emptyLabel={group.sourceLabel}
                    queryPlaceholder="Szukaj właściwego instrumentu"
                    triggerClassName="h-10 rounded-lg border-border/70 text-[12px]"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
