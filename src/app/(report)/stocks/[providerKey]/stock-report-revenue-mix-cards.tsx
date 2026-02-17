"use client";

import { ArrowDown } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "@/lib/recharts-dynamic";

import { Button } from "@/features/design-system/components/ui/button";

import StockReportInfoHint from "./StockReportInfoHint";
import {
  HOW_THEY_MAKE_MONEY,
  type HowTheyMakeMoneyMode,
  type HowTheyMakeMoneySliceKey,
} from "./stock-report-static-data";
import { clamp, type Slice } from "./stock-report-revenue-mix-helpers";

const getChangeTone = (direction: "up" | "down" | "flat") => {
  if (direction === "up") return "text-profit";
  if (direction === "down") return "text-loss";
  return "text-muted-foreground";
};

function MetricCard({
  label,
  value,
  change,
  changeDirection,
}: Readonly<{
  label: string;
  value: string;
  change: string;
  changeDirection: "up" | "down" | "flat";
}>) {
  return (
    <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className={`text-xs font-semibold ${getChangeTone(changeDirection)}`}>{change}</p>
    </div>
  );
}

function MarginBar({
  label,
  description,
  valuePercent,
}: Readonly<{
  label: string;
  description: string;
  valuePercent: number;
}>) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[172px_minmax(0,1fr)_auto] sm:gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="h-7 overflow-hidden rounded-sm border border-dashed border-[color:var(--report-rule)] bg-muted/20">
        <div
          className="relative h-full bg-profit"
          style={{ width: `${clamp(valuePercent, 0, 100)}%` }}
        >
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
            {valuePercent.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="hidden font-mono text-xs font-bold tabular-nums text-muted-foreground sm:block">
        {valuePercent.toFixed(1)}%
      </p>
    </div>
  );
}

function MarginDrop({
  label,
  dropPercent,
}: Readonly<{
  label: string;
  dropPercent: number;
}>) {
  if (!Number.isFinite(dropPercent) || dropPercent <= 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[172px_minmax(0,1fr)_auto] sm:gap-3">
      <div />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowDown className="size-3.5 text-loss" aria-hidden />
        <span className="font-semibold text-loss">-{dropPercent.toFixed(1)} pkt</span>
        <span>{label}</span>
      </div>
      <div />
    </div>
  );
}

export function DonutCard({
  title,
  subtitle,
  slices,
}: Readonly<{
  title: string;
  subtitle: string;
  slices: readonly Slice[];
}>) {
  return (
    <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold tracking-tight">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-[260px]">
          {slices.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[...slices]}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={76}
                  outerRadius={112}
                  paddingAngle={2}
                  stroke="var(--background)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px dashed var(--report-rule)",
                    borderRadius: "4px",
                    color: "var(--popover-foreground)",
                    boxShadow: "none",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/35 text-sm text-muted-foreground">
              Brak danych do wykresu
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {slices.map((slice) => (
            <div
              key={slice.key}
              className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2 last:border-b-0 last:pb-0"
            >
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-foreground/85">{slice.label}</span>
                <StockReportInfoHint text={slice.help} ariaLabel={`Wyjasnienie: ${slice.label}`} />
              </div>
              <span className="font-mono text-sm font-bold tabular-nums">
                {slice.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

const getHowTheyMakeMoneySliceValue = (
  mode: HowTheyMakeMoneyMode,
  key: HowTheyMakeMoneySliceKey
) =>
  HOW_THEY_MAKE_MONEY[mode].slices.find((slice) => slice.key === key)?.valuePercent ?? 0;

export function ProfitabilitySnapshot({
  mode,
  onModeChange,
}: Readonly<{
  mode: HowTheyMakeMoneyMode;
  onModeChange: (next: HowTheyMakeMoneyMode) => void;
}>) {
  const dataset = HOW_THEY_MAKE_MONEY[mode];
  const cogs = getHowTheyMakeMoneySliceValue(mode, "COGS");
  const rd = getHowTheyMakeMoneySliceValue(mode, "R&D");
  const sga = getHowTheyMakeMoneySliceValue(mode, "SG&A");
  const taxes = getHowTheyMakeMoneySliceValue(mode, "Podatki");
  const net = getHowTheyMakeMoneySliceValue(mode, "Zysk");

  const grossMargin = clamp(100 - cogs, 0, 100);
  const operatingMargin = clamp(grossMargin - rd - sga, 0, 100);
  const netMargin = clamp(net, 0, 100);
  const operatingDrop = clamp(rd + sga, 0, 100);
  const netDrop = clamp(operatingMargin - netMargin, 0, 100);
  const impliedOther = clamp(100 - (cogs + rd + sga + taxes + net), 0, 100);

  const explanation = `Po kosztach produkcji zostaje ${grossMargin.toFixed(1)}% marzy brutto; po kosztach operacyjnych ${operatingMargin.toFixed(1)}%; finalnie ${netMargin.toFixed(1)}% zysku netto.`;
  const implication =
    netMargin >= 25
      ? "Wysoka marza netto daje duzy bufor na inwestycje i gorszy cykl."
      : "Marza netto jest umiarkowana, wiec dyscyplina kosztowa i monetyzacja nowych produktow maja duze znaczenie.";

  return (
    <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold tracking-tight">Jak firma zamienia przychody na zysk</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Szybkie podsumowanie i struktura marz (ostatni kwartal vs ostatni rok).
          </p>
        </div>

        <div className="inline-flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 rounded-sm px-3 text-xs"
            variant={mode === "lastQuarter" ? "default" : "outline"}
            onClick={() => onModeChange("lastQuarter")}
          >
            Ostatni kwartal
          </Button>
          <Button
            size="sm"
            className="h-8 rounded-sm px-3 text-xs"
            variant={mode === "lastYear" ? "default" : "outline"}
            onClick={() => onModeChange("lastYear")}
          >
            Ostatni rok
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/35 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Szybkie podsumowanie
        </p>
        <p className="mt-1 text-sm text-foreground/90">{dataset.quickSummary}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dataset.metrics.slice(0, 4).map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            changeDirection={metric.changeDirection}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <h5 className="text-sm font-semibold tracking-tight">Jak kurczy sie marza</h5>
        <MarginBar label="Marza brutto" description="Po kosztach produkcji (COGS)" valuePercent={grossMargin} />
        <MarginDrop label="koszty operacyjne (R&D + SG&A)" dropPercent={operatingDrop} />
        <MarginBar label="Marza operacyjna" description="Po kosztach operacyjnych" valuePercent={operatingMargin} />
        <MarginDrop
          label={`podatki${impliedOther > 0 ? " i inne" : ""}`}
          dropPercent={netDrop}
        />
        <MarginBar label="Marza netto" description="Po odsetkach i podatkach" valuePercent={netMargin} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3 text-sm text-foreground/90">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Jak to czytac
          </p>
          <p className="mt-1 leading-7">{explanation}</p>
        </div>
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3 text-sm text-foreground/90">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Co to oznacza
          </p>
          <p className="mt-1 leading-7">{implication}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2">
        {dataset.slices.map((slice) => (
          <div key={slice.key} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-foreground/85">{slice.label}</span>
              <StockReportInfoHint text={slice.help} ariaLabel={`Wyjasnienie: ${slice.label}`} />
            </span>
            <span className="font-mono text-sm font-bold tabular-nums">{slice.valuePercent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </article>
  );
}
