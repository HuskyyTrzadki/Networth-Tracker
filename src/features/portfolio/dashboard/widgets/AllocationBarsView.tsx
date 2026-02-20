"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
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

type BarLabelProps = Readonly<{
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
}>;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

const formatTooltipPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);

const rowHeight = 34;
const minChartHeight = 280;

const formatAxisLabel = (label: string) => {
  if (label.length <= 20) return label;
  return `${label.slice(0, 19)}...`;
};

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

  const chartHeight = Math.max(minChartHeight, rows.length * rowHeight);

  const renderRightLabel = ({ x, y, width, height, index }: BarLabelProps) => {
    if (typeof index !== "number") {
      return null;
    }

    const row = rows[index];
    if (!row) return null;

    const xNumber = Number(typeof x === "string" ? x : x ?? Number.NaN);
    const yNumber = Number(typeof y === "string" ? y : y ?? Number.NaN);
    const widthNumber = Number(typeof width === "string" ? width : width ?? Number.NaN);
    const heightNumber = Number(
      typeof height === "string" ? height : height ?? Number.NaN
    );
    if (
      Number.isNaN(xNumber) ||
      Number.isNaN(yNumber) ||
      Number.isNaN(widthNumber) ||
      Number.isNaN(heightNumber)
    ) {
      return null;
    }

    const centerY = yNumber + heightNumber / 2;

    return (
      <text
        x={xNumber + widthNumber + 10}
        y={centerY}
        dy={4}
        fill="#4e4a43"
        fontFamily="var(--font-mono)"
        fontSize={11}
      >
        <tspan>{row.shareLabel}</tspan>
        <tspan dx={6} fill="#7a7469">
          {row.valueLabel}
        </tspan>
      </text>
    );
  };

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 8, right: 220, left: 170, bottom: 8 }}
            barCategoryGap={8}
          >
            <XAxis type="number" domain={[0, 1]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={160}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fill: "#34312d", fontSize: 12, fontFamily: "var(--font-mono)" }}
              tickFormatter={formatAxisLabel}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload as BarRow | undefined;
                if (!data) return null;

                return (
                  <div className="rounded-md border border-border/80 bg-popover px-3 py-2 text-[12px] shadow-[var(--shadow)]">
                    <div className="font-medium text-foreground">{data.tooltipLabel}</div>
                    <div className="mt-1 font-mono text-[12px] tabular-nums text-muted-foreground">
                      {formatTooltipPercent(data.share)} • {data.valueLabel}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="share" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={350}>
              {rows.map((row) => (
                <Cell key={row.id} fill={row.color} />
              ))}
              <LabelList dataKey="share" position="right" content={renderRightLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
