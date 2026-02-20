"use client";

import {
  TrendTooltipRow,
  TrendTooltipShell,
  UnifiedPortfolioTrendChart,
} from "./UnifiedPortfolioTrendChart";

type Point = Readonly<{
  label: string;
  portfolioValue: number | null;
  investedCapital: number | null;
}>;

type Props = Readonly<{
  data: readonly Point[];
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}>;

const defaultValueFormatter = (value: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value);

const defaultLabelFormatter = (label: string) => label;

const axisValueFormatter = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(value);

export function PortfolioComparisonChart({
  data,
  valueFormatter = defaultValueFormatter,
  labelFormatter = defaultLabelFormatter,
}: Props) {
  const chartData = data.map((entry) => ({
    label: entry.label,
    primary: entry.portfolioValue,
    lines: { investedCapital: entry.investedCapital },
  }));
  const hasInvestedCapital = data.some((entry) => entry.investedCapital !== null);

  return (
    <div className="h-full min-h-0">
      <UnifiedPortfolioTrendChart
        data={chartData}
        variant="value"
        primaryFormatter={valueFormatter}
        yAxisFormatter={axisValueFormatter}
        lines={
          hasInvestedCapital
            ? [
                {
                  id: "investedCapital",
                  label: "Zainwestowany kapitał",
                  color: "var(--chart-1)",
                  strokeStyle: "stepAfter",
                },
              ]
            : []
        }
        tooltipLabelFormatter={labelFormatter}
        renderTooltip={({ point, label, primaryColor }) => {
          const investedCapital = point.lines?.investedCapital;
          const gainLoss =
            point.primary !== null && typeof investedCapital === "number"
              ? point.primary - investedCapital
              : null;

          return (
            <TrendTooltipShell label={label}>
              <TrendTooltipRow
                label="Wartość portfela"
                value={point.primary !== null ? valueFormatter(point.primary) : "—"}
                color={primaryColor}
              />
              {hasInvestedCapital ? (
                <TrendTooltipRow
                  label="Zainwestowany kapitał"
                  value={
                    typeof investedCapital === "number"
                      ? valueFormatter(investedCapital)
                      : "—"
                  }
                  color="var(--chart-1)"
                />
              ) : null}
              <TrendTooltipRow
                label="Zysk/strata"
                value={gainLoss !== null ? valueFormatter(gainLoss) : "—"}
                bordered
              />
            </TrendTooltipShell>
          );
        }}
      />
    </div>
  );
}
