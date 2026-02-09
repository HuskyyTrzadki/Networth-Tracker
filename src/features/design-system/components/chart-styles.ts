"use client";

export const SHARED_CHART_GRID_PROPS = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

export const SHARED_CHART_AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fillOpacity: 0.92,
  fontSize: 12,
} as const;

export const SHARED_CHART_AXIS_LINE = { stroke: "var(--border)" } as const;

export const SHARED_CHART_TICK_LINE = { stroke: "var(--border)" } as const;

export const SHARED_CHART_AXIS_WIDTH = 66;

export const SHARED_CHART_MARGIN = {
  top: 16,
  right: 10,
  bottom: 2,
  left: 0,
} as const;

export const SHARED_CHART_PRIMARY_LINE_WIDTH = 2.5;
export const SHARED_CHART_SECONDARY_LINE_WIDTH = 2.25;
export const SHARED_CHART_ACTIVE_DOT_RADIUS = 3.25;

const DAY_MS = 86_400_000;
const MONTH_ONLY_RANGE_DAYS = 180;

const formatDayMonth = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "short",
});

const formatMonthOnly = new Intl.DateTimeFormat("pl-PL", {
  month: "short",
});

const capitalizeFirst = (value: string) =>
  value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

const toTimeMs = (value: string) => {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : NaN;
};

export const shouldUseMonthTicks = (labels: readonly string[]) => {
  if (labels.length < 2) return false;

  const first = toTimeMs(labels[0]);
  const last = toTimeMs(labels[labels.length - 1]);
  if (!Number.isFinite(first) || !Number.isFinite(last)) return false;

  return (last - first) / DAY_MS >= MONTH_ONLY_RANGE_DAYS;
};

type SharedTimeAxisConfig = Readonly<{
  tickFormatter: (value: string) => string;
  ticks?: readonly string[];
  interval: "preserveStartEnd" | 0;
  minTickGap: number;
}>;

const toMonthKey = (date: Date) => date.getFullYear() * 12 + date.getMonth();

const buildQuarterlyTicks = (labels: readonly string[]) => {
  const quarterlyTicks: string[] = [];
  let previousMonthKey: number | null = null;

  labels.forEach((label) => {
    const date = new Date(label);
    if (Number.isNaN(date.getTime())) return;

    const monthKey = toMonthKey(date);
    if (previousMonthKey !== null && monthKey - previousMonthKey < 3) return;

    quarterlyTicks.push(label);
    previousMonthKey = monthKey;
  });

  return quarterlyTicks;
};

const createQuarterlyTickLabels = (ticks: readonly string[]) => {
  const labelsByTick = new Map<string, string>();
  let previousYear: number | null = null;

  ticks.forEach((tick, index) => {
    const date = new Date(tick);
    if (Number.isNaN(date.getTime())) {
      labelsByTick.set(tick, tick);
      return;
    }

    const year = date.getFullYear();
    const month = capitalizeFirst(formatMonthOnly.format(date));
    const shouldShowYear = index === 0 || previousYear !== year;
    labelsByTick.set(tick, shouldShowYear ? `${month} ${year}` : month);
    previousYear = year;
  });

  return labelsByTick;
};

export const createSharedTimeAxisConfig = (
  labels: readonly string[]
): SharedTimeAxisConfig => {
  const useMonthTicks = shouldUseMonthTicks(labels);

  if (!useMonthTicks) {
    return {
      tickFormatter: (value: string) =>
        capitalizeFirst(formatDayMonth.format(new Date(value))),
      interval: "preserveStartEnd",
      minTickGap: 20,
    };
  }

  const ticks = buildQuarterlyTicks(labels);
  const labelsByTick = createQuarterlyTickLabels(ticks);

  return {
    tickFormatter: (value: string) =>
      labelsByTick.get(value) ??
      capitalizeFirst(formatMonthOnly.format(new Date(value))),
    ticks,
    interval: 0,
    minTickGap: 32,
  };
};
