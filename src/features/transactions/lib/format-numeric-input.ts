const DIGIT_RE = /\d/;
const DOT_RE = /\./g;
const NBSP_RE = /\u00a0/g;
const WHITESPACE_RE = /\s+/g;
const NON_NUMERIC_UNSIGNED_RE = /[^\d,]/g;
const NON_NUMERIC_SIGNED_RE = /[^\d,-]/g;

type FormatOptions = Readonly<{
  allowNegative?: boolean;
  maxFractionDigits?: number;
}>;

const sanitize = (value: string, options?: FormatOptions) => {
  const normalized = value
    .replace(NBSP_RE, " ")
    .replace(DOT_RE, ",")
    .replace(WHITESPACE_RE, "");

  if (!options?.allowNegative) {
    return normalized.replace(NON_NUMERIC_UNSIGNED_RE, "");
  }

  const hasLeadingMinus = normalized.startsWith("-");
  const unsigned = normalized
    .replace(NON_NUMERIC_SIGNED_RE, "")
    .replace(/-/g, "");
  return hasLeadingMinus ? `-${unsigned}` : unsigned;
};

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
  const normalized = sanitize(value, options);
  if (!normalized) return null;

  const isNegative = normalized.startsWith("-");
  const unsigned = isNegative ? normalized.slice(1) : normalized;
  if (!unsigned) {
    return {
      integer: "",
      fraction: "",
      hasSeparator: false,
      isNegative,
      keepTrailingSeparator: false,
      signOnly: true,
    } as const;
  }

  const separatorIndex = unsigned.indexOf(",");
  const hasSeparator = separatorIndex >= 0;
  const integerRaw = hasSeparator ? unsigned.slice(0, separatorIndex) : unsigned;
  const fractionRaw = hasSeparator
    ? unsigned.slice(separatorIndex + 1).replace(/,/g, "")
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
    isNegative,
    keepTrailingSeparator: hasSeparator && normalized.endsWith(","),
    signOnly: false,
  } as const;
};

export const formatNumericInput = (value: string, options?: FormatOptions) => {
  const parts = parseParts(value, options);
  if (!parts) return "";
  if (parts.signOnly) return "-";
  const integerWithSign = `${parts.isNegative ? "-" : ""}${parts.integer}`;

  if (!parts.hasSeparator) return integerWithSign;
  if (!parts.fraction) {
    return parts.keepTrailingSeparator
      ? `${integerWithSign},`
      : integerWithSign;
  }
  return `${integerWithSign},${parts.fraction}`;
};

export const formatNumericInputWithCursor = (
  value: string,
  cursor: number | null,
  options?: FormatOptions
) => {
  const formatted = formatNumericInput(value, options);
  if (cursor === null) return { value: formatted, cursor: null } as const;

  const normalizedBeforeCursor = sanitize(value.slice(0, cursor), options);
  const separatorBeforeCursor = normalizedBeforeCursor.indexOf(",");
  const formattedSeparator = formatted.indexOf(",");
  const cursorStart =
    options?.allowNegative &&
    normalizedBeforeCursor.startsWith("-") &&
    formatted.startsWith("-")
      ? 1
      : 0;

  if (
    options?.allowNegative &&
    normalizedBeforeCursor === "-" &&
    formatted.startsWith("-")
  ) {
    return { value: formatted, cursor: 1 } as const;
  }

  if (separatorBeforeCursor < 0 || formattedSeparator < 0) {
    return {
      value: formatted,
      cursor: mapDigitsToCursor(
        formatted,
        countDigits(normalizedBeforeCursor),
        cursorStart
      ),
    } as const;
  }

  const integerDigits = countDigits(
    normalizedBeforeCursor.slice(0, separatorBeforeCursor)
  );
  const fractionDigits = countDigits(
    normalizedBeforeCursor.slice(separatorBeforeCursor + 1)
  );
  const integerCursor = mapDigitsToCursor(formatted, integerDigits, cursorStart);

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
