"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { InstrumentCombobox } from "./InstrumentCombobox";
import { Badge } from "@/features/design-system/components/ui/badge";
import type { InstrumentSearchClient } from "../client/search-instruments";
import type { XtbImportPreviewRow } from "../lib/xtb-import-types";
import { cn } from "@/lib/cn";

export function XtbImportReviewTable({
  rows,
  onRowsChange,
  searchClient,
}: Readonly<{
  rows: readonly XtbImportPreviewRow[];
  onRowsChange: (next: XtbImportPreviewRow[]) => void;
  searchClient?: InstrumentSearchClient;
}>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--surface-shadow)]">
      <div className="grid grid-cols-[110px_120px_minmax(0,260px)_110px_110px_110px_150px] gap-3 border-b border-border/70 bg-muted/20 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span>Data</span>
        <span>Typ</span>
        <span>Instrument</span>
        <span className="text-right">Ilość</span>
        <span className="text-right">Cena</span>
        <span className="text-right">Kwota</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-border/70">
        {rows.map((row) => (
          <div
            key={row.previewId}
            className={cn(
              "grid grid-cols-[110px_120px_minmax(0,260px)_110px_110px_110px_150px] gap-3 px-4 py-3",
              row.status === "NEEDS_INSTRUMENT" ? "bg-amber-50/40" : "bg-background"
            )}
          >
            <div className="font-mono text-sm tabular-nums text-foreground">{row.tradeDate}</div>
            <div>
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                {row.sourceType}
              </Badge>
            </div>
            <div className="min-w-0">
              {row.requiresInstrument ? (
                <InstrumentCombobox
                  value={row.instrument}
                  onChange={(next) =>
                    onRowsChange(
                      rows.map((candidate) =>
                        candidate.previewId === row.previewId
                          ? { ...candidate, instrument: next, status: "READY" }
                          : candidate
                      )
                    )
                  }
                  searchClient={searchClient}
                  emptyLabel={row.instrumentLabel ?? "Wybierz instrument"}
                  queryPlaceholder="Szukaj instrumentu"
                  triggerClassName="h-10 rounded-lg border-border/70 text-[12px]"
                />
              ) : (
                <div className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2 text-sm text-foreground">
                  {row.instrumentLabel ?? `Gotówka ${row.accountCurrency}`}
                </div>
              )}
            </div>
            <div className="text-right font-mono text-sm tabular-nums text-foreground">
              {row.quantity}
            </div>
            <div className="text-right font-mono text-sm tabular-nums text-foreground">
              {row.price}
            </div>
            <div className="text-right font-mono text-sm tabular-nums text-foreground">
              {row.amount}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {row.status === "READY" ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  <span className="text-emerald-700">OK</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-4 text-amber-600" aria-hidden />
                  <span className="text-amber-700">Brak dopasowania</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
