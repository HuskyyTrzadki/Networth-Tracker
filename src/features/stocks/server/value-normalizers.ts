const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const normalizeEpochValue = (value: number) =>
  value > 0 && value < 10_000_000_000 ? value * 1000 : value;

export const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (isRecord(value) && "raw" in value) {
    return toFiniteNumber(value.raw);
  }

  return null;
};

export const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalizedValue =
    typeof value === "number" ? normalizeEpochValue(value) : value;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};
