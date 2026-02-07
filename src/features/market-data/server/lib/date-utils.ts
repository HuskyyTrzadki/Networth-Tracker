const formattersByTimeZone = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string) => {
  const existing = formattersByTimeZone.get(timeZone);
  if (existing) {
    return existing;
  }

  const next = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  formattersByTimeZone.set(timeZone, next);
  return next;
};

export const formatDateInTimeZone = (value: Date, timeZone: string) => {
  const parts = getFormatter(timeZone).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Could not format date in timezone ${timeZone}.`);
  }

  return `${year}-${month}-${day}`;
};

export const shiftIsoDate = (value: string, amountDays: number) => {
  const date = parseIsoDateUtc(value);
  if (!date) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  return formatIsoUtcDate(addUtcDays(date, amountDays));
};

export const subtractIsoDays = (value: string, amountDays: number) => {
  const date = parseIsoDateUtc(value);
  if (!date) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  return formatIsoUtcDate(addUtcDays(date, -amountDays));
};

export const isoDateRange = (fromIsoDate: string, toIsoDate: string) => {
  const from = parseIsoDateUtc(fromIsoDate);
  const to = parseIsoDateUtc(toIsoDate);
  if (!from || !to) {
    throw new Error("Invalid ISO date range.");
  }

  const fromMs = from.getTime();
  const toMs = to.getTime();
  if (fromMs > toMs) {
    return [];
  }

  const result: string[] = [];
  for (let cursorMs = fromMs; cursorMs <= toMs; cursorMs += DAY_MS) {
    result.push(formatIsoUtcDate(new Date(cursorMs)));
  }

  return result;
};

const DAY_MS = 86_400_000;

const parseIsoDateUtc = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatIsoUtcDate = (value: Date) => {
  const year = value.getUTCFullYear().toString().padStart(4, "0");
  const month = (value.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = value.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addUtcDays = (value: Date, amountDays: number) =>
  new Date(value.getTime() + amountDays * DAY_MS);
