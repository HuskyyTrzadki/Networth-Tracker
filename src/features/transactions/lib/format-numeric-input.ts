const DIGIT_RE = /\d/;
const DOT_RE = /\./g;
const NBSP_RE = /\u00a0/g;
const NON_NUMERIC_RE = /[^\d,\s]/g;
const WHITESPACE_RE = /\s+/g;

type FormatOptions = Readonly<{ maxFractionDigits?: number }>;

const sanitize = (value: string) =>
  value
    .replace(NBSP_RE, " ")
    .replace(DOT_RE, ",")
    .replace(NON_NUMERIC_RE, "")
    .replace(WHITESPACE_RE, "");

const countDigits = (value: string) => (value.match(/\d/g) ?? []).length;

const mapDigitsToCursor = (formatted: string, digits: number, start = 0) => {
  if (digits <= 0) return start;

  let seenDigits = 0;
  for (let index = start; index < formatted.length; index += 1) {
    if (!DIGIT_RE.test(formatted[index])) continue;
    seenDigits += 1;
    if (seenDigits === digits) return index + 1;
  }

  return formatted.length;
};

const parseParts = (value: string, options?: FormatOptions) => {
  const normalized = sanitize(value);
  if (!normalized) return null;

  const separatorIndex = normalized.indexOf(",");
  const hasSeparator = separatorIndex >= 0;
  const integerRaw = hasSeparator ? normalized.slice(0, separatorIndex) : normalized;
  const fractionRaw = hasSeparator
    ? normalized.slice(separatorIndex + 1).replace(/,/g, "")
    : "";

  const integer = (integerRaw.replace(/^0+(?=\d)/, "") || "0").replace(
    /\B(?=(\d{3})+(?!\d))/g,
    " "
  );
  const fraction =
    typeof options?.maxFractionDigits === "number"
      ? fractionRaw.slice(0, options.maxFractionDigits)
      : fractionRaw;

  return {
    integer,
    fraction,
    hasSeparator,
    keepTrailingSeparator: hasSeparator && normalized.endsWith(","),
  } as const;
};

export const formatNumericInput = (value: string, options?: FormatOptions) => {
  const parts = parseParts(value, options);
  if (!parts) return "";
  if (!parts.hasSeparator) return parts.integer;
  if (!parts.fraction) {
    return parts.keepTrailingSeparator ? `${parts.integer},` : parts.integer;
  }
  return `${parts.integer},${parts.fraction}`;
};

export const formatNumericInputWithCursor = (
  value: string,
  cursor: number | null,
  options?: FormatOptions
) => {
  const formatted = formatNumericInput(value, options);
  if (cursor === null) return { value: formatted, cursor: null } as const;

  const normalizedBeforeCursor = sanitize(value.slice(0, cursor));
  const separatorBeforeCursor = normalizedBeforeCursor.indexOf(",");
  const formattedSeparator = formatted.indexOf(",");

  if (separatorBeforeCursor < 0 || formattedSeparator < 0) {
    return {
      value: formatted,
      cursor: mapDigitsToCursor(formatted, countDigits(normalizedBeforeCursor)),
    } as const;
  }

  const integerDigits = countDigits(
    normalizedBeforeCursor.slice(0, separatorBeforeCursor)
  );
  const fractionDigits = countDigits(
    normalizedBeforeCursor.slice(separatorBeforeCursor + 1)
  );
  const integerCursor = mapDigitsToCursor(formatted, integerDigits);

  if (fractionDigits === 0) {
    return {
      value: formatted,
      cursor: Math.max(integerCursor, formattedSeparator + 1),
    } as const;
  }

  return {
    value: formatted,
    cursor: mapDigitsToCursor(formatted, fractionDigits, formattedSeparator + 1),
  } as const;
};
