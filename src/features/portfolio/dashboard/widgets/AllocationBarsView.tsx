"use client";

import {
  formatCurrencyString,
  getCurrencyFormatter,
} from "@/lib/format-currency";

import type { CurrencyCode } from "@/features/market-data";

import type { AllocationAssetRow } from "./allocation-view-model";

type Props = Readonly<{
  assets: readonly AllocationAssetRow[];
  baseCurrency: CurrencyCode;
}>;

type BarRow = Readonly<{
  id: string;
  label: string;
  share: number;
  color: string;
  valueLabel: string;
  shareLabel: string;
  tooltipLabel: string;
}>;

const MAX_LABEL_LENGTH = 22;
const MIN_BAR_WIDTH_PCT = 2;
const ROW_GRID_COLUMNS_CLASS =
  "grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)_minmax(11rem,14rem)]";

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

const formatAxisLabel = (label: string) => {
  if (label.length <= MAX_LABEL_LENGTH) return label;
  return `${label.slice(0, MAX_LABEL_LENGTH - 1)}...`;
};

const toBarWidthPercent = (share: number) => Math.max(share * 100, MIN_BAR_WIDTH_PCT);

export function AllocationBarsView({ assets, baseCurrency }: Props) {
  const formatter = getCurrencyFormatter(baseCurrency);

  if (assets.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
        Brak danych do alokacji
      </div>
    );
  }

  const rows: BarRow[] = assets.map((asset) => ({
    id: asset.id,
    label: asset.label,
    share: asset.share,
    color: asset.color,
    shareLabel: formatPercent(asset.share),
    valueLabel:
      formatter && asset.valueBase
        ? formatCurrencyString(asset.valueBase, formatter) ??
          `${asset.valueBase} ${baseCurrency}`
        : `${asset.valueBase} ${baseCurrency}`,
    tooltipLabel: `${asset.categoryLabel} • ${asset.label}`,
  }));

  return (
    <div className="h-full overflow-y-auto pr-1">
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-md border border-border/65 bg-muted/10 px-3 py-2.5"
            title={row.tooltipLabel}
          >
            <div className={`grid ${ROW_GRID_COLUMNS_CLASS} items-center gap-3`}>
              <span
                className="truncate font-mono text-[12px] font-semibold uppercase tracking-wide text-foreground"
                title={row.label}
              >
                {formatAxisLabel(row.label)}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-muted/45">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${toBarWidthPercent(row.share)}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
              <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                {row.shareLabel} • {row.valueLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
