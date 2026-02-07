type ParsedCpiRow = Readonly<{
  periodDate: string;
  value: number;
}>;

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toIsoMonthDate = (rawValue: unknown) => {
  if (typeof rawValue !== "string") {
    return null;
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const macroPeriodMatch = value.match(/^(\d{4})M(\d{2})$/);
  if (macroPeriodMatch) {
    const [, year, month] = macroPeriodMatch;
    return `${year}-${month}-01`;
  }

  const dateMatch = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (dateMatch) {
    const [, year, month] = dateMatch;
    return `${year}-${month}-01`;
  }

  return null;
};

const parseRowPeriodDate = (row: Record<string, unknown>) => {
  const fromPeriod = toIsoMonthDate(row.okres);
  if (fromPeriod) {
    return fromPeriod;
  }

  const fromDate = toIsoMonthDate(row.date);
  if (fromDate) {
    return fromDate;
  }

  const yearValue = row.rok;
  const monthValue =
    row.miesiac ?? row.miesiąc ?? row.month ?? row.okres ?? row.month_id;
  const year = toNumber(yearValue);
  const month = toNumber(monthValue);

  if (
    year &&
    Number.isInteger(year) &&
    month &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  ) {
    const monthString = String(month).padStart(2, "0");
    return `${year}-${monthString}-01`;
  }

  return null;
};

const parseRowValue = (row: Record<string, unknown>) =>
  toNumber(row.wartosc ?? row.value ?? row.val ?? row.amount);

export const parseEurostatJsonStatPayload = (payload: unknown): ParsedCpiRow[] => {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("dimension" in payload) ||
    !("value" in payload)
  ) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const dimension = root.dimension as Record<string, unknown>;
  const timeDimension =
    dimension.time && typeof dimension.time === "object"
      ? (dimension.time as Record<string, unknown>)
      : null;
  const category =
    timeDimension?.category && typeof timeDimension.category === "object"
      ? (timeDimension.category as Record<string, unknown>)
      : null;
  const indexMap =
    category?.index && typeof category.index === "object"
      ? (category.index as Record<string, unknown>)
      : null;
  const labelMap =
    category?.label && typeof category.label === "object"
      ? (category.label as Record<string, unknown>)
      : null;

  if (!indexMap) {
    return [];
  }

  const valuesRaw = root.value;
  const byPeriodDate = new Map<string, number>();
  const indexEntries = Object.entries(indexMap)
    .map(([key, positionRaw]) => ({
      key,
      position: toNumber(positionRaw),
    }))
    .filter(
      (
        entry
      ): entry is {
        key: string;
        position: number;
      } => entry.position !== null
    )
    .sort((a, b) => a.position - b.position);

  indexEntries.forEach((entry) => {
    const maybeLabel = labelMap?.[entry.key];
    const periodDate =
      toIsoMonthDate(entry.key) ??
      toIsoMonthDate(maybeLabel) ??
      (toNumber(entry.key) ? `${entry.key}-01-01` : null);
    if (!periodDate) {
      return;
    }

    const valueRaw = Array.isArray(valuesRaw)
      ? valuesRaw[entry.position]
      : valuesRaw && typeof valuesRaw === "object"
        ? (valuesRaw as Record<string, unknown>)[String(entry.position)]
        : null;
    const value = toNumber(valueRaw);
    if (value === null) {
      return;
    }

    byPeriodDate.set(periodDate, value);
  });

  return Array.from(byPeriodDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodDate, value]) => ({ periodDate, value }));
};

const parseFallbackRowsPayload = (payload: unknown): ParsedCpiRow[] => {
  const rowsRaw = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? (["data", "values", "results", "wyniki"]
          .map((key) => (payload as Record<string, unknown>)[key])
          .find((candidate) => Array.isArray(candidate)) ?? [])
      : [];

  const byPeriodDate = new Map<string, number>();

  rowsRaw.forEach((rowRaw) => {
    if (!rowRaw || typeof rowRaw !== "object") {
      return;
    }

    const row = rowRaw as Record<string, unknown>;
    const fromYear = toNumber(row.year);
    if (fromYear && Number.isInteger(fromYear) && !row.okres && !row.date && !row.rok) {
      const yearPeriod = `${fromYear}-01-01`;
      const yearValue = parseRowValue(row);
      if (yearValue !== null) {
        byPeriodDate.set(yearPeriod, yearValue);
      }
      return;
    }

    const periodDate = parseRowPeriodDate(row);
    if (!periodDate) {
      return;
    }

    const value = parseRowValue(row);
    if (value === null) {
      return;
    }

    byPeriodDate.set(periodDate, value);
  });

  return Array.from(byPeriodDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodDate, value]) => ({ periodDate, value }));
};

export const parsePolishCpiPayload = (payload: unknown): ParsedCpiRow[] => {
  const eurostatRows = parseEurostatJsonStatPayload(payload);
  if (eurostatRows.length > 0) {
    return eurostatRows;
  }

  return parseFallbackRowsPayload(payload);
};

export const isEurostatEmptySelection = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const root = payload as Record<string, unknown>;
  if (root.class !== "dataset") {
    return false;
  }

  const valueRaw = root.value;
  const isValueEmptyObject =
    valueRaw &&
    typeof valueRaw === "object" &&
    !Array.isArray(valueRaw) &&
    Object.keys(valueRaw as Record<string, unknown>).length === 0;

  if (!isValueEmptyObject) {
    return false;
  }

  const dimension =
    root.dimension && typeof root.dimension === "object"
      ? (root.dimension as Record<string, unknown>)
      : null;
  const unit =
    dimension?.unit && typeof dimension.unit === "object"
      ? (dimension.unit as Record<string, unknown>)
      : null;
  const category =
    unit?.category && typeof unit.category === "object"
      ? (unit.category as Record<string, unknown>)
      : null;
  const unitIndex =
    category?.index && typeof category.index === "object"
      ? (category.index as Record<string, unknown>)
      : null;

  return Boolean(unitIndex && Object.keys(unitIndex).length === 0);
};

export const __test__ = {
  isEurostatEmptySelection,
  parsePolishCpiPayload,
  parseEurostatJsonStatPayload,
  toIsoMonthDate,
};
