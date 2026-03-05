export type MixMode = "now" | "quarterly" | "annual";
export type QuarterKey = "q1" | "q2" | "q3" | "q4";

export type RevenueCell = Readonly<{
  value: string;
  trend?: "up" | "down" | "flat";
}>;

export type RevenueRow = Readonly<{
  name: string;
  iconLabel: string;
  q1: RevenueCell;
  q2: RevenueCell;
  q3: RevenueCell;
  q4: RevenueCell;
}>;

export type Slice = Readonly<{
  key: string;
  label: string;
  value: number;
  color: string;
  help: string;
}>;

export const QUARTER_LABELS: Readonly<Record<QuarterKey, string>> = {
  q1: "Q1-2025",
  q2: "Q2-2025",
  q3: "Q3-2025",
  q4: "Q4-2025",
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const parseCompactMoney = (raw: string) => {
  // Expected: "$41.9B" / "$0.41B" etc. Used by the report's demo revenue datasets.
  const normalized = raw.trim().replace("$", "");
  const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)([KMBT])$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const suffix = match[2].toUpperCase();
  if (!Number.isFinite(value)) return null;
  const multiplier =
    suffix === "K"
      ? 1e3
      : suffix === "M"
        ? 1e6
        : suffix === "B"
          ? 1e9
          : 1e12;
  return value * multiplier;
};

export const toPercentSlices = (
  entries: readonly { label: string; value: number; color: string; help: string }[]
): readonly Slice[] => {
  const total = entries.reduce((acc, item) => acc + item.value, 0);
  if (total <= 0 || !Number.isFinite(total)) return [];

  return entries
    .map((item) => ({
      key: item.label,
      label: item.label,
      value: clamp((item.value / total) * 100, 0, 100),
      color: item.color,
      help: item.help,
    }))
    .filter((slice) => Number.isFinite(slice.value) && slice.value > 0);
};

export const getQuarterCell = (
  row: RevenueRow,
  quarter: QuarterKey
) => {
  if (quarter === "q1") return row.q1;
  if (quarter === "q2") return row.q2;
  if (quarter === "q3") return row.q3;
  return row.q4;
};
