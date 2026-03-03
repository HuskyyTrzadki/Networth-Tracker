"use client";

import * as React from "react";
import type { LegendProps, TooltipProps } from "recharts";

import { cn } from "@/lib/cn";

export type ChartConfig = {
  [key: string]: Readonly<{
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  }>;
};

type ChartContextValue = Readonly<{
  config: ChartConfig;
}>;

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("Chart components must be used inside <ChartContainer />");
  }
  return context;
}

const buildChartCssVars = (config: ChartConfig): React.CSSProperties => {
  return Object.entries(config).reduce<React.CSSProperties>((acc, [key, entry]) => {
    if (entry.color) {
      (acc as Record<string, string>)[`--color-${key}`] = entry.color;
    }
    return acc;
  }, {});
};

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
  }
>(({ id, className, children, config, style, ...props }, ref) => {
  const chartId = React.useId().replace(/:/g, "");
  const resolvedId = `chart-${id ?? chartId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={resolvedId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-axis-tick_text]:font-mono",
          "[&_.recharts-cartesian-axis-tick_text]:text-[11px]",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/45",
          "[&_.recharts-cartesian-grid_line]:stroke-dashed",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-dashed",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-[1px]",
          "[&_.recharts-dot[stroke='#fff']]:stroke-background",
          "[&_.recharts-layer.recharts-reference-line-line]:stroke-dashed",
          "[&_.recharts-legend-item]:font-mono",
          "[&_.recharts-legend-item-text]:text-muted-foreground",
          "[&_.recharts-pie-label-text]:font-mono",
          className
        )}
        style={{ ...buildChartCssVars(config), ...style }}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

type PayloadLike = Readonly<{
  color?: string;
  dataKey?: string;
  name?: string;
  value?: string | number;
  payload?: Record<string, unknown>;
}>;

const getPayloadConfig = (
  config: ChartConfig,
  payload: PayloadLike,
  key: string
) => {
  const payloadData = payload.payload;

  const nested = payloadData?.[key];
  const payloadKey =
    typeof nested === "string"
      ? nested
      : typeof payload[key as keyof PayloadLike] === "string"
        ? String(payload[key as keyof PayloadLike])
        : key;

  return config[payloadKey] ?? config[key];
};

type ChartTooltipContentProps = React.ComponentProps<"div"> &
  Partial<TooltipProps<string | number, string>> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  };

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      className,
      indicator = "dot",
      hideIndicator = false,
      hideLabel = false,
      labelFormatter,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) {
      return null;
    }

    const tooltipLabel = hideLabel
      ? null
      : (() => {
          const item = payload[0] as PayloadLike;
          const key = `${labelKey ?? item.dataKey ?? item.name ?? "value"}`;
          const itemConfig = getPayloadConfig(config, item, key);
          const value =
            !labelKey && typeof label === "string"
              ? config[label]?.label ?? label
              : itemConfig?.label;
          if (labelFormatter) {
            return (
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/90">
                {labelFormatter(value ?? label, payload)}
              </div>
            );
          }
          if (!value) {
            return null;
          }
          return (
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/90">
              {value}
            </div>
          );
        })();

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[10rem] gap-2 rounded-md border border-dashed border-border/70 bg-popover/98 px-3 py-2 text-xs shadow-[var(--surface-shadow)]",
          className
        )}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const entry = item as PayloadLike;
            const key = `${nameKey ?? entry.name ?? entry.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfig(config, entry, key);
            const indicatorColor = color ?? entry.color ?? itemConfig?.color ?? "var(--chart-1)";
            const formatted = formatter
              ? formatter(
                  entry.value ?? "—",
                  entry.name ?? key,
                  item as never,
                  index,
                  payload as never
                )
              : entry.value;
            const value = Array.isArray(formatted) ? formatted[0] : formatted;
            const labelValue = Array.isArray(formatted) ? formatted[1] : itemConfig?.label ?? entry.name ?? key;

            return (
              <div
                key={`${key}-${index}`}
                className={cn(
                  "flex items-center justify-between gap-3",
                  indicator === "dot" ? "items-center" : "items-end"
                )}
              >
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  {hideIndicator ? null : (
                    <span
                      className={cn(
                        "shrink-0 rounded-[2px] border-[color:var(--indicator-color)] bg-[color:var(--indicator-color)]",
                        indicator === "dot" && "size-2",
                        indicator === "line" && "h-3 w-1",
                        indicator === "dashed" && "h-0 w-3 border border-dashed bg-transparent"
                      )}
                      style={{ ["--indicator-color" as string]: indicatorColor } as React.CSSProperties}
                      aria-hidden
                    />
                  )}
                  <span className="truncate font-mono text-[11px]">{labelValue}</span>
                </div>
                <span className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
                  {value ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

type ChartLegendContentProps = React.ComponentProps<"div"> &
  Pick<LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean;
    nameKey?: string;
  };

export function ChartLegendContent({
  className,
  payload,
  hideIcon = false,
  nameKey,
}: ChartLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)}>
      {payload.map((item) => {
        const entry = item as PayloadLike;
        const key = `${nameKey ?? entry.dataKey ?? entry.name ?? "value"}`;
        const itemConfig = getPayloadConfig(config, entry, key);

        return (
          <div
            key={key}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/65 bg-background/80 px-2.5 py-1 text-[11px]"
          >
            {hideIcon ? null : itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <span
                className="size-2 rounded-[2px]"
                style={{
                  backgroundColor: entry.color ?? itemConfig?.color ?? "var(--chart-1)",
                }}
                aria-hidden
              />
            )}
            <span className="font-mono uppercase tracking-[0.08em] text-muted-foreground">
              {itemConfig?.label ?? entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
